import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";
import { GuestLoginForm } from "@/components/guest/GuestLoginForm";
import { getGuestRepo } from "@/lib/data";
import { getGuestContext } from "@/lib/guest-context";

export const metadata = { title: "Guest sign in" };
export const dynamic = "force-dynamic";

export default async function GuestLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const existing = await getGuestContext();
  if (existing) redirect("/welcome");

  const { email } = await searchParams;
  const repo = await getGuestRepo();
  const property = await repo.getPrimaryProperty().catch(() => null);
  const reservations = property
    ? await repo.listReservations([property.id]).catch(() => [])
    : [];
  const demo =
    reservations.find(
      (reservation) => reservation.source === "demo" && reservation.status !== "cancelled",
    ) ?? null;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_68%)] opacity-30"
        />
        <Logo tone="light" />

        <div className="relative max-w-md">
          <p className="eyebrow text-white/40">Guest profiles</p>
          <h1 className="mt-4 font-display text-[40px] leading-[1.06] text-white">
            Your booking is already your profile.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/55">
            Sign in with the email and surname on your reservation. We open the
            right stay, with your preferences and booking history attached.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Mail, text: "The email address used for the booking" },
              { icon: UserRound, text: "The surname on the reservation" },
              {
                icon: Sparkles,
                text: "Your stay, saved preferences and history in one place",
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
          Prototype access — profiles are linked to demonstration bookings.
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to Casa Barcelona
          </Link>

          <h2 className="mt-5 text-[26px] leading-tight font-semibold">
            Sign in to your profile
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            The email and surname on your Casa Barcelona booking.
          </p>
          <p className="mt-2 text-[12px] text-muted">
            New here?{" "}
            <Link href="/guest/signup" className="font-medium text-brand">
              Create a guest account
            </Link>{" "}
            with your booking email.
          </p>

          <div className="mt-6">
            <GuestLoginForm initialEmail={email ?? ""} />
          </div>

          <div className="my-6 flex items-center gap-3 text-[10.5px] tracking-[0.18em] text-muted uppercase">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[13px] font-semibold">Just exploring?</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Open {demo?.guestName ?? "Alex Rivera"}&rsquo;s demo profile at Casa
              Barcelona. No details needed.
            </p>
            <a href="/api/guest/start" className="btn-secondary mt-3 h-10 w-full">
              Open the demo stay <ArrowRight className="size-4" />
            </a>
            {demo?.guestEmail ? (
              <p className="mt-2 text-center text-[10.5px] text-muted">
                Demo profile{" "}
                <span className="text-ink-soft">{demo.guestEmail}</span>
              </p>
            ) : null}
          </div>

          <p className="mt-4 text-center text-[11.5px] text-muted">
            Have a guest account?{" "}
            <Link href="/guest/account" className="font-medium text-brand">
              Sign in with your password
            </Link>
          </p>

          <p className="mt-6 text-[12px] text-muted">
            Are you the host?{" "}
            <Link
              href="/host/login"
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              Host sign in
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
