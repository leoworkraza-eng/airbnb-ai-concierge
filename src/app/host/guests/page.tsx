import Link from "next/link";
import { CalendarDays, MessageSquare, Sparkles, UserRound } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { SummaryButton } from "@/components/host/SummaryButton";
import { ConciergeAvatar } from "@/components/brand";
import { Card, EmptyState, Pill } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Guest interactions" };
export const dynamic = "force-dynamic";

export default async function HostGuestsPage() {
  const workspace = await getHostWorkspace();
  const { conversations, guests, properties } = workspace;

  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const propertyById = new Map(properties.map((property) => [property.id, property]));

  const entries = await Promise.all(
    conversations.map(async (conversation) => ({
      conversation,
      guest: guestById.get(conversation.guestSessionId),
      property: propertyById.get(conversation.propertyId),
      messages: await workspace.repo.listMessages(conversation.id, 40),
    })),
  );

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(properties)}
    >
      <div className="space-y-5">
        <div>
          <p className="eyebrow">Guest interactions</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            What your guests are asking
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
            Each conversation gets a short brief generated from the transcript, so you
            can understand the stay without reading every message. Guests only ever
            see their own conversation.
          </p>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            <h2 className="text-[15px] font-semibold">Guest preferences</h2>
            <Pill tone="neutral">Only what the guest chose to share</Pill>
          </div>
          {guests.length === 0 ? (
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              No guests yet. Preferences appear here when a guest asks the concierge
              to remember something.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {guests.map((stay) => (
                <li
                  key={stay.id}
                  className="rounded-xl border border-line bg-cream/50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium">{stay.guestName}</p>
                    <span className="text-[10.5px] text-muted">
                      {formatDate(stay.checkInDate)} → {formatDate(stay.checkOutDate)}
                    </span>
                  </div>
                  {stay.preferences.interests.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stay.preferences.interests.map((interest) => (
                        <Pill key={interest} tone="gold">
                          {interest}
                        </Pill>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11.5px] text-muted">
                      No interests saved.
                    </p>
                  )}
                  {stay.preferences.notes ? (
                    <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
                      {stay.preferences.notes}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[10px] text-muted">
                    Consent {stay.preferences.consent ? "given" : "not given"} · guest
                    can ask the concierge to forget this
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {entries.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-4" />}
            title="No guest conversations yet"
            description="Once a guest asks the concierge something, the conversation and its summary will appear here."
            action={
              <Link href="/stay" className="btn-secondary btn-sm">
                Open the guest experience
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {entries.map(({ conversation, guest, property, messages }) => (
              <Card key={conversation.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-sand text-[13px] font-semibold">
                      {(guest?.guestName ?? "G").slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold">
                        {guest?.guestName ?? "Guest"}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {guest
                            ? `${formatDate(guest.checkInDate)} → ${formatDate(guest.checkOutDate)}`
                            : "Stay dates unavailable"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          {messages.length} message{messages.length === 1 ? "" : "s"}
                        </span>
                        <span>{property?.name ?? "Property"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conversation.summary ? (
                      <Pill tone="gold">
                        <Sparkles className="size-3" /> AI summary
                      </Pill>
                    ) : (
                      <Pill tone="neutral">Not summarised</Pill>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-line bg-cream/50 p-4">
                  <p className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                    Host brief
                  </p>
                  {conversation.summary ? (
                    <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-soft">
                      {conversation.summary}
                    </p>
                  ) : (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                      No summary yet. Generate one from Claude using the transcript
                      below — it takes a few seconds.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <SummaryButton conversationId={conversation.id} />
                    <span className="text-[10.5px] text-muted">
                      {conversation.summary
                        ? "Regenerate to include newer messages"
                        : "Uses the stored transcript only"}
                    </span>
                  </div>
                </div>

                <details className="group mt-3">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[11.5px] font-medium text-ink-soft transition hover:text-ink">
                    <MessageSquare className="size-3.5" />
                    View transcript ({messages.length})
                  </summary>
                  <div className="mt-3 max-h-96 space-y-3 overflow-y-auto rounded-xl border border-line bg-white p-4">
                    {messages.length === 0 ? (
                      <p className="text-[12px] text-muted">No messages yet.</p>
                    ) : (
                      messages.map((message) =>
                        message.role === "user" ? (
                          <div key={message.id} className="flex justify-end">
                            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[12px] leading-relaxed text-cream">
                              {message.content}
                            </p>
                          </div>
                        ) : (
                          <div key={message.id} className="flex items-start gap-2">
                            <ConciergeAvatar size="sm" />
                            <div className="max-w-[85%]">
                              <p className="rounded-2xl rounded-tl-md border border-line bg-cream/60 px-3.5 py-2 text-[12px] leading-relaxed whitespace-pre-wrap text-ink-soft">
                                {message.content}
                              </p>
                              {message.toolEvents.length > 0 ? (
                                <p className="mt-1 text-[10px] text-muted">
                                  {message.toolEvents.map((event) => event.label).join(" · ")}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </details>

                <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted">
                  <UserRound className="size-3" />
                  Last activity {formatDateTime(conversation.lastMessageAt)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HostShell>
  );
}
