import Link from "next/link";
import { redirect } from "next/navigation";
import { GuestAuthShell } from "@/components/guest/GuestAuthShell";
import { GuestAccountForm } from "@/components/guest/GuestAccountForm";
import { Note } from "@/components/ui";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext } from "@/lib/guest-context";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Guest sign in" };
export const dynamic = "force-dynamic";

export default async function GuestLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const account = await getGuestAccount();
  if (account) redirect("/welcome");
  const { next } = await searchParams;

  const demoStay = await getGuestContext();

  return (
    <GuestAuthShell
      eyebrow="Guest account"
      title="Sign in to your guest area"
      description="Use the email and password you chose. A booking is optional; your guide, plan and concierge are waiting."
      backHref="/"
      backLabel="Back to the home page"
      footer={
        <>
          No account yet?{" "}
          <Link href="/guest/signup" className="font-medium text-brand">
            Create a guest account
          </Link>
          {" · "}
          <Link href="/host/login" className="font-medium text-brand">
            I&rsquo;m a host
          </Link>
        </>
      }
    >
      {isSupabaseConfigured ? (
        <GuestAccountForm next={next} />
      ) : (
        <Note tone="warning">
          Guest accounts need Supabase. Use the demo stay below while running locally.
        </Note>
      )}

      <div className="my-5 flex items-center gap-3 text-[10.5px] tracking-[0.16em] text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      {demoStay ? (
        <Link href="/welcome" className="btn-secondary h-11 w-full">
          Continue the demo stay
        </Link>
      ) : (
        <a href="/api/guest/start" className="btn-secondary h-11 w-full">
          Open a demo stay instead
        </a>
      )}
      <p className="mt-2 text-center text-[10.5px] text-muted">
        Demo only. It does not create an account.
      </p>
    </GuestAuthShell>
  );
}
