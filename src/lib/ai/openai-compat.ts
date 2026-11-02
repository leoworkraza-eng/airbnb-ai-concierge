import { buildSystemPrompt } from "../claude/prompt";
import { executeTool, toolDefinitions } from "../claude/tools";
import type { Repository } from "../data/repo";
import { env } from "../env";
import type { GuestSession, MaintenanceRequest, Message, Property, ToolEvent } from "../types";
import { ConciergeError, type TurnResult } from "./shared";

/* ---------------------------------------------------------------------------
   Free-mode agent loop.

   Speaks the OpenAI chat-completions dialect, which Groq, Google AI Studio,
   OpenRouter, Together and friends all expose, so the concierge can run on a
   card-free free tier. It executes exactly the same tools against the same
   database as the Claude path — only the transport differs.
   --------------------------------------------------------------------------- */

type OpenAiToolCall = {
  id: string;
  type?: string;
  function?: { name?: string; arguments?: string };
};

type OpenAiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: OpenAiToolCall[];
    };
  }>;
  error?: { message?: string };
};

const openAiTools = toolDefinitions.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  },
}));

function providerLabel() {
  try {
    return new URL(env.aiBaseUrl).host;
  } catch {
    return "the AI provider";
  }
}

async function complete(body: Record<string, unknown>): Promise<OpenAiResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${env.aiBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.aiApiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as OpenAiResponse | null;

    if (!response.ok) {
      const detail = payload?.error?.message ?? `HTTP ${response.status}`;
      throw new ConciergeError(
        "upstream",
        `${providerLabel()} rejected the request (${response.status}): ${String(detail).slice(0, 180)}`,
      );
    }

    return payload ?? {};
  } catch (error) {
    if (error instanceof ConciergeError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ConciergeError("upstream", `${providerLabel()} took too long to answer.`);
    }
    throw new ConciergeError(
      "upstream",
      error instanceof Error ? error.message : "The AI provider could not be reached.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function runOpenAiConciergeTurn(args: {
  repo: Repository;
  property: Property;
  guest: GuestSession;
  conversationId: string;
}): Promise<TurnResult> {
  const { repo, property, guest, conversationId } = args;

  const history: Message[] = await repo.listMessages(conversationId, 40);
  if (!history.length) {
    throw new ConciergeError("empty", "There is no message to answer yet.");
  }

  const messages: OpenAiMessage[] = [
    { role: "system", content: buildSystemPrompt(property, guest) },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const toolEvents: ToolEvent[] = [];
  let ticket: MaintenanceRequest | null = null;
  let finalText = "";

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const payload = await complete({
      model: env.aiModel,
      messages,
      tools: openAiTools,
      tool_choice: "auto",
      max_tokens: env.claudeMaxTokens,
    });

    const message = payload.choices?.[0]?.message;
    if (!message) {
      throw new ConciergeError("upstream", `${providerLabel()} returned an empty response.`);
    }

    const text = typeof message.content === "string" ? message.content.trim() : "";
    if (text) finalText = text;

    const calls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    if (!calls.length) break;

    messages.push({ role: "assistant", content: message.content ?? null, tool_calls: calls });

    for (const call of calls) {
      const name = call.function?.name ?? "";
      let input: Record<string, unknown> = {};

      try {
        const parsed = JSON.parse(call.function?.arguments || "{}");
        if (parsed && typeof parsed === "object") input = parsed as Record<string, unknown>;
      } catch {
        input = {};
      }

      const outcome = await executeTool(name, input, {
        repo,
        property,
        guest,
        conversationId,
      });

      toolEvents.push(outcome.event);
      if (outcome.ticket) ticket = outcome.ticket;

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(outcome.result),
      });
    }
  }

  if (!finalText) {
    throw new ConciergeError(
      "loop",
      "The concierge could not finish that answer. Please try again.",
    );
  }

  return { reply: finalText, toolEvents, ticket };
}

export async function runOpenAiSummary(prompt: string): Promise<string> {
  const payload = await complete({
    model: env.aiModel,
    messages: [{ role: "system", content: prompt }],
    max_tokens: 400,
  });

  const text = (payload.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new ConciergeError("empty", "The summary came back empty.");
  return text;
}
