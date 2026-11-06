import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { Card, Note, Pill } from "@/components/ui";
import { getGuestRepo } from "@/lib/data";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext } from "@/lib/guest-context";
import {
  chooseCurrentStay,
  initialsFor,
  sortStaysNewest,
} from "@/lib/guest-profile";
import {
  reservationStatusLabels,
  reservationStatusStyles,
} from "@/lib/reservations";
import type { Reservation } from "@/lib/types";
import { formatDate, nightsBetween } from "@/lib/utils";

export const metadata = { title: "Guest profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const context = await getGuestContext();
  if (!context) redirect("/guest/login");

  const { guest, property } = context;
  const repo = await getGuestRepo();
  const account = await getGuestAccount();

  const reservation = await repo.getReservationForGuest(guest.id).catch(() => null);
  const email = reservation?.guestEmail?.trim() ?? "";
  const byEmail = email
    ? await repo.listReservationsByEmail(email).catch(() => [])
    : [];

  const staysById = new Map<string, Reservation>();
  if (reservation) staysById.set(reservation.id, reservation);
  for (const stay of byEmail) staysById.set(stay.id, stay);
  const stays = sortStaysNewest(
    [...staysById.values()].filter((stay) => stay.status !== "cancelled"),
  );

  const activeStay = reservation ?? chooseCurrentStay(stays);
  const fullName = activeStay?.guestName || guest.guestName;
  const stayEmail = activeStay?.guestEmail || email;
  const memberSince =
    [...stays].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]?.createdAt ??
    guest.createdAt;

  const propertyIds = [...new Set([property.id, ...stays.map((stay) => stay.propertyId)])];
  const propertyEntries = await Promise.all(
    propertyIds.map(async (id) => ({ id, property: await repo.getProperty(id) })),
  );
  const propertyNames = new Map(
    propertyEntries.map((entry) => [entry.id, entry.property?.name ?? property.name]),
  );
  const activeProperty =
    propertyEntries.find((entry) => entry.id === (activeStay?.propertyId ?? property.id))
      ?.property ?? property;
  const preferences = guest.preferences;

  return (
    <GuestShell propertyName={property.name} active="profile" guestName={guest.guestName}>
      <div className="space-y-5">
        <Card className="overflow-hidden p-0">
          <div className="relative overflow-hidden bg-ink px-6 py-7 text-cream sm:px-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-28 right-0 size-72 rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_70%)] opacity-25"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 font-display text-[22px] text-white ring-1 ring-white/15">
                  {initialsFor(fullName)}
                </span>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold tracking-[0.18em] text-white/40 uppercase">
                    Guest profile
                  </p>
                  <h1 className="mt-1 truncate text-[27px] leading-tight font-semibold text-white">
                    {fullName}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-white/60">
                    <Mail className="size-3.5 shrink-0" />
                    {stayEmail || "No email on file"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {account ? <Pill tone="brand">Guest account</Pill> : null}
                {activeStay ? (
                  <Pill
                    tone={
                      activeStay.status === "in_house"
                        ? "success"
                        : activeStay.status === "upcoming"
                          ? "brand"
                          : "neutral"
                    }
                  >
                    {reservationStatusLabels[activeStay.status]}
                  </Pill>
                ) : null}
                <a
                  href="/api/guest/reset"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[11.5px] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  <LogOut className="size-3" /> Sign out
                </a>
              </div>
            </div>
          </div>

          <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4">
              <p className="text-[10.5px] tracking-wide text-muted uppercase">
                Email on booking
              </p>
              <p className="mt-1 truncate text-[13px] font-medium">
                {stayEmail || "Not provided"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10.5px] tracking-wide text-muted uppercase">
                Stays with this profile
              </p>
              <p className="mt-1 text-[13px] font-medium">{stays.length}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10.5px] tracking-wide text-muted uppercase">
                Guest since
              </p>
              <p className="mt-1 text-[13px] font-medium">
                {formatDate(memberSince, { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="eyebrow">
                    {activeStay?.status === "completed" ? "Latest booking" : "Current stay"}
                  </p>
                  <h2 className="mt-1 text-[18px] font-semibold">
                    {activeProperty.name}
                  </h2>
                </div>
                {activeStay ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ${reservationStatusStyles[activeStay.status]}`}
                  >
                    {reservationStatusLabels[activeStay.status]}
                  </span>
                ) : null}
              </div>

              {activeStay ? (
                <>
                  <div className="mt-4 grid gap-3 rounded-xl border border-line bg-cream/60 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] tracking-wide text-muted uppercase">
                        Check-in
                      </p>
                      <p className="mt-1 text-[12.5px] font-medium">
                        {formatDate(activeStay.checkInDate, { weekday: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-wide text-muted uppercase">
                        Check-out
                      </p>
                      <p className="mt-1 text-[12.5px] font-medium">
                        {formatDate(activeStay.checkOutDate, { weekday: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-wide text-muted uppercase">
                        Length
                      </p>
                      <p className="mt-1 text-[12.5px] font-medium">
                        {nightsBetween(activeStay.checkInDate, activeStay.checkOutDate)}{" "}
                        night
                        {nightsBetween(activeStay.checkInDate, activeStay.checkOutDate) === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                      <MapPin className="size-3.5" /> {activeProperty.address}
                    </p>
                    <Link href="/stay" className="btn-secondary btn-sm">
                      Open my stay <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  No booking is attached to this profile yet. Ask your host to add
                  the email you booked with.
                </p>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold">Stay history</h2>
                <span className="text-[11px] text-muted">
                  {stays.length} stay{stays.length === 1 ? "" : "s"}
                </span>
              </div>

              {stays.length ? (
                <ul className="mt-4 divide-y divide-line">
                  {stays.map((stay) => (
                    <li
                      key={stay.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-medium">
                            {propertyNames.get(stay.propertyId) ?? property.name}
                          </p>
                          {stay.id === activeStay?.id ? (
                            <span className="text-[10px] font-medium text-brand">
                              Active profile stay
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            {formatDate(stay.checkInDate)} → {formatDate(stay.checkOutDate)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {nightsBetween(stay.checkInDate, stay.checkOutDate)} night
                            {nightsBetween(stay.checkInDate, stay.checkOutDate) === 1
                              ? ""
                              : "s"}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ${reservationStatusStyles[stay.status]}`}
                      >
                        {reservationStatusLabels[stay.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Your stays will appear here once a booking is linked to this email.
                </p>
              )}
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold">Profile details</h2>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="text-[10.5px] tracking-wide text-muted uppercase">
                    Full name
                  </dt>
                  <dd className="mt-0.5 text-[13px]">{fullName}</dd>
                </div>
                <div>
                  <dt className="text-[10.5px] tracking-wide text-muted uppercase">
                    Email
                  </dt>
                  <dd className="mt-0.5 truncate text-[13px]">
                    {stayEmail || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10.5px] tracking-wide text-muted uppercase">
                    Sign-in
                  </dt>
                  <dd className="mt-0.5 text-[13px]">
                    {account ? "Email + password" : "Booking email + surname"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10.5px] tracking-wide text-muted uppercase">
                    Password
                  </dt>
                  <dd className="mt-0.5 text-[13px] text-muted">
                    {account ? "Managed by Supabase" : "Not required"}
                  </dd>
                </div>
              </dl>
              {!account ? (
                <Link
                  href={`/guest/signup?email=${encodeURIComponent(stayEmail)}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand"
                >
                  Create a guest account
                </Link>
              ) : null}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" />
                <h2 className="text-[14px] font-semibold">Saved preferences</h2>
              </div>
              {preferences.interests.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {preferences.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-sand px-2.5 py-1 text-[11px] text-ink-soft"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                  Nothing saved yet. Tell the concierge what you like and it can
                  remember it for this stay.
                </p>
              )}
              {preferences.notes ? (
                <p className="mt-3 rounded-xl border border-line bg-cream/60 px-3 py-2.5 text-[12px] leading-relaxed text-ink-soft">
                  {preferences.notes}
                </p>
              ) : null}
              <Link
                href="/concierge"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand"
              >
                Update with the concierge <ArrowRight className="size-3.5" />
              </Link>
            </Card>

            <Note icon={<ShieldCheck className="size-4" />} className="bg-white">
              This profile is created from your booking. It is not an Airbnb
              account, and your details are only used inside this prototype stay.
            </Note>
          </aside>
        </div>
      </div>
    </GuestShell>
  );
}
