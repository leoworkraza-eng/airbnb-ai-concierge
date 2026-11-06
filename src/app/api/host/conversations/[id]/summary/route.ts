import { NextResponse } from "next/server";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";
import { ConciergeError, generateConversationSummary } from "@/lib/claude/agent";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const repo = await getHostRepo();

  try {
    const properties = await repo.listProperties(session.hostId);
    const propertyIds = properties.map((property) => property.id);

    const conversation = await repo.getConversation(id);
    if (!conversation || !propertyIds.includes(conversation.propertyId)) {
      return NextResponse.json(
        { error: "That conversation isn't on one of your properties." },
        { status: 404 },
      );
    }

    const [messages, guest] = await Promise.all([
      repo.listMessages(conversation.id, 80),
      repo.getGuestSession(conversation.guestSessionId),
    ]);

    if (!messages.length) {
      return NextResponse.json(
        { error: "There are no messages to summarise yet." },
        { status: 400 },
      );
    }

    const property = properties.find((item) => item.id === conversation.propertyId);

    const summary = await generateConversationSummary({
      propertyName: property?.name ?? "Property",
      guestName: guest?.guestName ?? "Guest",
      messages,
    });

    await repo.setConversationSummary(conversation.id, summary);
    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof ConciergeError) {
      // Provider text can name accounts and quotas; it is logged, never shown.
      console.error("[host/summary] model error", error.code, error.message);
      const limited = error.code === "rate_limited";
      return NextResponse.json(
        {
          error: limited
            ? "The AI model has hit its free-tier limit for this minute. Try again shortly — the transcript is still saved."
            : "The summary could not be generated right now. Please try again.",
          code: error.code,
        },
        { status: limited ? 429 : 503, headers: limited ? { "Retry-After": "30" } : undefined },
      );
    }
    console.error("[host/summary] failed", error);
    return NextResponse.json(
      { error: "The summary could not be generated. Please try again." },
      { status: 500 },
    );
  }
}
