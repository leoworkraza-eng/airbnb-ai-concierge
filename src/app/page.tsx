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
  Wifi,
  Wrench,
} from "lucide-react";
import { ConciergeAvatar, Logo, LogoMark } from "@/components/brand";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { Parallax, Reveal } from "@/components/motion";
import { Disclaimer } from "@/components/guest/GuestShell";
import { isConciergeConfigured, isSupabaseConfigured, storageMode } from "@/lib/env";

export default function LandingPage() {
  const claudeReady = isConciergeConfigured;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-soft md:flex">
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#for-hosts" className="transition hover:text-ink">
              For hosts
            </a>
            <a href="#trust" className="transition hover:text-ink">
              Trust &amp; safety
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/host/login" className="hidden text-[13px] text-ink-soft transition hover:text-ink sm:inline">
              Host sign in
            </Link>
            <Link href="/api/guest/start" className="btn-primary btn-sm">
              Try the guest demo
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#F3E3CD_0%,rgba(243,227,205,0)_68%)]"
        />
        <div className="container-page relative grid items-center gap-14 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div>
            <Reveal className="mb-6" y={14}>
              <Pill tone="neutral" className="bg-white/80">
                <span className="size-1.5 rounded-full bg-brand" />
                AI concierge for short stays
              </Pill>
            </Reveal>
            <Reveal y={26} delay={70}>
              <h1 className="text-[40px] leading-[1.04] font-semibold tracking-[-0.03em] sm:text-[56px] lg:text-[62px]">
                Every guest question,
                <br className="hidden sm:block" /> answered like a{" "}
                <span className="font-display text-brand italic">five-star</span>{" "}
                concierge.
              </h1>
            </Reveal>
            <Reveal className="mt-6" y={22} delay={140}>
              <p className="max-w-xl text-[16px] leading-relaxed text-ink-soft">
                Airbnb Concierge turns a property record, local knowledge and house
                rules into a warm, always-available assistant for guests — and turns
                their problems into real tickets your team can act on.
              </p>
            </Reveal>

            <Reveal className="mt-8" y={20} delay={210}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/api/guest/start" className="btn-primary h-12 px-6 text-[15px]">
                  I&rsquo;m a Guest
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/host/login" className="btn-secondary h-12 px-6 text-[15px]">
                  Are you a Host?
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal className="mt-5" y={16} delay={280}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand" /> No download
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand" /> No guest account
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand" /> Powered by Claude
                </span>
              </div>
            </Reveal>

            {!claudeReady ? (
              <Reveal className="mt-6 max-w-lg" y={16} delay={340}>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[12.5px] leading-relaxed text-amber-900">
                  <strong className="font-semibold">Demo note:</strong> no AI model is
                  connected yet. Add a free <code className="rounded bg-white/70 px-1">AI_API_KEY</code>{" "}
                  (Groq or Google AI Studio) or <code className="rounded bg-white/70 px-1">ANTHROPIC_API_KEY</code>{" "}
                  to <code className="rounded bg-white/70 px-1">.env.local</code> to enable
                  live concierge replies. Everything else — property data, tickets and
                  the host dashboard — already works.
                </div>
              </Reveal>
            ) : null}
          </div>

          {/* Product preview */}
          <Parallax speed={0.26} className="relative">
          <div className="animate-fade-up [animation-delay:120ms]">
            <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[34px] bg-sand/60" />
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
                <div className="flex items-center gap-3">
                  <ConciergeAvatar size="md" />
                  <div>
                    <p className="text-[13.5px] font-semibold leading-tight">
                      Concierge
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Casa Barcelona · online
                    </p>
                  </div>
                </div>
                <Pill tone="brand" className="text-[10px]">
                  Preview
                </Pill>
              </div>

              <div className="space-y-4 bg-[linear-gradient(180deg,#FFFDFB_0%,#FAF7F3_100%)] px-5 py-6">
                <div className="flex justify-end">
                  <p className="max-w-[78%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-cream">
                    How do I use the washing machine?
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <ConciergeAvatar size="sm" />
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                      It&rsquo;s the washer-dryer in the bathroom cupboard. Turn the
                      dial to <span className="font-medium text-ink">Mix 40°</span>,
                      add detergent to the left drawer and press Start. Want the
                      full wash-and-dry steps?
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[10.5px] text-muted">
                      <Wrench className="size-3" />
                      Read the property record
                      <Check className="size-3 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <p className="max-w-[78%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-cream">
                    The heating isn&rsquo;t working — can you help?
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <ConciergeAvatar size="sm" />
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                      I&rsquo;m sorry about that. Is the thermostat showing any
                      display, and is it the radiators or the hot water? Once I know,
                      I can raise it with Marta.
                    </div>
                  </div>
                </div>

                <div className="ml-10 rounded-2xl border border-brand/20 bg-brand-soft/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-dark uppercase">
                      <Wrench className="size-3.5" /> Ticket MT-8Q2F
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-brand-dark">
                      New
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
                    Heating not working · Urgent · Casa Barcelona
                  </p>
                  <p className="mt-1 text-[10.5px] text-muted">
                    Appears instantly in the host dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-line/80 bg-white px-4 py-3">
                <div className="flex-1 rounded-full border border-line bg-cream px-4 py-2 text-[12px] text-muted">
                  Ask anything about your stay…
                </div>
                <span className="grid size-9 place-items-center rounded-full bg-brand text-white">
                  <Sparkles className="size-4" />
                </span>
              </div>
            </Card>

            <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-[0_14px_30px_-18px_rgba(25,19,16,0.35)] sm:flex">
              <span className="grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Check className="size-3.5" />
              </span>
              <div>
                <p className="text-[11px] font-medium text-ink">Answer from verified data</p>
                <p className="text-[10px] text-muted">Never invented Wi-Fi codes</p>
              </div>
            </div>
          </div>
          </Parallax>
        </div>
      </section>

      {/* ----------------------------------------------------------- TRUST BAR */}
      <section className="border-y border-line bg-white/70">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { value: "24/7", label: "Answers between check-in and check-out" },
            { value: "5 tools", label: "Actions Claude can actually run" },
            { value: "1 record", label: "The host's data, never a guess" },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 90} y={14}>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[28px] leading-none text-ink">
                {item.value}
              </span>
              <span className="text-[12.5px] leading-snug text-muted">{item.label}</span>
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- FEATURES */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="One assistant, the whole stay"
          title="The small questions that shape a stay, handled properly."
          description="A concierge that knows the apartment, keeps the guest's preferences in mind, and knows when a human needs to step in."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: KeyRound,
              title: "Arrival without friction",
              body: "Check-in steps, lockbox codes and parking guidance, answered from the host's own record — not from a model's imagination.",
            },
            {
              icon: Wifi,
              title: "Property facts on demand",
              body: "Wi-Fi, appliances, amenities and house rules pulled from the database at the moment they're needed.",
            },
            {
              icon: Compass,
              title: "Personal recommendations",
              body: "Restaurants, nightlife and culture ranked by the guest's interests, budget, time of day and distance.",
            },
            {
              icon: Wrench,
              title: "Real maintenance tickets",
              body: "When something breaks, Claude asks the right questions, confirms, and files a ticket that lands in the host dashboard.",
            },
            {
              icon: MessageSquare,
              title: "Summaries, not transcripts",
              body: "Hosts see what each guest needs — issues, sentiment and next actions — without reading every message.",
            },
            {
              icon: ShieldCheck,
              title: "Honest by design",
              body: "No live traffic or event data is claimed. Unverified details are named as such, and emergencies go to 112.",
            },
          ].map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={(i % 3) * 90 + Math.floor(i / 3) * 70}
              y={30}
              className="h-full"
            >
            <div
              className="group flex h-full flex-col rounded-[20px] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_18px_40px_-30px_rgba(25,19,16,0.45)]"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink transition group-hover:bg-brand-soft group-hover:text-brand">
                <feature.icon className="size-4.5" strokeWidth={1.7} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{feature.body}</p>
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- HOW IT WORKS */}
      <section id="how-it-works" className="border-y border-line bg-sand/40">
        <div className="container-page py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <Reveal y={20}>
                <SectionHeading
                  eyebrow="How it works"
                  title="A guest asks. The concierge checks. The host acts."
                  description="Three connected steps, one system of record. This is the workflow the prototype was built to prove."
                />
              </Reveal>
            </div>

            <ol className="space-y-3">
              {[
                {
                  step: "01",
                  title: "The guest opens their stay",
                  body: "They land straight on the property page — check-in, Wi-Fi, house rules and the concierge. No account, no download.",
                  icon: KeyRound,
                },
                {
                  step: "02",
                  title: "Claude reads the verified record",
                  body: "Property facts are a tool call, not a prompt. If the host hasn't filled something in, the concierge says so instead of inventing it.",
                  icon: Sparkles,
                },
                {
                  step: "03",
                  title: "The action lands where it matters",
                  body: "A confirmed maintenance request becomes a ticket with a real ID, a priority and a notification in the host dashboard.",
                  icon: BellRing,
                },
              ].map((item, i) => (
                <li key={item.step}>
                  <Reveal className="surface flex gap-4 p-5" delay={i * 110} y={30}>
                  <span className="font-display text-[22px] leading-none text-brand">
                    {item.step}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <item.icon className="size-4 text-ink-soft" strokeWidth={1.7} />
                      <h3 className="text-[14.5px] font-semibold">{item.title}</h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
                  </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- FOR HOSTS */}
      <section id="for-hosts" className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHeading
              eyebrow="For hosts"
              title="Less repetition. Better visibility. Same hospitality."
              description="The concierge absorbs the questions you answer ten times a week, and hands you the decisions that actually need a person."
            />

            <ul className="mt-7 space-y-3">
              {[
                "Edit every property detail the concierge is allowed to use — one source of truth.",
                "See maintenance requests with ticket IDs, priorities and status, updated from the dashboard.",
                "Review AI-generated summaries of guest conversations instead of reading transcripts.",
                "Set the tone, service preferences and escalation rules without weakening safety limits.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-soft">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Check className="size-3" strokeWidth={2.4} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/host/login" className="btn-primary">
                Open the host dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/stay" className="btn-secondary">
                See the guest side
              </Link>
            </div>
          </Reveal>

          <Parallax speed={0.16}>
          <Reveal y={30} delay={80}>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">This week</p>
                <p className="mt-1 text-[17px] font-semibold">Casa Barcelona</p>
              </div>
              <Pill tone="success">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Live demo
              </Pill>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Current guests", value: "2" },
                { label: "Open requests", value: "2" },
                { label: "Questions answered", value: "148" },
                { label: "Avg. reply time", value: "4s" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-line bg-cream/70 px-3.5 py-3">
                  <p className="text-[11px] text-muted">{stat.label}</p>
                  <p className="mt-1 text-[21px] leading-none font-semibold tracking-tight">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                  <Wrench className="size-3.5 text-brand" /> Needs attention
                </p>
                <span className="text-[10.5px] text-muted">Just now</span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-start gap-2.5 rounded-lg bg-cream/80 px-3 py-2">
                  <span className="mt-0.5 size-1.5 rounded-full bg-brand" />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">Heating not working · MT-8Q2F</p>
                    <p className="text-[11px] text-muted">Urgent · Alex · created 1 min ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg bg-cream/80 px-3 py-2">
                  <span className="mt-0.5 size-1.5 rounded-full bg-amber-500" />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">Late check-out request · MT-3B9R</p>
                    <p className="text-[11px] text-muted">Low · Thomas · 2 h ago</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
              <MapPin className="size-3" /> Eixample, Barcelona · 1 property
            </p>
          </Card>
          </Reveal>
          </Parallax>
        </div>
      </section>

      {/* -------------------------------------------------------------- TRUST */}
      <section id="trust" className="border-y border-line bg-white/70">
        <div className="container-page py-16 sm:py-20">
          <SectionHeading
            eyebrow="Built on honesty"
            title="An AI concierge you can leave alone with your guests."
            description="The product is designed around what the model is not allowed to do."
            align="center"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verified or silent",
                body: "Property answers come from the host's database record. Missing information is surfaced, never filled with a plausible guess.",
              },
              {
                icon: BellRing,
                title: "Actions are real",
                body: "Tickets and notifications are written to the database before Claude confirms them. A failed write is reported as a failure.",
              },
              {
                icon: Lock,
                title: "Private by default",
                body: "Guest sessions are scoped to a signed cookie, hosts only reach their own properties, and the Anthropic key never leaves the server.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100} y={24}>
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

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-[11px] text-muted">
            <Pill tone="neutral">Claude tool calling</Pill>
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

      {/* ----------------------------------------------------------------- CTA */}
      <section className="container-page py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_70%)] opacity-25"
          />
          <Reveal className="relative" y={22} scale={0.985} blur={false}>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-brand">
              <LogoMark className="size-7" />
            </span>
            <h2 className="mx-auto mt-5 max-w-xl text-[28px] leading-tight font-semibold text-white sm:text-[34px]">
              Walk through the demo exactly as a guest would.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-white/60">
              Arrival, Wi-Fi, the washing machine, a night out, and a heating fault
              that becomes a ticket in the host dashboard.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/api/guest/start" className="btn bg-white px-6 text-ink hover:bg-cream">
                Enter as a guest
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/host/login"
                className="btn border border-white/20 px-6 text-white hover:bg-white/10"
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

      <footer className="border-t border-line bg-white/60">
        <div className="container-page grid gap-8 py-10 sm:grid-cols-[1fr_auto]">
          <div>
            <Logo />
            <p className="mt-4 max-w-md text-[12px] leading-relaxed text-muted">
              An AI hospitality companion for guests and hosts — property answers,
              local discovery and real maintenance workflows in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-ink-soft sm:flex-col">
            <Link href="/stay" className="transition hover:text-ink">
              Guest experience
            </Link>
            <Link href="/host/login" className="transition hover:text-ink">
              Host dashboard
            </Link>
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
          </div>
        </div>
        <div className="container-page border-t border-line py-5">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
