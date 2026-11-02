import Anthropic from "@anthropic-ai/sdk";
import type { Repository } from "../data/repo";
import { env, isClaudeConfigured } from "../env";
import type { GuestSession, MaintenanceRequest, Message, Property, ToolEvent } from "../types";
import { buildSystemPrompt } from "./prompt";
import { executeTool, toolDefinitions } from "./tools";

/* ---------------------------------------------------------------------------
   The concierge agent loop.

   Sends the conversation to Claude with the property tools attached, executes
   any tool calls against the real database, feeds the results back, and repeats
   until Claude produces a final answer. Only the guest-visible text is stored
   as a chat message; tool activity is stored alongside it for the transcript.
   --------------------------------------------------------------------------- */

export class ConciergeError extends Error {
  constructor(
    readonly code: "not_configured" | "upstream" | "loop" | "empty",
    message: string,
  ) {
    super(message);
    this.name = "ConciergeError";
  }
}

let cachedClient: Anthropic | null = null;

function getClient() {
  if (!isClaudeConfigured) {
    throw new ConciergeError(
      "not_configured",
      "The concierge is not connected yet. Add ANTHROPIC_API_KEY to enable Claude.",
    );
  }
  cachedClient ??= new Anthropic({
    apiKey: env.anthropicKey,
    timeout: 60_000,
    maxRetries: 1,
  });
  return cachedClient;
}

export type TurnResult = {
  reply: string;
  toolEvents: ToolEvent[];
  ticket: MaintenanceRequest | null;
};

type ApiMessage = { role: "user" | "assistant"; content: unknown };

export async function runConciergeTurn(args: {
  repo: Repository;
  property: Property;
  guest: GuestSession;
  conversationId: string;
}): Promise<TurnResult> {
  const client = getClient();
  const { repo, property, guest, conversationId } = args;

  const history: Message[] = await repo.listMessages(conversationId, 40);
  if (!history.length) {
    throw new ConciergeError("empty", "There is no message to answer yet.");
  }

  const messages: ApiMessage[] = history.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const toolEvents: ToolEvent[] = [];
  let ticket: MaintenanceRequest | null = null;
  let finalText = "";

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const response = await client.messages.create({
      model: env.claudeModel,
      max_tokens: env.claudeMaxTokens,
      system: buildSystemPrompt(property, guest),
      tools: toolDefinitions as unknown as Anthropic.Messages.Tool[],
      messages: messages as unknown as Anthropic.Messages.MessageParam[],
    });

    const blocks = response.content as unknown as Array<Record<string, unknown>>;
    const textParts = blocks
      .filter((block) => block.type === "text")
      .map((block) => String(block.text ?? ""))
      .join("\n")
      .trim();

    if (textParts) finalText = textParts;

    const toolUses = blocks.filter((block) => block.type === "tool_use");
    if (!toolUses.length) break;

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Array<Record<string, unknown>> = [];

    for (const block of toolUses) {
      const name = String(block.name ?? "");
      const input = (block.input ?? {}) as Record<string, unknown>;
      const outcome = await executeTool(name, input, {
        repo,
        property,
        guest,
        conversationId,
      });

      toolEvents.push(outcome.event);
      if (outcome.ticket) ticket = outcome.ticket;

      toolResults.push({
        type: "tool_result",
        tool_use_id: String(block.id ?? ""),
        content: JSON.stringify(outcome.result),
        is_error: outcome.event.status === "error",
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  if (!finalText) {
    throw new ConciergeError(
      "loop",
      "The concierge could not finish that answer. Please try again.",
    );
  }

  return { reply: finalText, toolEvents, ticket };
}

export async function generateConversationSummary(args: {
  propertyName: string;
  guestName: string;
  messages: Message[];
}) {
  if (!isClaudeConfigured) {
    throw new ConciergeError(
      "not_configured",
      "Summary generation needs ANTHROPIC_API_KEY to be configured.",
    );
  }

  const transcript = args.messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => `${message.role === "user" ? "Guest" : "Concierge"}: ${message.content}`)
    .join("\n\n")
    .slice(0, 12_000);

  const client = getClient();
  const response = await client.messages.create({
    model: env.claudeModel,
    max_tokens: 400,
    system: buildSummaryPromptText(args.propertyName, args.guestName, transcript),
    messages: [{ role: "user", content: "Summarise this conversation." }],
  });

  const text = (response.content as unknown as Array<Record<string, unknown>>)
    .filter((block) => block.type === "text")
    .map((block) => String(block.text ?? ""))
    .join("\n")
    .trim();

  if (!text) throw new ConciergeError("empty", "The summary came back empty.");
  return text;
}

function buildSummaryPromptText(propertyName: string, guestName: string, transcript: string) {
  return `You write short internal briefs for a holiday-let host. Read the guest conversation and summarise it factually.

Property: ${propertyName}
Guest: ${guestName}

Return plain text with exactly these four labelled lines:
Needs: what the guest asked for.
Issues: problems or maintenance requests, with ticket numbers if mentioned; "None" if there were none.
Sentiment: one sentence on how the stay seems to be going.
Action: what the host may need to do, or "No action needed".

Use only what is in the conversation. Never invent details. Omit guest contact details. Keep it under 120 words.

Conversation:
${transcript}`;
}
