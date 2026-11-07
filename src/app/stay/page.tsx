import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  KeyRound,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Wifi,
  Wrench,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { AffiliationButton } from "@/components/guest/AffiliationButton";
import { CopyButton } from "@/components/CopyButton";
import { Card, Note, Pill } from "@/components/ui";
import { listAffiliationsForGuest } from "@/lib/affiliations";
import { getGuestRepo } from "@/lib/data";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext, greeting } from "@/lib/guest-context";
import { formatDate, nightsBetween } from "@/lib/utils";

export const metadata = { title: "My stay" };
export const dynamic = "force-dynamic";

export default async function StayPage() {
  const [context, account] = await Promise.all([
    getGuestContext(),
    getGuestAccount(),
  ]);

  if (!context) {
    if (!account) redirect("/guest/login?next=/stay");

    return (
      <GuestShell
        propertyName="No stay linked"
        active="stay"
        guestName={account.fullName}
        hasStay={false}
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="p-6 sm:p-8">
            <p className="eyebrow">My stay</p>
            <h1 className="mt-2 text-[30px] leading-tight font-semibold">
              No stay linked to this account
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              You are signed in as {account.fullName}. You can still browse hosts and
              ask one to connect. A stay appears here when your account email matches a
              booking.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/hosts" className="btn-primary">
                Browse hosts <ArrowRight className="size-4" />
              </Link>
              <Link href="/connections" className="btn-secondary">
                My connections
              </Link>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-[11.5px] leading-relaxed text-muted">
              Booked with a different email? Create a guest account with the booking
              email to link the stay automatically.
            </p>
          </Card>
        </div>
      </GuestShell>
    );
  }

  const { property, guest, isPlanning } = context;
  const nights = nightsBetween(guest.checkInDate, guest.checkOutDate);
  const repo = await getGuestRepo();
  const reservation = account
    ? await repo.getReservationForGuest(guest.id).catch(() => null)
    : null;
  const affiliation = account
    ? (await listAffiliationsForGuest(account.id)).find(
        (item) => item.hostId === property.hostId,
      ) ?? null
    : null;

  return (
    <GuestShell
      propertyName={property.name}
      active="stay"
      guestName={guest.guestName}
      hasStay={!isPlanning}
      planning={isPlanning}
    >
      <div className="space-y-6">
        {isPlanning ? (
          <Card className="flex flex-col gap-4 border-brand/15 bg-brand-soft/30 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.14em] text-brand-dark uppercase">
                Planning mode
              </p>
              <p className="mt-1 text-[13px] font-medium">
                No booking linked to this account
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                You are exploring the demo Barcelona base. The concierge, city
                guide, plan and support all work; ask a host to connect to make it
                your stay.
              </p>
            </div>
            <Link href="/hosts" className="btn-secondary btn-sm shrink-0">
              Find a host
            </Link>
          </Card>
        ) : null}

        {account && reservation ? (
          <Card className="flex flex-col gap-4 border-brand/15 bg-brand-soft/30 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.14em] text-brand-dark uppercase">
                Official reservation · {reservation.code}
              </p>
              <p className="mt-1 text-[13px] font-medium">
                Connect with {property.hostName}, your host
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                Your reservation belongs to this offering. Ask to connect so the host
                can see you and accept.
              </p>
            </div>
            <AffiliationButton
              hostId={property.hostId}
              propertyId={property.id}
              reservationId={reservation.id}
              hostName={property.hostName}
              signedIn
              initialStatus={affiliation?.status ?? null}
              nextPath="/stay"
            />
          </Card>
        ) : null}

        {/* Header */}
        <Card className="overflow-hidden p-0">
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[radial-gradient(circle,#F4E4CE_0%,rgba(244,228,206,0)_70%)]"
            />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="brand">
                  <span className="size-1.5 rounded-full bg-brand" />{" "}
                  {isPlanning ? "Planning mode" : "In residence"}
                </Pill>
                <Pill tone="neutral">
                  <MapPin className="size-3" /> {property.neighbourhood}, {property.city}
                </Pill>
              </div>
              <h1 className="mt-4 font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
                {greeting(guest.guestName)}.
              </h1>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-soft">
                {property.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-ink-soft">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted" />
                  {formatDate(guest.checkInDate, { weekday: "short" })} →{" "}
                  {formatDate(guest.checkOutDate, { weekday: "short" })}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4 text-muted" />
                  {nights} night{nights === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <KeyRound className="size-4 text-muted" />
                  Check-in {property.checkIn}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/concierge" className="btn-primary">
                  <MessageSquare className="size-4" /> Ask the concierge
                </Link>
                <Link href="/support" className="btn-secondary">
                  <Wrench className="size-4" /> Report an issue
                </Link>
              </div>
            </div>

            {/* Apartment illustration */}
            <div className="relative hidden overflow-hidden rounded-2xl border border-line bg-[#F6EDDF] lg:block">
              <svg viewBox="0 0 320 300" className="h-full w-full" role="img" aria-label="Illustration of the Eixample apartment facade">
                <rect width="320" height="300" fill="#F7EEE0" />
                <circle cx="252" cy="62" r="34" fill="#F0D9BA" />
                <path d="M0 232h320v68H0z" fill="#E7D5BD" />
                <rect x="34" y="54" width="106" height="196" rx="6" fill="#EFE1CC" />
                <rect x="166" y="30" width="122" height="220" rx="6" fill="#F2E5D2" />
                {[0, 1, 2].map((row) =>
                  [0, 1].map((col) => (
                    <g key={`a-${row}-${col}`}>
                      <rect
                        x={52 + col * 46}
                        y={76 + row * 58}
                        width="34"
                        height="42"
                        rx="3"
                        fill="#C9A87E"
                        opacity="0.55"
                      />
                      <rect
                        x={52 + col * 46}
                        y={76 + row * 58}
                        width="34"
                        height="42"
                        rx="3"
                        fill="none"
                        stroke="#B08F66"
                        strokeWidth="1.4"
                      />
                    </g>
                  )),
                )}
                {[0, 1, 2, 3].map((row) => (
                  <rect
                    key={`b-${row}`}
                    x="186"
                    y={52 + row * 52}
                    width="42"
                    height="34"
                    rx="2"
                    fill="#D6B58C"
                    opacity="0.5"
                  />
                ))}
                <rect x="232" y="150" width="40" height="100" rx="20" fill="#E8D4B8" />
                <rect x="243" y="168" width="18" height="82" rx="9" fill="#C9A87E" opacity="0.6" />
                <rect x="34" y="250" width="254" height="6" rx="3" fill="#D9C2A3" />
                <path d="M40 250c14-26 38-26 52 0" fill="none" stroke="#8FA36E" strokeWidth="3" />
                <path d="M244 250c10-20 28-20 38 0" fill="none" stroke="#8FA36E" strokeWidth="3" />
              </svg>
              <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/60 bg-white/85 px-3 py-2 backdrop-blur">
                <p className="text-[11px] font-medium text-ink">{property.address}</p>
                <p className="text-[10px] text-muted">Illustration of the Eixample facade</p>
              </div>
            </div>
          </div>

          <div className="grid divide-y divide-line border-t border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: "Check-in from", value: property.checkIn, hint: "Lockbox & keypad steps below" },
              { label: "Check-out by", value: property.checkOut, hint: "Late check-out on request" },
              { label: "Wi-Fi network", value: property.wifiName, hint: "Password in the card below" },
            ].map((item) => (
              <div key={item.label} className="px-5 py-4">
                <p className="text-[11px] tracking-wide text-muted uppercase">{item.label}</p>
                <p className="mt-1 text-[15px] font-semibold">{item.value}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-5">
            {/* Access */}
            <Card className="scroll-mt-28 p-5 sm:p-6" as="section">
              <span id="access" className="block scroll-mt-28" />
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                  <KeyRound className="size-4" strokeWidth={1.8} />
                </span>
                <h2 className="text-[15px] font-semibold">Getting in &amp; getting out</h2>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-cream/60 p-4">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Check-in · {property.checkIn}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                    {property.checkInInstructions}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-cream/60 p-4">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Check-out · {property.checkOut}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                    {property.checkOutInstructions}
                  </p>
                </div>
              </div>
            </Card>

            {/* Appliances */}
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-sand text-ink-soft">
                    <Sparkles className="size-4" strokeWidth={1.8} />
                  </span>
                  <h2 className="text-[15px] font-semibold">Appliance guides</h2>
                </div>
                <span className="text-[11px] text-muted">
                  {property.applianceInstructions.length} guides
                </span>
              </div>
              <div className="mt-4 divide-y divide-line">
                {property.applianceInstructions.map((guide) => (
                  <details key={guide.appliance} className="group py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13.5px] font-medium text-ink">
                      {guide.appliance}
                      <ChevronRight className="size-4 shrink-0 text-muted transition group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 pr-6 text-[13px] leading-relaxed text-muted">
                      {guide.instructions}
                    </p>
                  </details>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] text-muted">
                Something not covered? Ask the concierge — it reads the same guide.
              </p>
            </Card>

            {/* House rules */}
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-sand text-ink-soft">
                  <ShieldCheck className="size-4" strokeWidth={1.8} />
                </span>
                <h2 className="text-[15px] font-semibold">House rules</h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {property.houseRules.map((rule) => (
                  <li key={rule} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={2.6} />
                    {rule}
                  </li>
                ))}
              </ul>
            </Card>

            {/* FAQs */}
            {property.faqs.length > 0 ? (
              <Card className="p-5 sm:p-6">
                <h2 className="text-[15px] font-semibold">Frequently asked</h2>
                <div className="mt-3 divide-y divide-line">
                  {property.faqs.map((faq) => (
                    <details key={faq.question} className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13.5px] font-medium text-ink">
                        {faq.question}
                        <ChevronRight className="size-4 shrink-0 text-muted transition group-open:rotate-90" />
                      </summary>
                      <p className="mt-2 pr-6 text-[13px] leading-relaxed text-muted">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-5">
            {/* Wi-Fi */}
            <Card className="overflow-hidden p-0">
              <span id="wifi" className="block scroll-mt-28" />
              <div className="bg-ink px-5 py-4 text-cream">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[11px] tracking-wide text-white/60 uppercase">
                    <Wifi className="size-3.5" /> Wi-Fi
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                    Fibre
                  </span>
                </div>
                <p className="mt-2 text-[17px] font-semibold">{property.wifiName}</p>
              </div>
              <div className="space-y-3 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10.5px] tracking-wide text-muted uppercase">Password</p>
                    <p className="mt-0.5 font-mono text-[13.5px] tracking-tight">
                      {property.wifiPassword}
                    </p>
                  </div>
                  <CopyButton value={property.wifiPassword} />
                </div>
                <p className="text-[11px] leading-relaxed text-muted">
                  Network is 5 GHz. If it doesn&rsquo;t appear, restart Wi-Fi on your
                  device — the router is in the hallway cupboard.
                </p>
              </div>
            </Card>

            {/* Amenities */}
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold">What&rsquo;s here</h2>
              <ul className="mt-3 grid gap-2">
                {property.amenities.map((amenity) => (
                  <li key={amenity} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-soft">
                    <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" strokeWidth={2.6} />
                    {amenity}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Host */}
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold">Your host</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-sand text-[13px] font-semibold">
                  {property.hostName.slice(0, 1)}
                </span>
                <div>
                  <p className="text-[13px] font-medium">{property.hostName}</p>
                  <p className="text-[11px] text-muted">Usually replies within an hour</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${property.hostPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-[12.5px] text-ink-soft transition hover:text-ink"
                >
                  <Phone className="size-3.5 text-muted" /> {property.hostPhone}
                </a>
                <a
                  href={`mailto:${property.hostEmail}`}
                  className="flex items-center gap-2 text-[12.5px] text-ink-soft transition hover:text-ink"
                >
                  <MessageSquare className="size-3.5 text-muted" /> {property.hostEmail}
                </a>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                The concierge can notify {property.hostName} for you, day or night.
              </p>
            </Card>

            {/* Emergency */}
            <Card className="border-red-200 bg-red-50/40 p-5">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="size-4" />
                <h2 className="text-[14px] font-semibold">If there&rsquo;s an emergency</h2>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-red-900/80">
                {property.emergencyInformation}
              </p>
              <a
                href="tel:112"
                className="btn mt-3 w-full bg-red-600 text-white hover:bg-red-700"
              >
                <Phone className="size-4" /> Call 112
              </a>
              <p className="mt-2 text-[10.5px] leading-relaxed text-red-900/60">
                The AI concierge cannot dispatch help. For fire, gas or medical
                emergencies, call 112 before anything else.
              </p>
            </Card>
          </aside>
        </div>

        {/* Concierge promo */}
        <div className="relative overflow-hidden rounded-[22px] border border-line bg-ink p-6 text-cream sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 right-0 size-64 rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_70%)] opacity-30"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.16em] text-white/50 uppercase">
                <Sparkles className="size-3 text-brand" /> Concierge
              </p>
              <h2 className="mt-2 text-[22px] leading-snug font-semibold text-white">
                Anything else you need, {guest.guestName}?
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                Ask about the apartment, plan an evening in Barcelona, or report a
                problem — it can file a real ticket with {property.hostName}.
              </p>
            </div>
            <Link
              href="/concierge"
              className="btn shrink-0 bg-white px-5 text-ink hover:bg-cream"
            >
              Open the concierge <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <Note icon={<Coffee className="size-4" />} className="bg-white">
          This property record is maintained by your host and used by the concierge.
          If something here is out of date, tell the concierge and it will notify{" "}
          {property.hostName}.
        </Note>
      </div>
    </GuestShell>
  );
}
