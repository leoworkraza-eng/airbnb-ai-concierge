import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Logo } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";
import { GuestSignupForm } from "@/components/guest/GuestSignupForm";
import { Note } from "@/components/ui";
import { getGuestAccount } from "@/lib/guest-account";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Create a guest account" };
export const dynamic = "force-dynamic";

export default async function GuestSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const account = await getGuestAccount();
  if (account) redirect("/welcome");

  const { email } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_68%)] opacity-30"
        />
        <Logo tone="light" />

        <div className="relative max-w-md">
          <p className="eyebrow text-white/40">Guest accounts</p>
          <h1 className="mt-4 font-display text-[40px] leading-[1.06] text-white">
            Your stay. Your account. One place.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/55">
            Create a real guest account with the email on your Casa Barcelona
            booking. Your profile, stay history and preferences stay together.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: UserPlus, text: "One account for this stay and future returns" },
              { icon: KeyRound, text: "Email and password sign-in, managed by Supabase" },
              {
                icon: Sparkles,
                text: "Your profile, stay history and saved preferences in one place",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-start gap-2.5 text-[12.5px] text-white/70"
              >
                <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-white/10">
                  <item.icon className="size-2.5 text-brand" />
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/35">
          <ShieldCheck className="size-3.5" />
          Guest accounts are linked to a booking and cannot reach the host dashboard.
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/guest/login"
            className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to guest sign in
          </Link>

          <h2 className="mt-5 text-[26px] leading-tight font-semibold">
            Create your guest account
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Use the email on your booking. We link the account to that stay.
          </p>

          {isSupabaseConfigured ? (
            <div className="mt-7">
              <GuestSignupForm initialEmail={email ?? ""} />
            </div>
          ) : (
            <Note tone="warning" className="mt-6">
              Guest accounts need Supabase. Use the one-click demo stay instead.
            </Note>
          )}

          <p className="mt-5 text-[11.5px] leading-relaxed text-muted">
            Already have an account?{" "}
            <Link href="/guest/account" className="font-medium text-brand">
              Sign in
            </Link>
            {" · "}
            Prefer no account?{" "}
            <Link href="/guest/login" className="font-medium text-brand">
              Use your booking details
            </Link>
          </p>

          <div className="mt-8 border-t border-line pt-5">
            <Disclaimer />
          </div>
        </div>
      </div>
    </div>
  );
}
