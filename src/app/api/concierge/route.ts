import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestRepo } from "@/lib/data";
import { getGuestContext } from "@/lib/guest-context";
import { ConciergeError, runConciergeTurn } from "@/lib/claude/agent";
import { rateLimit } from "@/lib/rate-limit";

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
      notice: result.notice ?? null,
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
      // Provider text can name accounts and quotas; it is logged, never shown.
      console.error("[concierge] model error", error.code, error.message);

      if (error.code === "not_configured") {
        return NextResponse.json(
          {
            error:
              "No AI model is connected yet. The guided concierge still answers from the property record — try again, or add an API key.",
            code: error.code,
          },
          { status: 503 },
        );
      }

      if (error.code === "rate_limited") {
        return NextResponse.json(
          {
            error:
              "The AI model has hit its free-tier limit for this minute. Ask again shortly — the guided answers still work in the meantime.",
            code: error.code,
          },
          { status: 429, headers: { "Retry-After": "30" } },
        );
      }

      return NextResponse.json(
        { error: "The concierge couldn't finish that answer. Please try again.", code: error.code },
        { status: 502 },
      );
    }

    console.error("[concierge] model request failed", error);
    return NextResponse.json(
      {
        error:
          "The concierge can't reach its model right now. Your message was saved — you can retry, report the issue in Support, or contact your host directly.",
        code: "upstream_error",
      },
      { status: 502 },
    );
  }
}
