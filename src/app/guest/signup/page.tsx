import Link from "next/link";
import { redirect } from "next/navigation";
import { GuestAuthShell } from "@/components/guest/GuestAuthShell";
import { GuestSignupForm } from "@/components/guest/GuestSignupForm";
import { Note } from "@/components/ui";
import { getGuestAccount } from "@/lib/guest-account";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Create a guest account" };
export const dynamic = "force-dynamic";

export default async function GuestSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const account = await getGuestAccount();
  if (account) redirect("/hosts");
  const { next } = await searchParams;

  return (
    <GuestAuthShell
      eyebrow="New guest"
      title="Create your guest account"
      description="Any email works. If it matches a booking, we link the stay automatically. If not, you can browse hosts and ask to connect."
      backHref="/"
      backLabel="Back to the home page"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/guest/login" className="font-medium text-brand">
            Sign in
          </Link>
          {" · "}
          <Link href="/host/signup" className="font-medium text-brand">
            Create a host account
          </Link>
        </>
      }
    >
      {isSupabaseConfigured ? (
        <GuestSignupForm next={next} />
      ) : (
        <Note tone="warning">
          Guest accounts need Supabase. Use the demo stay from the sign-in page while
          running locally.
        </Note>
      )}
    </GuestAuthShell>
  );
}
