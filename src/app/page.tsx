import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Check,
  Compass,
  KeyRound,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Sun,
  Wifi,
  Wrench,
} from "lucide-react";
import { ConciergeAvatar } from "@/components/brand";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { Parallax, Reveal } from "@/components/motion";
import { Disclaimer } from "@/components/guest/GuestShell";
import { CinematicHero } from "@/components/landing/CinematicHero";
import { media, mediaCredits } from "@/lib/media";
import { isConciergeConfigured, isSupabaseConfigured, storageMode } from "@/lib/env";

export const metadata = {
  title: "Your stay, reimagined",
  description:
    "Casa Barcelona, an Eixample apartment with an AI concierge: verified property answers, a curated city guide and maintenance requests that reach the host.",
};

export default function LandingPage() {
  const claudeReady = isConciergeConfigured;

  return (
    <div className="min-h-screen bg-[#0F0B09]">
      <CinematicHero />

      {/* ------------------------------------------------------------ THE STAY */}
      <section id="the-stay" className="relative bg-cream">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <Reveal y={26}>
            <p className="eyebrow">The stay · Eixample, Barcelona</p>
            <h2 className="mt-4 text-[34px] leading-[1.06] font-semibold tracking-[-0.03em] sm:text-[46px]">
              A home that
              <span className="font-display italic text-brand"> already knows </span>
              your name.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              Hydraulic floors, tall shuttered windows and a small rooftop terrace —
              five minutes from Passeig de Gràcia. The concierge holds the whole
              record: the lockbox code, the Wi-Fi, the washing machine, the quiet
              hours. Ask once, get the real answer.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                { term: "Bedrooms", detail: "2" },
                { term: "Sleeps", detail: "4" },
                { term: "Terrace", detail: "Rooftop" },
                { term: "Arrival", detail: "15:00" },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="text-[10px] tracking-[0.18em] text-muted uppercase">
                    {item.term}
                  </dt>
                  <dd className="mt-1 font-display text-[22px] leading-none">{item.detail}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/api/guest/start" className="btn-primary h-12 px-6 text-[14.5px]">
                Explore your stay <ArrowRight className="size-4" />
              </Link>
              <Link href="/host/login" className="btn-secondary h-12 px-6 text-[14.5px]">
                Host dashboard <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted">
              <MapPin className="size-3" /> Carrer de Mallorca 245, 3º B · demonstration
              property
            </p>
          </Reveal>

          <div className="relative">
            <Parallax speed={0.14} maxOffset={48}>
              <div className="relative aspect-4/5 overflow-hidden rounded-[26px] border border-line bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.cover}
                  alt="A tree-lined street in the Dreta de l'Eixample, Barcelona"
                  width={1600}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,11,9,0.75))] p-5 pt-16">
                  <p className="font-display text-[19px] text-white">Casa Barcelona</p>
                  <p className="mt-1 text-[11.5px] text-white/70">
                    Third floor · lift · rooftop terrace
                  </p>
                </div>
              </div>
            </Parallax>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                { src: media.interior, alt: "A restored apartment interior with period details", label: "Interiors" },
                { src: media.rooftop, alt: "A rooftop terrace above the Eixample", label: "The roof" },
              ].map((shot) => (
                <div key={shot.label} className="group overflow-hidden rounded-[18px] border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    width={1600}
                    height={1067}
                    loading="lazy"
                    decoding="async"
                    className="h-32 w-full object-cover transition-transform duration-700 group-hover:scale-[1.06] sm:h-40"
                  />
                  <p className="bg-white px-3 py-2 text-[11px] tracking-wide text-muted uppercase">
                    {shot.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- THE CONCIERGE */}
      <section id="the-concierge" className="relative overflow-hidden bg-[#12100E] py-20 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-1/4 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(226,43,79,0.22)_0%,rgba(226,43,79,0)_68%)]"
        />
        <div className="container-page relative grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <Reveal y={24}>
              <p className="text-[10.5px] font-semibold tracking-[0.3em] text-white/45 uppercase">
                The concierge
              </p>
              <h2 className="mt-4 text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-white sm:text-[44px]">
                Ask anything.
                <br />
                It reads the record,
                <span className="font-display italic text-[#F4E4CE]"> not its imagination.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/60">
                Every property answer is a lookup against the host&rsquo;s own data.
                If something is missing, the concierge says so. When something is
                broken, it files a real ticket — and only confirms after the write
                lands.
              </p>
            </Reveal>

            <ul className="mt-8 space-y-3.5">
              {[
                { icon: KeyRound, text: "Arrival, lockbox, check-out and parking, without a phone call." },
                { icon: Wifi, text: "Wi-Fi, appliances and house rules, quoted exactly." },
                { icon: Compass, text: "A city guide shaped by the guest's own interests." },
                { icon: Wrench, text: "Maintenance tickets with an ID, a priority and a notification." },
                { icon: ShieldCheck, text: "Emergencies go to 112 — the model never pretends to send help." },
              ].map((item, index) => (
                <Reveal key={item.text} delay={index * 70} y={14}>
                  <li className="flex items-start gap-3 text-[13.5px] leading-relaxed text-white/70">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5">
                      <item.icon className="size-3 text-[#F4E4CE]" strokeWidth={1.8} />
                    </span>
                    {item.text}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal y={30} delay={100}>
            <div className="rounded-[26px] border border-white/12 bg-white/[0.045] p-2 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="rounded-[20px] bg-[#FBFAF8] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-line/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <ConciergeAvatar size="md" />
                    <div>
                      <p className="text-[13.5px] font-semibold leading-tight">Concierge</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Casa Barcelona · online
                      </p>
                    </div>
                  </div>
                  <Pill tone="neutral" className="text-[10px]">
                    Sample conversation
                  </Pill>
                </div>

                <div className="space-y-3.5 pt-4">
                  <div className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-cream">
                      The heating isn&rsquo;t working — can you help?
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <ConciergeAvatar size="sm" />
                    <div className="max-w-[86%]">
                      <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                        I&rsquo;m sorry — let&rsquo;s get that sorted. Is the thermostat
                        showing anything, and is it the radiators or the hot water?
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[10.5px] text-muted">
                          <MessageSquare className="size-3" /> Asked a clarifying question
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-cream">
                      Radiators. Yes, please send someone.
                    </p>
                  </div>

                  <div className="ml-10 rounded-2xl border border-brand/25 bg-brand-soft/60 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-brand-dark uppercase">
                        <Wrench className="size-3.5" /> Ticket filed
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-brand-dark">
                        New
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                      Heating · radiators not warming · urgent
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
                      <Check className="size-3 text-emerald-600" /> Saved to the host
                      dashboard. Marta has been notified.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-line/80 pt-3.5">
                  <div className="flex-1 rounded-full border border-line bg-cream px-4 py-2 text-[12px] text-muted">
                    Ask anything about your stay…
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-brand text-white">
                    <Sparkles className="size-4" />
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------- FOR HOSTS */}
      <section id="for-hosts" className="bg-sand/50 py-20 lg:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Reveal y={26}>
            <SectionHeading
              eyebrow="For hosts"
              title="Less repetition. Better visibility. The same hospitality."
              description="The concierge absorbs the questions you answer ten times a week, and hands you only the decisions that need a person."
            />
            <ul className="mt-7 space-y-3">
              {[
                "Edit every property detail the concierge is allowed to use — one source of truth.",
                "Watch maintenance requests arrive with a ticket ID, priority and status you can change.",
                "Read an AI brief of each conversation instead of the whole transcript.",
                "Set the tone and escalation rules without weakening the safety limits.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-soft">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Check className="size-3" strokeWidth={2.6} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/host/login" className="btn-primary h-11 px-5">
                Open the host dashboard <ArrowRight className="size-4" />
              </Link>
              <Link href="/api/guest/start" className="btn-secondary h-11 px-5">
                See the guest side
              </Link>
            </div>
          </Reveal>

          <Reveal y={30} delay={90}>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <p className="eyebrow">Sample dashboard</p>
                  <p className="mt-1 text-[16px] font-semibold">Casa Barcelona</p>
                </div>
                <Pill tone="neutral">Illustration</Pill>
              </div>

              <div className="grid grid-cols-2 divide-x divide-y divide-line border-b border-line sm:grid-cols-4 sm:divide-y-0">
                {[
                  { label: "Guests", value: "2" },
                  { label: "Open tickets", value: "2" },
                  { label: "Arriving", value: "1" },
                  { label: "Unread notes", value: "2" },
                ].map((stat) => (
                  <div key={stat.label} className="px-4 py-3.5">
                    <p className="text-[10.5px] text-muted">{stat.label}</p>
                    <p className="mt-1 text-[20px] leading-none font-semibold tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 px-5 py-4">
                {[
                  { title: "Heating not working", meta: "MT-8Q2F · Urgent · Alex", tone: "bg-brand" },
                  { title: "Late check-out request", meta: "MT-3B9R · Low · Thomas", tone: "bg-amber-500" },
                  { title: "Wi-Fi password asked twice", meta: "Concierge · stable connection", tone: "bg-emerald-500" },
                ].map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center gap-3 rounded-xl border border-line bg-cream/60 px-3.5 py-2.5"
                  >
                    <span className={`size-1.5 shrink-0 rounded-full ${row.tone}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium">{row.title}</p>
                      <p className="truncate text-[10.5px] text-muted">{row.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="border-t border-line px-5 py-3 text-[10.5px] leading-relaxed text-muted">
                Illustrative layout, not live data. Sign in to the host dashboard to
                see the real tickets, guests and notifications stored in the database.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- HOW IT WORKS */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="A guest asks. The concierge checks. The host acts."
            description="Three connected steps, one system of record."
            align="center"
          />
          <div className="mt-11 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: KeyRound,
                title: "The guest opens their stay",
                body: "Straight to the property — check-in, Wi-Fi, house rules and the concierge. No account, no download.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "The record is read, not guessed",
                body: "Property facts are a tool call against the database. Missing information is surfaced, never invented.",
              },
              {
                step: "03",
                icon: BellRing,
                title: "The action lands where it matters",
                body: "A confirmed request becomes a ticket with a real ID, a priority and a notification for the host.",
              },
            ].map((item, index) => (
              <Reveal key={item.step} delay={index * 100} y={26} className="h-full">
                <div className="flex h-full flex-col rounded-[22px] border border-line bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink-soft">
                      <item.icon className="size-4" strokeWidth={1.7} />
                    </span>
                    <span className="font-display text-[20px] text-brand">{item.step}</span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- TRUST */}
      <section className="border-y border-line bg-white/70">
        <div className="container-page py-16">
          <SectionHeading
            eyebrow="Built on honesty"
            title="An AI concierge you can leave alone with your guests."
            description="The product is designed around what the model is not allowed to do."
            align="center"
          />
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verified or silent",
                body: "Answers come from the host's record. Missing details are named, never filled with a plausible guess.",
              },
              {
                icon: BellRing,
                title: "Actions are real",
                body: "Tickets are written before the concierge confirms. A failed write is reported as a failure.",
              },
              {
                icon: Lock,
                title: "Private by default",
                body: "Guests are scoped to a signed cookie, hosts only reach their own properties, keys stay server-side.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 90} y={22}>
                <div className="text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-sand text-ink">
                    <item.icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-4 text-[14.5px] font-semibold">{item.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {!claudeReady ? (
            <div className="mx-auto mt-9 max-w-xl rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[12.5px] leading-relaxed text-amber-900">
              <strong className="font-semibold">Guided mode:</strong> with no model key
              connected, the concierge still answers from the property record, the city
              guide and real ticket writes. Add a free{" "}
              <code className="rounded bg-white/70 px-1">AI_API_KEY</code> (Groq or Google
              AI Studio) or <code className="rounded bg-white/70 px-1">ANTHROPIC_API_KEY</code>{" "}
              for free-form conversation on top.
            </div>
          ) : null}

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-[11px] text-muted">
            <Pill tone="neutral">Tool calling</Pill>
            <Pill tone="neutral">Supabase + row level security</Pill>
            <Pill tone="neutral">
              Storage: {storageMode === "supabase" ? "Supabase" : "local development store"}
            </Pill>
            <Pill tone="neutral">
              Host auth: {isSupabaseConfigured ? "Supabase" : "demo account"}
            </Pill>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ ECOSYSTEM */}
      <section className="border-t border-line bg-cream py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="The wider project"
            title="One product inside a four-tool AI ecosystem."
            description="This application is the customer-facing half. The other three tools in the project are separate deliverables, shown alongside it rather than wired into it."
            align="center"
          />

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MessageSquare,
                name: "Airbnb AI Concierge",
                role: "Customer-facing concierge for guests and hosts",
                state: "Running here",
                live: true,
              },
              {
                icon: Compass,
                name: "Napkin AI",
                role: "Visual business model and customer journey",
                state: "Separate tool",
                live: false,
              },
              {
                icon: Sun,
                name: "Suno",
                role: "Original sonic branding for the concept",
                state: "Separate tool",
                live: false,
              },
              {
                icon: Sparkles,
                name: "Claude business agent",
                role: "Semi-autonomous agent with its own system prompt",
                state: "Separate tool",
                live: false,
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-[20px] border border-line bg-white p-5"
              >
                <span
                  className={
                    item.live
                      ? "grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"
                      : "grid size-9 place-items-center rounded-xl bg-sand text-ink-soft"
                  }
                >
                  <item.icon className="size-4" strokeWidth={1.7} />
                </span>
                <p className="mt-4 text-[13.5px] font-semibold">{item.name}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.role}</p>
                <div className="mt-3">
                  <Pill tone={item.live ? "success" : "neutral"}>{item.state}</Pill>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-[11.5px] leading-relaxed text-muted">
            These four are independent deliverables: no data is exchanged between
            them, and only this application is a running product. Anything the
            others would contribute — a business agent reading aggregate stay
            performance, for example — is a design proposal for now, not a
            connection that exists.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.facade}
            alt=""
            aria-hidden="true"
            width={1600}
            height={1200}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,11,9,0.82),rgba(15,11,9,0.92))]" />
        </div>
        <div className="container-page relative py-20 text-center">
          <Reveal y={22}>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/5 backdrop-blur">
              <Sun className="size-5 text-[#F4E4CE]" />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-[30px] leading-[1.08] font-semibold text-white sm:text-[40px]">
              Walk through it exactly as a guest would.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-white/60">
              Arrival, Wi-Fi, the washing machine, a night out, and a heating fault that
              becomes a ticket in the host dashboard.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/api/guest/start"
                className="btn h-12 bg-white px-7 text-ink hover:bg-[#F6EEE3]"
              >
                Enter as a guest <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/host/login"
                className="btn h-12 border border-white/25 px-7 text-white hover:bg-white/10"
              >
                Enter as a host
              </Link>
            </div>
            <p className="mt-5 text-[11px] text-white/40">
              Demo host: host@casabarcelona.demo · Concierge2026
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#0F0B09] text-white/60">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-[22px] text-white">Casa Barcelona</p>
            <p className="mt-3 max-w-md text-[12px] leading-relaxed text-white/45">
              An AI hospitality companion for guests and hosts — property answers, local
              discovery and real maintenance workflows in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] sm:flex-col">
            <Link href="/api/guest/start" className="transition hover:text-white">
              Guest experience
            </Link>
            <Link href="/host/login" className="transition hover:text-white">
              Host dashboard
            </Link>
            <a href="#the-concierge" className="transition hover:text-white">
              The concierge
            </a>
          </div>
        </div>

        <div className="container-page pb-10">
          <details className="group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <summary className="cursor-pointer list-none text-[11px] tracking-[0.14em] text-white/45 uppercase transition hover:text-white/80">
              Photography credits ({mediaCredits.length})
            </summary>
            <ul className="mt-3 grid gap-1.5 text-[11px] leading-relaxed text-white/40 sm:grid-cols-2">
              {mediaCredits.map((credit) => (
                <li key={credit.file}>
                  <a
                    href={credit.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline decoration-white/20 underline-offset-2 transition hover:text-white/80"
                  >
                    {credit.title}
                  </a>{" "}
                  — {credit.author} · {credit.license}
                </li>
              ))}
            </ul>
          </details>
          <div className="mt-6">
            <Disclaimer className="text-white/35" />
          </div>
        </div>
      </footer>
    </div>
  );
}
