import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { ConciergeChat } from "@/components/chat/ConciergeChat";
import { Card, Note, Pill } from "@/components/ui";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestRepo } from "@/lib/data";
import { isClaudeConfigured } from "@/lib/env";
import { statusLabels } from "@/lib/utils";

export const metadata = { title: "Concierge" };
export const dynamic = "force-dynamic";

export default async function ConciergePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const context = await getGuestContext();
  if (!context) redirect("/api/guest/start");

  const { property, guest } = context;
  const { prompt } = await searchParams;

  const repo = await getGuestRepo();
  const conversation = await repo.getOrCreateConversation(
    guest.id,
    property.id,
  );
  const [messages, requests] = await Promise.all([
    repo.listMessages(conversation.id, 60),
    repo.listMaintenanceForGuest(guest.id),
  ]);

  return (
    <GuestShell propertyName={property.name} active="concierge" guestName={guest.guestName}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your concierge</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            Good to see you, {guest.guestName}.
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Verified answers about {property.name}, plus a direct line to{" "}
            {property.hostName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={isClaudeConfigured ? "success" : "warning"}>
            <span
              className={`size-1.5 rounded-full ${
                isClaudeConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isClaudeConfigured ? "Claude connected" : "Claude not configured"}
          </Pill>
          <Pill tone="neutral">Response time ~4s</Pill>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_296px]">
        <ConciergeChat
          initialMessages={messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            toolEvents: message.toolEvents,
          }))}
          guestName={guest.guestName}
          propertyName={property.name}
          hostName={property.hostName}
          hostPhone={property.hostPhone}
          claudeReady={isClaudeConfigured}
          prefill={prompt?.slice(0, 300)}
        />

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              <h2 className="text-[13.5px] font-semibold">What it can do</h2>
            </div>
            <ul className="mt-3 space-y-3">
              {[
                { icon: MessageSquare, text: "Check Wi-Fi, access, appliances and house rules" },
                { icon: Heart, text: "Remember your preferences and use them in recommendations" },
                { icon: Wrench, text: "File a real maintenance ticket after you confirm" },
                { icon: ShieldCheck, text: "Escalate urgent issues to your host or to 112" },
              ].map((item) => (
                <li key={item.text} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-soft">
                  <item.icon className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={1.8} />
                  {item.text}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-[13.5px] font-semibold">Your saved preferences</h2>
            {guest.preferences.interests.length || guest.preferences.notes ? (
              <>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {guest.preferences.interests.map((interest) => (
                    <Pill key={interest} tone="gold">
                      {interest}
                    </Pill>
                  ))}
                </div>
                {guest.preferences.notes ? (
                  <p className="mt-3 text-[12px] leading-relaxed text-muted">
                    {guest.preferences.notes}
                  </p>
                ) : null}
                <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
                  Saved with your consent. Ask the concierge to forget them at any
                  time.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                Nothing saved yet. Tell the concierge what you enjoy — nightlife,
                quiet mornings, Italian food — and it will ask before remembering it.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13.5px] font-semibold">Your requests</h2>
              <Link href="/support" className="text-[11px] text-muted hover:text-ink">
                View all
              </Link>
            </div>
            {requests.length === 0 ? (
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                No requests yet. The concierge can file one when you confirm.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {requests.slice(0, 3).map((request) => (
                  <li key={request.id} className="rounded-lg border border-line bg-cream/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] text-muted">
                        {request.ticketCode}
                      </span>
                      <span className="text-[10px] text-muted">
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink-soft">
                      {request.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Note
            tone="warning"
            icon={<AlertTriangle className="size-4" />}
            className="bg-amber-50/60"
          >
            <strong className="font-semibold">Emergencies:</strong> call 112. The
            concierge can notify {property.hostName}, but it cannot send help.
          </Note>

          <Link
            href="/explore"
            className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-[12.5px] font-medium transition hover:border-ink/20"
          >
            Explore Barcelona <ArrowRight className="size-3.5" />
          </Link>
        </aside>
      </div>
    </GuestShell>
  );
}
