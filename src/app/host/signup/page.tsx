import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand";
import { SignupForm } from "@/components/host/SignupForm";
import { Disclaimer } from "@/components/guest/GuestShell";
import { Note } from "@/components/ui";
import { getHostSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Create a host account" };
export const dynamic = "force-dynamic";

export default async function HostSignupPage() {
  const session = await getHostSession();
  if (session) redirect("/host");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_68%)] opacity-30"
        />
        <Logo tone="light" />

        <div className="relative max-w-md">
          <p className="eyebrow text-white/40">Host workspace</p>
          <h1 className="mt-4 font-display text-[40px] leading-[1.06] text-white">
            Your property record. Your rules. Your dashboard.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/55">
            An account starts with the Casa Barcelona record already filled in, so you
            can ask the concierge a question within a minute of signing up.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "One verified record behind every guest answer",
              "Tickets with priorities and statuses you control",
              "Conversation briefs instead of reading transcripts",
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
          Host data is scoped to your account. Guest flows never expose your dashboard.
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/host/login"
            className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>

          <h2 className="mt-5 text-[26px] leading-tight font-semibold">Create your account</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            A real Supabase account, created and confirmed here — no dashboard step.
          </p>

          {isSupabaseConfigured ? (
            <div className="mt-7">
              <SignupForm />
            </div>
          ) : (
            <Note tone="warning" className="mt-6" icon={<Building2 className="size-4" />}>
              <span className="font-medium">Supabase is not configured.</span> Local mode
              has a single demo host; add the Supabase variables to create real accounts.
            </Note>
          )}

          <p className="mt-5 text-[11.5px] leading-relaxed text-muted">
            Already have an account?{" "}
            <Link href="/host/login" className="font-medium text-brand">
              Sign in
            </Link>
            .
          </p>

          <div className="mt-8 border-t border-line pt-5">
            <Disclaimer />
          </div>
        </div>
      </div>
    </div>
  );
}
