import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { SignupForm } from "@/components/host/SignupForm";
import { Disclaimer } from "@/components/guest/GuestShell";
import { Note } from "@/components/ui";
import { getHostSession } from "@/lib/auth";
import { getGuestAccount } from "@/lib/guest-account";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Create a host account" };
export const dynamic = "force-dynamic";

export default async function HostSignupPage() {
  const [session, guest] = await Promise.all([getHostSession(), getGuestAccount()]);
  if (session) redirect("/host");

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-cream/85">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Link href="/host/login" className="text-[12px] font-medium text-brand">
            Host sign in
          </Link>
        </div>
      </header>
      <main className="container-page max-w-2xl py-8 sm:py-10">
        <Link
          href="/host/login"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> Back to host sign in
        </Link>
        <div className="mt-5">
          <p className="eyebrow">Host workspace</p>
          <h1 className="mt-1.5 text-[30px] leading-tight font-semibold">
            Create your host account
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
            Describe yourself and your first offering. Guests will see this in the
            host directory and can ask to connect.
          </p>
        </div>

        <div className="mt-6">
          {guest ? (
            <Note tone="warning">
              You are signed in as a guest.{" "}
              <a href="/api/guest/reset" className="font-medium underline">
                Sign out of the guest account
              </a>{" "}
              before creating a host account.
            </Note>
          ) : isSupabaseConfigured ? (
            <SignupForm />
          ) : (
            <Note tone="warning" icon={<Building2 className="size-4" />}>
              Host accounts need Supabase. In local mode, use the demo host on the host
              sign-in page.
            </Note>
          )}
        </div>

        <div className="mt-8 flex items-start gap-2.5 border-t border-line pt-5 text-[11px] text-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Host and guest accounts are separate. A host account cannot open a guest
            profile and a guest account cannot open the host workspace.
          </p>
        </div>
        <div className="mt-4">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
