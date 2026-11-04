import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronRight,
  Clock,
  Compass,
  KeyRound,
  MessageSquare,
  Phone,
  Sparkles,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { CopyButton } from "@/components/CopyButton";
import { ConciergeAvatar } from "@/components/brand";
import { Note, Pill } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { getGuestContext, greeting } from "@/lib/guest-context";
import { getGuestRepo } from "@/lib/data";
import { media } from "@/lib/media";
import { formatDate, nightsBetween, statusLabels } from "@/lib/utils";
import { reservationSourceLabels, reservationSourceNotes } from "@/lib/reservations";

export const metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const context = await getGuestContext();
  if (!context) redirect("/api/guest/start");

  const { property, guest } = context;
  const nights = nightsBetween(guest.checkInDate, guest.checkOutDate);
  const repo = await getGuestRepo();
  const requests = await repo.listMaintenanceForGuest(guest.id);
  // Best effort: the page still works before the reservation migration runs.
  const reservation = await repo.getReservationForGuest(guest.id).catch(() => null);

  const interests = guest.preferences.interests;
  const firstName = guest.guestName;

  const quickLinks = [
    {
      href: "/stay#wifi",
      icon: Wifi,
      label: "Wi-Fi",
      detail: property.wifiPassword,
      tone: "brand",
    },
    {
      href: "/stay#access",
      icon: KeyRound,
      label: "Arrival",
      detail: `From ${property.checkIn} · lockbox`,
      tone: "neutral",
    },
    {
      href: "/itinerary",
      icon: CalendarRange,
      label: "Your plan",
      detail: "Day by day",
      tone: "neutral",
    },
    {
      href: "/concierge",
      icon: MessageSquare,
      label: "Concierge",
      detail: "Anything at all",
      tone: "neutral",
    },
    {
      href: "/explore",
      icon: Compass,
      label: "Explore",
      detail: `${property.neighbourhood} & beyond`,
      tone: "neutral",
    },
    {
      href: "/support",
      icon: Wrench,
      label: "Report an issue",
      detail: "A real ticket",
      tone: "neutral",
    },
  ] as const;

  return (
    <GuestShell propertyName={property.name} active="welcome" guestName={guest.guestName}>
      <div className="space-y-6">
        {/* Cover */}
        <Reveal y={18} blur={false}>
          <section className="relative overflow-hidden rounded-[26px] border border-line bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.cover}
              alt="A tree-lined street in the Eixample, Barcelona"
              width={1600}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,11,9,0.88)_0%,rgba(15,11,9,0.55)_55%,rgba(15,11,9,0.2)_100%)]" />

            <div className="relative flex flex-col gap-8 p-6 sm:p-9 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> In residence
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-[10.5px] text-white/80">
                    {property.neighbourhood} · {property.city}
                  </span>
                </div>

                <h1 className="mt-5 font-display text-[36px] leading-[1.02] tracking-tight text-white sm:text-[48px]">
                  {greeting(firstName)}.
                </h1>
                <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-white/70">
                  Everything about {property.name} is already in the concierge — the
                  lockbox, the Wi-Fi, the washing machine and the quiet hours. Ask
                  anything, any time. {property.hostName} is a message away.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/65">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {formatDate(guest.checkInDate, { weekday: "short" })} →{" "}
                    {formatDate(guest.checkOutDate, { weekday: "short" })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {nights} night{nights === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound className="size-3.5" /> Check-out {property.checkOut}
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <Link href="/concierge" className="btn h-11 bg-white px-5 text-ink hover:bg-cream">
                    <Sparkles className="size-4 text-brand" /> Ask the concierge
                  </Link>
                  <Link
                    href="/stay"
                    className="btn h-11 border border-white/25 px-5 text-white hover:bg-white/10"
                  >
                    My stay details <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <ConciergeAvatar size="md" />
                <div>
                  <p className="text-[12.5px] font-medium text-white">Concierge online</p>
                  <p className="text-[10.5px] text-white/60">Reads your host&rsquo;s record</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Quick access */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Quick access</h2>
            <span className="text-[11px] text-muted">Everything essential, one tap away</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickLinks.map((item, index) => (
              <Reveal key={item.label} delay={index * 60} y={16} blur={false} className="h-full">
                <Link
                  href={item.href}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_18px_36px_-28px_rgba(25,19,16,0.5)]"
                >
                  <span
                    className={
                      item.tone === "brand"
                        ? "grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"
                        : "grid size-8 place-items-center rounded-lg bg-sand text-ink-soft"
                    }
                  >
                    <item.icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span className="mt-4 block">
                    <span className="block text-[12.5px] font-medium">{item.label}</span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                      {item.detail}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="space-y-5">
            {/* Arrival */}
            <Reveal y={20} blur={false}>
              <section id="arrival" className="surface surface-shadow p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                      <KeyRound className="size-4" strokeWidth={1.8} />
                    </span>
                    <h2 className="text-[15px] font-semibold">Arriving at {property.name}</h2>
                  </div>
                  <Pill tone="neutral">From {property.checkIn}</Pill>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-cream/60 p-4">
                    <p className="text-[10.5px] font-semibold tracking-[0.14em] text-muted uppercase">
                      The door
                    </p>
                    <p className="mt-2 line-clamp-4 text-[12.5px] leading-relaxed text-ink-soft">
                      {property.checkInInstructions}
                    </p>
                    <Link
                      href="/stay#access"
                      className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand hover:text-brand-dark"
                    >
                      Full arrival steps <ChevronRight className="size-3" />
                    </Link>
                  </div>
                  <div className="rounded-xl border border-line bg-cream/60 p-4">
                    <p className="text-[10.5px] font-semibold tracking-[0.14em] text-muted uppercase">
                      Wi-Fi
                    </p>
                    <p className="mt-2 text-[13px] font-medium">{property.wifiName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[12.5px] text-ink-soft">
                        {property.wifiPassword}
                      </span>
                      <CopyButton value={property.wifiPassword} />
                    </div>
                    <p className="mt-3 text-[11px] text-muted">
                      Fibre · 5 GHz · router in the hallway cupboard
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {property.amenities.slice(0, 4).map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[10.5px] text-ink-soft"
                    >
                      <Check className="size-2.5 text-emerald-600" strokeWidth={3} />
                      {amenity}
                    </span>
                  ))}
                  <Link
                    href="/stay"
                    className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10.5px] text-muted transition hover:text-ink"
                  >
                    All {property.amenities.length} amenities
                  </Link>
                </div>
              </section>
            </Reveal>

            {/* Stay in progress */}
            <Reveal y={20} blur={false} delay={60}>
              <section className="surface surface-shadow p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[15px] font-semibold">Your requests</h2>
                  <Link href="/support" className="text-[11px] text-muted hover:text-ink">
                    View all
                  </Link>
                </div>
                {requests.length === 0 ? (
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                    Nothing reported. If something isn&rsquo;t right, tell the concierge
                    or use the support form — both create a tracked ticket for{" "}
                    {property.hostName}.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {requests.slice(0, 3).map((request) => (
                      <li
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-cream/60 px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-[10.5px] text-muted">
                            {request.ticketCode}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">
                            {request.description}
                          </p>
                        </div>
                        <Pill tone={request.status === "resolved" ? "success" : "warning"}>
                          {statusLabels[request.status]}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>

            {/* Personalised */}
            <Reveal y={20} blur={false} delay={90}>
              <section className="relative overflow-hidden rounded-[22px] border border-line bg-sand/60 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Compass className="mt-0.5 size-4 shrink-0 text-ink-soft" />
                  <div>
                    <h2 className="text-[14.5px] font-semibold">
                      {interests.length
                        ? `Because you like ${interests.slice(0, 2).join(" and ")}`
                        : "An evening worth leaving the apartment for"}
                    </h2>
                    <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-muted">
                      {interests.length
                        ? "The curated guide is already ordered around your interests. Ask the concierge to narrow it by budget, distance or time of day."
                        : "Tell the concierge what you enjoy — natural wine, Gaudí, quiet mornings — and it will shape the city guide around it (and ask before remembering)."}
                    </p>
                    <Link
                      href={interests.length ? "/explore" : "/concierge"}
                      className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand hover:text-brand-dark"
                    >
                      {interests.length ? "Open the guide" : "Tell the concierge"}{" "}
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </section>
            </Reveal>
          </div>

          <aside className="space-y-5">
            <Reveal y={20} blur={false} delay={40}>
              <section className="surface surface-shadow overflow-hidden p-0">
                <div className="relative h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.rooftop}
                    alt="Rooftop terrace above the Eixample"
                    width={1600}
                    height={1067}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(25,19,16,0.65))]" />
                  <p className="absolute bottom-3 left-4 font-display text-[17px] text-white">
                    The rooftop terrace
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-[12.5px] leading-relaxed text-ink-soft">
                    Open 08:00–22:00. Take the lift to the fifth floor and follow the
                    stairs. Please keep voices low after 22:00 — the neighbours are
                    families.
                  </p>
                  <Link
                    href="/concierge?prompt=Tell%20me%20about%20the%20rooftop%20terrace"
                    className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand hover:text-brand-dark"
                  >
                    Ask about the terrace <ArrowRight className="size-3" />
                  </Link>
                </div>
              </section>
            </Reveal>

            {reservation ? (
              <Reveal y={20} blur={false} delay={60}>
                <section className="surface surface-shadow p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10.5px] font-semibold tracking-[0.14em] text-muted uppercase">
                      Your reservation
                    </p>
                    <Pill tone="neutral">
                      {reservationSourceLabels[reservation.source]}
                    </Pill>
                  </div>
                  <p className="mt-2 font-mono text-[12px] text-ink-soft">
                    {reservation.code}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {formatDate(reservation.checkInDate)} →{" "}
                      {formatDate(reservation.checkOutDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> {reservation.guests} guest
                      {reservation.guests === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    {reservationSourceNotes[reservation.source]}
                  </p>
                </section>
              </Reveal>
            ) : null}

            <Reveal y={20} blur={false} delay={80}>
              <section className="surface surface-shadow p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-sand text-[13px] font-semibold">
                    {property.hostName.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium">{property.hostName}</p>
                    <p className="text-[10.5px] text-muted">Your host · usually replies in an hour</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:${property.hostPhone.replace(/\s/g, "")}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-[12px] transition hover:border-ink/20"
                  >
                    <span className="inline-flex items-center gap-2 text-ink-soft">
                      <Phone className="size-3.5 text-muted" /> Call
                    </span>
                    <span className="text-muted">{property.hostPhone}</span>
                  </a>
                  <Link
                    href="/concierge?prompt=Can%20you%20ask%20Marta%20to%20contact%20me%3F"
                    className="flex items-center justify-between rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-[12px] transition hover:border-ink/20"
                  >
                    <span className="inline-flex items-center gap-2 text-ink-soft">
                      <MessageSquare className="size-3.5 text-muted" /> Via concierge
                    </span>
                    <span className="text-muted">Ask</span>
                  </Link>
                </div>
              </section>
            </Reveal>

            <Note tone="warning" icon={<AlertTriangle className="size-4" />} className="bg-amber-50/60">
              <strong className="font-semibold">Emergencies: call 112.</strong> The
              concierge can notify {property.hostName}, but it cannot send help.
            </Note>
          </aside>
        </div>
      </div>
    </GuestShell>
  );
}
