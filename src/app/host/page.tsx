import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  MessageSquare,
  Plus,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { Card, EmptyState, Pill, Stat } from "@/components/ui";
import {
  activeGuests,
  getHostWorkspace,
  propertyName,
} from "@/lib/host-context";
import {
  formatDate,
  formatDateTime,
  priorityLabels,
  priorityStyles,
  statusLabels,
  statusStyles,
  todayISO,
} from "@/lib/utils";
import { MigrationRequiredError } from "@/lib/data/repo";
import type { Priority, Reservation } from "@/lib/types";

export const metadata = { title: "Host overview" };
export const dynamic = "force-dynamic";

const priorityOrder: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export default async function HostOverviewPage() {
  const workspace = await getHostWorkspace();
  const { session, properties, requests, conversations, guests } = workspace;

  const today = todayISO(0);
  const inHouse = activeGuests(guests, today);
  const inHouseNames = [...new Set(inHouse.map((guest) => guest.guestName))];
  const guestHint = inHouseNames.length
    ? `${inHouseNames.slice(0, 3).join(", ")}${
        inHouseNames.length > 3 ? ` +${inHouseNames.length - 3} more` : ""
      }`
    : "No one in residence today";
  const openRequests = requests.filter((request) => request.status !== "resolved");
  const attention = [...requests]
    .filter((request) => request.status === "new")
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const recentConversations = conversations.slice(0, 3);

  const guestNames = new Map(guests.map((guest) => [guest.id, guest.guestName]));
  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));

  // Reservations arrive with the additive migration; until it is applied the
  // overview simply omits the block instead of failing.
  let nextArrivals: { reservation: Reservation; propertyName: string }[] = [];
  try {
    const reservations = await workspace.repo.listReservations(
      properties.map((property) => property.id),
    );
    nextArrivals = reservations
      .filter((reservation) => reservation.status === "upcoming")
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
      .slice(0, 3)
      .map((reservation) => ({
        reservation,
        propertyName: propertyNames.get(reservation.propertyId) ?? "Property",
      }));
  } catch (error) {
    if (!(error instanceof MigrationRequiredError)) {
      console.error("[host] reservations unavailable", error);
    }
  }

  const messagesByConversation = await Promise.all(
    recentConversations.map(async (conversation) => ({
      conversation,
      lastMessage: (await workspace.repo.listMessages(conversation.id, 40)).at(-1),
    })),
  );

  return (
    <HostShell
      session={session}
      unread={workspace.unread}
      propertyLabel={propertyName(properties)}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Overview</p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
              Good to see you, {session.fullName.split(" ")[0]}.
            </h1>
            <p className="mt-1.5 text-[13px] text-muted">
              {formatDateTime(new Date())} · {properties.length} propert
              {properties.length === 1 ? "y" : "ies"} · {inHouse.length} guest
              {inHouse.length === 1 ? "" : "s"} in residence
            </p>
          </div>
          <NewPropertyButton />
        </div>

        <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Properties"
            value={properties.length}
            hint={properties[0]?.name ?? "Add your first property"}
            icon={<Building2 className="size-3.5" />}
          />
          <Stat
            label="Current guests"
            value={inHouse.length}
            hint={guestHint}
            icon={<Users className="size-3.5" />}
          />
          <Stat
            label="Open requests"
            value={openRequests.length}
            hint={`${requests.filter((r) => r.status === "new").length} new · ${
              requests.filter((r) => r.priority === "urgent").length
            } urgent`}
            icon={<Wrench className="size-3.5" />}
            accent
          />
          <Stat
            label="Unread notifications"
            value={workspace.unread}
            hint="From the concierge and guest forms"
            icon={<BellRing className="size-3.5" />}
          />
        </div>

        {nextArrivals.length > 0 ? (
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-ink-soft" />
                <h2 className="text-[15px] font-semibold">Next arrivals</h2>
              </div>
              <Link
                href="/host/reservations"
                className="inline-flex items-center gap-1 text-[11.5px] text-muted transition hover:text-ink"
              >
                All reservations <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {nextArrivals.map(({ reservation, propertyName: name }) => (
                <li
                  key={reservation.id}
                  className="rounded-xl border border-line bg-cream/50 p-3.5"
                >
                  <p className="font-mono text-[10.5px] text-muted">{reservation.code}</p>
                  <p className="mt-1 text-[13px] font-medium">{reservation.guestName}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {formatDate(reservation.checkInDate)} · {reservation.guests} guest
                    {reservation.guests === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-muted">{name}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          {/* Needs attention */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-brand" />
                <h2 className="text-[15px] font-semibold">Needs attention</h2>
                {attention.length > 0 ? (
                  <Pill tone="brand">{attention.length} new</Pill>
                ) : null}
              </div>
              <Link
                href="/host/maintenance"
                className="inline-flex items-center gap-1 text-[11.5px] text-muted transition hover:text-ink"
              >
                All requests <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              {attention.length === 0 ? (
                <EmptyState
                  icon={<Check className="size-4" />}
                  title="Nothing waiting"
                  description="New guest requests will appear here the moment Claude or the support form files one."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {attention.slice(0, 5).map((request) => (
                    <li key={request.id} className="flex flex-wrap items-start gap-3 py-3.5 first:pt-0">
                      <span
                        className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityStyles[request.priority]}`}
                      >
                        {priorityLabels[request.priority]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] leading-snug text-ink">
                          {request.description}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          <span className="font-mono">{request.ticketCode}</span> ·{" "}
                          {request.guestName} ·{" "}
                          {propertyNames.get(request.propertyId) ?? "Property"} ·{" "}
                          {formatDateTime(request.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusStyles[request.status]}`}
                      >
                        {statusLabels[request.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BellRing className="size-4 text-ink-soft" />
                <h2 className="text-[15px] font-semibold">Notifications</h2>
              </div>
              {workspace.unread > 0 ? (
                <form action="/api/host/notifications/read" method="post">
                  <button
                    type="submit"
                    className="text-[11px] text-muted transition hover:text-ink"
                  >
                    Mark all read
                  </button>
                </form>
              ) : null}
            </div>

            <ul className="mt-4 space-y-3">
              {workspace.notifications.slice(0, 4).map((notification) => (
                <li
                  key={notification.id}
                  className="rounded-xl border border-line bg-cream/50 px-3.5 py-3"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        notification.read ? "bg-line" : "bg-brand"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-[12.5px] leading-snug text-ink-soft">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10.5px] text-muted">
                        {formatDateTime(notification.createdAt)} ·{" "}
                        <span className="capitalize">{notification.type}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {workspace.notifications.length === 0 ? (
                <li className="rounded-xl border border-dashed border-line px-3.5 py-6 text-center text-[12px] text-muted">
                  No notifications yet.
                </li>
              ) : null}
            </ul>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          {/* Recent interactions */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-ink-soft" />
                <h2 className="text-[15px] font-semibold">Recent guest interactions</h2>
              </div>
              <Link
                href="/host/guests"
                className="inline-flex items-center gap-1 text-[11.5px] text-muted transition hover:text-ink"
              >
                Open <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {messagesByConversation.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="size-4" />}
                  title="No conversations yet"
                  description="When a guest talks to the concierge, you'll see an AI summary here."
                />
              ) : (
                messagesByConversation.map(({ conversation, lastMessage }) => (
                  <div
                    key={conversation.id}
                    className="rounded-xl border border-line bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-medium">
                        {guestNames.get(conversation.guestSessionId) ?? "Guest"}
                      </p>
                      <span className="text-[10.5px] text-muted">
                        {formatDateTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                      {conversation.summary
                        ? conversation.summary.replace(/\n/g, " · ")
                        : lastMessage?.content ??
                          "No messages yet."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Pill tone="neutral">
                        {conversation.summary ? "AI summary" : "Transcript"}
                      </Pill>
                      <Link
                        href="/host/guests"
                        className="text-[10.5px] text-brand hover:text-brand-dark"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Property snapshot */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold">Property</h2>
              <Link
                href="/host/properties"
                className="text-[11.5px] text-muted transition hover:text-ink"
              >
                Manage
              </Link>
            </div>

            {properties.length === 0 ? (
              <EmptyState
                title="No property yet"
                description="Add a property so the concierge has something to answer from."
                action={<NewPropertyButton />}
              />
            ) : (
              <div className="mt-4 space-y-4">
                {properties.slice(0, 2).map((property) => (
                  <div key={property.id} className="rounded-xl border border-line bg-cream/50 p-4">
                    <p className="text-[13.5px] font-medium">{property.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      {property.address}
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" /> In {property.checkIn}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" /> Out {property.checkOut}
                      </span>
                    </div>
                    <Link
                      href={`/host/properties/${property.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand hover:text-brand-dark"
                    >
                      Edit property <ArrowRight className="size-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-line bg-white p-4">
              <p className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-soft">
                <Sparkles className="size-3.5 text-brand" /> Concierge behaviour
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                Tone, service preferences and escalation rules live in AI settings.
                Safety and honesty rules are fixed.
              </p>
              <Link
                href="/host/settings"
                className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-ink transition hover:text-brand"
              >
                Open AI settings <ChevronRight className="size-3" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </HostShell>
  );
}

function NewPropertyButton() {
  return (
    <Link href="/host/properties/new" className="btn-primary btn-sm">
      <Plus className="size-3.5" /> Add property
    </Link>
  );
}
