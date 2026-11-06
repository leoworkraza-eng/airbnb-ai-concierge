import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand";
import { LoginForm } from "@/components/host/LoginForm";
import { Disclaimer } from "@/components/guest/GuestShell";
import { Note } from "@/components/ui";
import { getHostSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { demoHostHint } from "@/lib/auth";

export const metadata = { title: "Host sign in" };
export const dynamic = "force-dynamic";

export default async function HostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const session = await getHostSession();
  if (session) redirect("/host");

  const { setup } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_68%)] opacity-30"
        />
        <Logo tone="light" />

        <div className="relative max-w-md">
          <p className="eyebrow text-white/40">Host workspace</p>
          <h1 className="mt-4 font-display text-[40px] leading-[1.06] text-white">
            The questions, handled. The decisions, yours.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/55">
            Edit the property record the concierge answers from, watch maintenance
            requests arrive, and read a short brief on every guest conversation.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "One verified source of truth for every property fact",
              "Ticket IDs, priorities and statuses you control",
              "AI summaries instead of reading transcripts",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-[12.5px] text-white/70">
                <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-white/10">
                  <Sparkles className="size-2.5 text-brand" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/35">
          <ShieldCheck className="size-3.5" />
          Host data is scoped to your account. Guest flows never expose your
          dashboard.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to the guest experience
          </Link>

          <h2 className="mt-5 text-[26px] leading-tight font-semibold">
            Welcome back
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">
            {isSupabaseConfigured
              ? "Sign in with your host account. Sessions are managed by Supabase."
              : "Sign in with the demo host account to explore the dashboard."}
          </p>

          {setup === "property" ? (
            <Note
              tone="warning"
              className="mt-5"
              icon={<Building2 className="size-4" />}
            >
              <span className="font-medium">No property is set up yet.</span> Sign in
              to create the first property — the guest experience needs a verified
              record before it can start a stay.
            </Note>
          ) : null}

          <div className="mt-7">
            <LoginForm demo={demoHostHint} />
          </div>

          <Note tone="neutral" className="mt-5" icon={<ShieldCheck className="size-4" />}>
            <span className="font-medium text-ink-soft">Demo credentials.</span>{" "}
            <span className="font-mono text-[11.5px]">{demoHostHint.email}</span> /{" "}
            <span className="font-mono text-[11.5px]">{demoHostHint.password}</span>. Use
            either the button above or these details in the form.
            {isSupabaseConfigured
              ? " Host authentication runs through Supabase; the demo account is provisioned on first use."
              : " Without Supabase configured, this is the local development account."}
          </Note>

          {isSupabaseConfigured ? (
            <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
              For your own account, create it in Supabase → Authentication → Users and
              sign in above. A profile row is created on first sign-in, and the starter
              property is seeded for you.
            </p>
          ) : null}

          <div className="mt-8 border-t border-line pt-5">
            <Disclaimer />
          </div>
        </div>
      </div>
    </div>
  );
}
