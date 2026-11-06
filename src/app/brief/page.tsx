import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Compass,
  Database,
  Layers,
  Music4,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Workflow,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";
import { isConciergeConfigured, isSupabaseConfigured } from "@/lib/env";

export const metadata = {
  title: "The brief · Airbnb AI Concierge",
  description:
    "One page on the company, the opportunity, the four-tool ecosystem and the risks behind the Airbnb AI Concierge MVP.",
};

const tools = [
  {
    icon: Layers,
    name: "Web / app MVP",
    what: "This application",
    role: "The product: a guest concierge, a saved day-by-day plan, real maintenance tickets and a host dashboard. Next.js, Supabase and a bounded tool-calling agent, deployed as a running build.",
    state: "Live here",
    live: true,
  },
  {
    icon: Compass,
    name: "Napkin AI",
    what: "Visual thinking",
    role: "Diagrams the business model and the guest journey this product implements: arrival → question → resolution → host action, with where the agent may and may not act.",
    state: "Companion deliverable",
    live: false,
  },
  {
    icon: Music4,
    name: "Suno",
    what: "Sonic branding",
    role: "An original brand sound for the concierge — a short arrival motif and a calmer \"resolved\" sting, so the assistant has a voice beyond text.",
    state: "Companion deliverable",
    live: false,
  },
  {
    icon: Bot,
    name: "Claude as a semi-autonomous agent",
    what: "The concierge itself",
    role: "A system prompt plus seven tools. It reads the host's verified record, files tickets, saves preferences, notifies the host and edits the guest's plan — and is forbidden from inventing any fact or claiming an action it did not perform.",
    state: "Live here",
    live: true,
  },
];

const value = [
  {
    title: "Response time",
    body: "The same questions repeat every stay. The concierge answers from the record in seconds, at any hour, in the guest's language.",
  },
  {
    title: "Host hours",
    body: "Tickets arrive prioritised with the facts already gathered, so the host triages instead of interviewing. Conversations are summarised, not re-read.",
  },
  {
    title: "Consistency",
    body: "One property record means the Wi-Fi code, the quiet hours and the checkout steps cannot drift between channels or staff.",
  },
  {
    title: "Fewer dead ends",
    body: "Missing information is named rather than guessed, and anything urgent escalates to a person with a phone number attached.",
  },
];

const risks = [
  {
    title: "Hallucination",
    body: "Property facts are only reachable through a tool that reads the database; the prompt forbids answering from memory. If a model is unavailable or rate-limited, a deterministic guided agent answers from the same record and says so.",
  },
  {
    title: "Privacy and access",
    body: "Guests are scoped to a signed HTTP-only cookie; hosts authenticate with Supabase and Row Level Security. Keys never reach the browser, and no guest identifier is taken from model output.",
  },
  {
    title: "Reliability and free-tier limits",
    body: "Free model tiers meter tokens per minute. A 429 now triggers a bounded retry, then the guided fallback, so the guest still gets a correct answer instead of an error.",
  },
  {
    title: "No Airbnb integration",
    body: "Airbnb has no public guest-messaging API for this use. The app never scrapes it or fakes a connection: an \"Airbnb\" source on a reservation is reserved for an authorised partner integration and is never written here.",
  },
  {
    title: "Vendor lock-in and cost",
    body: "The model layer is provider-neutral: Claude and any OpenAI-compatible endpoint share one tool contract, and the app runs with no model key at all. Costs scale with conversations, not seats.",
  },
  {
    title: "Demonstration data",
    body: "Casa Barcelona, the guide and its venues are fictional or curated for this prototype. Details must be confirmed before a real guest relies on them.",
  },
];

const demoSteps = [
  "Sign in with the booking email and surname, then open the profile, the stay and the concierge.",
  "Ask for the Wi-Fi, then the washing machine — watch the tool call in the transcript.",
  "Report a heating fault. A real ticket with a code appears in the host dashboard.",
  "Ask for a two-day plan; open Plan, tick a stop off, add your own.",
  "Sign in as the host with one click: the ticket, the stay and the conversation brief.",
  "Optional: remove the model key and repeat a question — guided mode answers from the same record, labelled honestly.",
];

export default function BriefPage() {
  const modelReady = isConciergeConfigured;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to the stay
          </Link>
        </div>
      </header>

      <section className="bg-[#0F0B09] text-cream">
        <div className="container-page py-16 lg:py-20">
          <p className="eyebrow text-white/40">The brief · one page</p>
          <h1 className="mt-4 max-w-3xl text-[34px] leading-[1.06] font-semibold tracking-[-0.03em] text-white sm:text-[46px]">
            An AI concierge that answers from the host&rsquo;s record — and
            <span className="font-display italic text-[#F4E4CE]"> acts </span>
            when something is wrong.
          </h1>
          <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-white/65">
            Airbnb-scale hosting turns hospitality into an inbox. Guests ask the same
            things at the worst possible hours; hosts answer alone, across apps, from
            memory. This MVP gives every stay a concierge with one verified source of
            truth and a direct line into the host&rsquo;s workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/guest/login" className="btn h-11 bg-white px-5 text-ink hover:bg-[#F6EEE3]">
              Guest sign in <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/host/login"
              className="btn h-11 border border-white/25 bg-transparent px-5 text-white hover:border-white/50"
            >
              Open the host dashboard <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <main className="container-page max-w-4xl space-y-14 py-14">
        {/* 1 — OPPORTUNITY */}
        <section>
          <p className="eyebrow">01 · Company &amp; opportunity</p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">
            Airbnb&rsquo;s experience starts after the booking.
          </h2>
          <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-ink-soft">
            <p>
              The platform solved discovery and trust for millions of stays. What it
              cannot solve is the last mile: the lockbox, the boiler, the quiet hours,
              the late checkout. That work lands on individual hosts, usually on a phone,
              usually at 23:40.
            </p>
            <p>
              The opportunity is not another listing page. It is a{" "}
              <strong className="font-semibold text-ink">
                guest-experience layer that knows one property precisely and can act on
                it
              </strong>
              : answer from the host&rsquo;s own record, remember what the guest asked
              for, file a real request when something breaks, and give the host a
              dashboard instead of a backlog.
            </p>
          </div>
        </section>

        {/* 2 — FOUR TOOLS */}
        <section>
          <p className="eyebrow">02 · The ecosystem</p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">
            Four tools, one story.
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
            Each tool is a separate deliverable. Two are running in this application;
            the other two communicate the same company, journey and brand.
          </p>

          <div className="mt-6 space-y-3">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-[18px] border border-line bg-white p-5 sm:flex sm:items-start sm:gap-5"
              >
                <span
                  className={
                    tool.live
                      ? "grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"
                      : "grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-ink-soft"
                  }
                >
                  <tool.icon className="size-[18px]" strokeWidth={1.7} />
                </span>
                <div className="mt-3 sm:mt-0">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <h3 className="text-[14.5px] font-semibold">{tool.name}</h3>
                    <span className="text-[11px] tracking-[0.14em] text-muted uppercase">
                      {tool.what}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{tool.role}</p>
                  <span
                    className={
                      tool.live
                        ? "mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-800"
                        : "mt-3 inline-flex rounded-full bg-sand px-2 py-0.5 text-[10.5px] font-medium text-ink-soft"
                    }
                  >
                    {tool.state}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — WHAT IS LIVE */}
        <section>
          <p className="eyebrow">03 · What is running today</p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">
            Functions, not mock-ups.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: Sparkles,
                title: "Concierge",
                body: "Reads the property record through a tool, answers in the host's tone, asks before filing anything, and never invents a detail.",
              },
              {
                icon: Wrench,
                title: "Tickets",
                body: "A fault becomes a prioritised request with a code, visible immediately on the host dashboard.",
              },
              {
                icon: Workflow,
                title: "The plan",
                body: "A day-by-day itinerary built from the curated guide, saved to the stay, editable by the guest or by the agent.",
              },
              {
                icon: Database,
                title: "Host workspace",
                body: "Property record, requests, guests and conversation briefs — scoped per host by row-level security.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[18px] border border-line bg-white p-5">
                <item.icon className="size-4 text-brand" strokeWidth={1.8} />
                <h3 className="mt-3 text-[13.5px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Model: {modelReady ? "connected" : "not configured — the deterministic guided agent answers from the same record, labelled in the UI"}. Storage:{" "}
            {isSupabaseConfigured ? "Supabase with row-level security" : "local development store"}.
          </p>
        </section>

        {/* 4 — VALUE */}
        <section>
          <p className="eyebrow">04 · Business value</p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">
            Where the return comes from.
          </h2>
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {value.map((item) => (
              <div key={item.title}>
                <h3 className="text-[13.5px] font-semibold">{item.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5 — RISKS */}
        <section>
          <p className="eyebrow">05 · Risks &amp; limitations</p>
          <h2 className="mt-3 flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em]">
            <TriangleAlert className="size-5 text-amber-600" /> What this does not solve.
          </h2>
          <div className="mt-5 space-y-4">
            {risks.map((risk) => (
              <div key={risk.title} className="border-l-2 border-line pl-4">
                <h3 className="text-[13.5px] font-semibold">{risk.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{risk.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6 — DEMO */}
        <section>
          <p className="eyebrow">06 · Live demonstration</p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">
            Five minutes, end to end.
          </h2>
          <ol className="mt-5 space-y-2.5">
            {demoSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-white font-mono text-[11px] text-muted">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[20px] border border-line bg-white p-6">
          <p className="eyebrow">Demo access</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/guest/login" className="btn-primary h-11 px-5">
              Guest sign in <ArrowRight className="size-4" />
            </Link>
            <Link href="/host/login" className="btn-secondary h-11 px-5">
              Host dashboard <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
            Guest access uses the email and surname on the booking, creating a
            profile with the stay and saved preferences. A one-click demo stay is
            available on the sign-in page, and the demo host account is provisioned
            on first use — no manual setup is required.
          </p>
        </section>

        <div className="border-t border-line pt-6">
          <Disclaimer />
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Stack: Next.js, React, Tailwind, Supabase (Postgres, row-level security),
            an Anthropic-compatible and OpenAI-compatible tool loop, Claude configured
            with a custom system prompt and seven tools. Photography: freely licensed
            Wikimedia Commons. Property, guide and venue data are demonstration content.
            Napkin AI, Suno and the Claude agent brief are acknowledged project
            deliverables; only the two marked live run inside this application.
          </p>
        </div>
      </main>
    </div>
  );
}
