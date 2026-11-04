import Link from "next/link";
import { CalendarDays, CalendarPlus, Users } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { ReservationStatusSelect } from "@/components/host/ReservationStatusSelect";
import { Card, EmptyState, Note, Pill, Stat } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import { MigrationRequiredError } from "@/lib/data/repo";
import { formatDate, todayISO } from "@/lib/utils";
import {
  reservationSourceLabels,
  reservationSourceNotes,
  reservationStatusLabels,
  reservationStatusStyles,
} from "@/lib/reservations";
import type { Reservation } from "@/lib/types";

export const metadata = { title: "Reservations" };
export const dynamic = "force-dynamic";

export default async function HostReservationsPage() {
  const workspace = await getHostWorkspace();
  const { properties } = workspace;
  const propertyNames = new Map(
    properties.map((property) => [property.id, property.name]),
  );

  let reservations: Reservation[] = [];
  let migrationMessage: string | null = null;

  try {
    reservations = await workspace.repo.listReservations(
      properties.map((property) => property.id),
    );
  } catch (error) {
    if (error instanceof MigrationRequiredError) migrationMessage = error.message;
    else console.error("[host/reservations] could not list reservations", error);
  }

  const today = todayISO(0);
  const sorted = [...reservations].sort((a, b) =>
    a.checkInDate.localeCompare(b.checkInDate),
  );
  const upcoming = sorted.filter((reservation) => reservation.status === "upcoming");
  const inHouse = sorted.filter((reservation) => reservation.status === "in_house");
  const stayingGuests = [...upcoming, ...inHouse].reduce(
    (total, reservation) => total + reservation.guests,
    0,
  );

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(properties)}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Reservations</p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
              Who is staying, and when
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
              Every stay the concierge can see, with where the record came from. Manual
              entries and sample rows are labelled — nothing here is presented as a live
              Airbnb booking.
            </p>
          </div>
          <Link href="/host/reservations/new" className="btn-primary btn-sm">
            <CalendarPlus className="size-3.5" /> New reservation
          </Link>
        </div>

        <div className="stagger grid gap-3 sm:grid-cols-3">
          <Stat
            label="Upcoming arrivals"
            value={upcoming.length}
            hint={
              upcoming[0]
                ? `Next: ${upcoming[0].guestName} on ${formatDate(upcoming[0].checkInDate)}`
                : "Nothing booked yet"
            }
            icon={<CalendarDays className="size-3.5" />}
          />
          <Stat
            label="In residence"
            value={inHouse.length}
            hint={
              inHouse.map((reservation) => reservation.guestName).join(", ") ||
              "No one checked in today"
            }
            icon={<Users className="size-3.5" />}
          />
          <Stat
            label="Guests expected"
            value={stayingGuests}
            hint="Across upcoming and current stays"
            icon={<Users className="size-3.5" />}
            accent
          />
        </div>

        {migrationMessage ? (
          <Note tone="warning" className="bg-amber-50/70">
            <strong className="font-semibold">One step to enable reservations.</strong>{" "}
            {migrationMessage}
          </Note>
        ) : null}

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">All reservations</h2>
            <span className="text-[11px] text-muted">
              {reservations.length} record{reservations.length === 1 ? "" : "s"} · today{" "}
              {formatDate(today)}
            </span>
          </div>

          {sorted.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<CalendarDays className="size-4" />}
                title="No reservations yet"
                description="Add a booking manually, or let the next guest session claim a sample reservation. Nothing is imported from Airbnb without an approved integration."
                action={
                  <Link href="/host/reservations/new" className="btn-primary btn-sm">
                    Add a reservation
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {sorted.map((reservation) => (
                <li
                  key={reservation.id}
                  className="rounded-xl border border-line bg-white px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[10.5px] text-muted">
                          {reservation.code}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${reservationStatusStyles[reservation.status]}`}
                        >
                          {reservationStatusLabels[reservation.status]}
                        </span>
                        <Pill
                          tone={reservation.source === "airbnb" ? "success" : "neutral"}
                        >
                          {reservationSourceLabels[reservation.source]}
                        </Pill>
                      </div>
                      <p className="mt-1.5 text-[13.5px] font-medium">
                        {reservation.guestName}
                        {reservation.guestEmail ? (
                          <span className="ml-2 text-[11.5px] font-normal text-muted">
                            {reservation.guestEmail}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {formatDate(reservation.checkInDate)} →{" "}
                          {formatDate(reservation.checkOutDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" /> {reservation.guests} guest
                          {reservation.guests === 1 ? "" : "s"}
                        </span>
                        <span>
                          {propertyNames.get(reservation.propertyId) ?? "Property"}
                        </span>
                      </p>
                      {reservation.notes ? (
                        <p className="mt-1.5 line-clamp-1 text-[11.5px] text-ink-soft">
                          {reservation.notes}
                        </p>
                      ) : null}
                    </div>
                    <ReservationStatusSelect
                      id={reservation.id}
                      status={reservation.status}
                    />
                  </div>
                  <p className="mt-2 border-t border-line pt-2 text-[10.5px] text-muted">
                    {reservationSourceNotes[reservation.source]}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Note tone="neutral" className="bg-white">
          A guest who opens the concierge with no reservation attached will claim the next
          open sample reservation on that property. Attach real bookings from{" "}
          <Link href="/host/reservations/new" className="font-medium text-brand">
            New reservation
          </Link>
          , or through an approved Airbnb integration once one exists.
        </Note>
      </div>
    </HostShell>
  );
}
