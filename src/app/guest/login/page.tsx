import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ConciergeBell,
  KeyRound,
  ShieldCheck,
  Sparkles,
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
  searchParams: Promise<{ code?: string }>;
}) {
  const existing = await getGuestContext();
  if (existing) redirect("/welcome");

  const { code } = await searchParams;
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
          <p className="eyebrow text-white/40">Guest access</p>
          <h1 className="mt-4 font-display text-[40px] leading-[1.06] text-white">
            Your stay is already waiting.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/55">
            Enter the reservation code from your arrival message. No account, no
            password — just the home your host has prepared.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "The door code, Wi-Fi and house guide in one place",
              "A concierge that answers from the verified property record",
              "A problem reported once becomes a real ticket for the host",
            ].map((item, index) => {
              const Icon = [KeyRound, Sparkles, ConciergeBell][index];
              return (
                <div
                  key={item}
                  className="flex items-start gap-2.5 text-[12.5px] text-white/70"
                >
                  <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-white/10">
                    <Icon className="size-2.5 text-brand" />
                  </span>
                  {item}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/35">
          <ShieldCheck className="size-3.5" />
          Prototype access — reservation codes are demonstration credentials.
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
            Sign in to your stay
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Use the reservation code your host sent with your arrival details.
          </p>

          <div className="mt-7">
            <GuestLoginForm initialCode={code ?? ""} />
          </div>

          <div className="my-6 flex items-center gap-3 text-[10.5px] tracking-[0.18em] text-muted uppercase">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[13px] font-semibold">Just exploring?</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Open Alex&rsquo;s demo stay at Casa Barcelona. No code needed.
            </p>
            <a href="/api/guest/start" className="btn-secondary mt-3 h-10 w-full">
              Open the demo stay <ArrowRight className="size-4" />
            </a>
            {demo ? (
              <p className="mt-2 text-center text-[10.5px] text-muted">
                Demo code <span className="font-mono text-ink-soft">{demo.code}</span>
                {" · "}
                {demo.guestName}
              </p>
            ) : null}
          </div>

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
