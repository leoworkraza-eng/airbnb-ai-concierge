import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestRepo } from "@/lib/data";
import { getGuestContext } from "@/lib/guest-context";
import { ConciergeError, runConciergeTurn } from "@/lib/claude/agent";
import { rateLimit } from "@/lib/rate-limit";
import { isConciergeConfigured } from "@/lib/env";

const bodySchema = z.object({
  message: z.string().trim().min(1, "Please write a message.").max(1500),
});

export async function POST(request: Request) {
  const context = await getGuestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Your guest session has ended. Start the demo again from the home page." },
      { status: 401 },
    );
  }

  const limit = rateLimit(`concierge:${context.guest.id}`, 15, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `You're sending messages quickly. Please wait ${limit.retryAfter}s before trying again.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  if (!isConciergeConfigured) {
    return NextResponse.json(
      {
        error:
          "The concierge is not connected to a model yet. Add a free AI_API_KEY (Groq or Google AI Studio) or ANTHROPIC_API_KEY to the server environment to enable live answers.",
        code: "claude_not_configured",
      },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "That message isn't valid."
        : "That message isn't valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const repo = await getGuestRepo();
  const conversation = await repo.getOrCreateConversation(
    context.guest.id,
    context.property.id,
  );

  await repo.addMessage({
    conversationId: conversation.id,
    role: "user",
    content: parsed.message,
  });

  try {
    const result = await runConciergeTurn({
      repo,
      property: context.property,
      guest: context.guest,
      conversationId: conversation.id,
    });

    const reply = await repo.addMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: result.reply,
      toolEvents: result.toolEvents,
    });

    return NextResponse.json({
      reply: {
        id: reply.id,
        content: reply.content,
        toolEvents: reply.toolEvents,
        createdAt: reply.createdAt,
      },
      ticket: result.ticket
        ? {
            code: result.ticket.ticketCode,
            priority: result.ticket.priority,
            status: result.ticket.status,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof ConciergeError) {
      const status = error.code === "not_configured" ? 503 : 502;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("[concierge] model request failed", error);
    return NextResponse.json(
      {
        error:
          "The concierge can't reach Claude right now. Your message was saved — you can retry, report the issue in Support, or contact your host directly.",
        code: "upstream_error",
      },
      { status: 502 },
    );
  }
}
