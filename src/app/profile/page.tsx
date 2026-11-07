import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  KeyRound,
  Mail,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { Card, EmptyState, Pill } from "@/components/ui";
import { listAffiliationsForGuest } from "@/lib/affiliations";
import { getGuestRepo } from "@/lib/data";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext } from "@/lib/guest-context";
import { initialsFor } from "@/lib/guest-profile";
import { formatDate } from "@/lib/utils";
import type { AffiliationStatus } from "@/lib/types";

export const metadata = { title: "Guest profile" };
export const dynamic = "force-dynamic";

const statusLabel: Record<AffiliationStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

export default async function ProfilePage() {
  const [account, stay] = await Promise.all([getGuestAccount(), getGuestContext()]);
  if (!account && !stay) redirect("/guest/login?next=/profile");

  const affiliations = account ? await listAffiliationsForGuest(account.id) : [];
  const demoReservation = stay
    ? await (await getGuestRepo()).getReservationForGuest(stay.guest.id).catch(() => null)
    : null;
  const name = account?.fullName ?? stay?.guest.guestName ?? "Guest";
  const email = account?.email ?? demoReservation?.guestEmail ?? "Demo stay";

  return (
    <GuestShell
      propertyName={stay?.property.name ?? "Your guest account"}
      active="profile"
      guestName={name}
      hasStay={Boolean(stay)}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="overflow-hidden p-0">
          <div className="relative overflow-hidden bg-ink px-6 py-7 text-cream sm:px-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-28 right-0 size-72 rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_70%)] opacity-25"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 font-display text-[22px] text-white ring-1 ring-white/15">
                  {initialsFor(name)}
                </span>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold tracking-[0.18em] text-white/40 uppercase">
                    Guest profile
                  </p>
                  <h1 className="mt-1 truncate text-[27px] leading-tight font-semibold text-white">
                    {name}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-white/60">
                    <Mail className="size-3.5 shrink-0" /> {email}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {account ? (
                  <Pill tone="brand">Guest account</Pill>
                ) : (
                  <Pill tone="neutral">Demo stay</Pill>
                )}
                <a
                  href="/api/guest/reset"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[11.5px] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Sign out
                </a>
              </div>
            </div>
          </div>

          {!account ? (
            <div className="flex flex-col gap-3 border-t border-line bg-brand-soft/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-muted">
                This is a demo stay, not an account. Create a guest account to keep
                connections and return later.
              </p>
              <Link href="/guest/signup" className="btn-primary btn-sm shrink-0">
                Create account
              </Link>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted" />
              <h2 className="text-[14px] font-semibold">My stay</h2>
            </div>
            {stay ? (
              <div className="mt-3">
                <p className="text-[14px] font-medium">{stay.property.name}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted">
                  <MapPin className="size-3" /> {stay.property.neighbourhood},{" "}
                  {stay.property.city}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-muted">
                  <CalendarDays className="size-3" />{" "}
                  {formatDate(stay.guest.checkInDate)} →{" "}
                  {formatDate(stay.guest.checkOutDate)}
                </p>
                <Link
                  href="/stay"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand"
                >
                  Open my stay <ArrowRight className="size-3" />
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-[12.5px] leading-relaxed text-muted">
                  No stay is linked to this email yet. You can still browse hosts.
                </p>
                <Link
                  href="/hosts"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand"
                >
                  Browse hosts <ArrowRight className="size-3" />
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <UsersRound className="size-4 text-muted" />
              <h2 className="text-[14px] font-semibold">Connections</h2>
            </div>
            {account ? (
              affiliations.length ? (
                <div className="mt-3 space-y-2">
                  {affiliations.slice(0, 3).map((affiliation) => (
                    <div
                      key={affiliation.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium">
                          {affiliation.hostName}
                        </p>
                        <p className="truncate text-[10.5px] text-muted">
                          {affiliation.propertyName}
                        </p>
                      </div>
                      <Pill
                        tone={
                          affiliation.status === "accepted"
                            ? "success"
                            : affiliation.status === "pending"
                              ? "brand"
                              : "neutral"
                        }
                      >
                        {statusLabel[affiliation.status]}
                      </Pill>
                    </div>
                  ))}
                  <Link
                    href="/connections"
                    className="inline-flex items-center gap-1 pt-1 text-[12px] font-medium text-brand"
                  >
                    View all connections <ArrowRight className="size-3" />
                  </Link>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-[12.5px] leading-relaxed text-muted">
                    No host connections yet. Open a host profile and ask to connect.
                  </p>
                  <Link
                    href="/hosts"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand"
                  >
                    Find a host <ArrowRight className="size-3" />
                  </Link>
                </div>
              )
            ) : (
              <div className="mt-3">
                <p className="text-[12.5px] leading-relaxed text-muted">
                  Connections are saved to a guest account. This demo stay does not
                  have one.
                </p>
                <Link
                  href="/guest/signup"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand"
                >
                  Create a guest account <ArrowRight className="size-3" />
                </Link>
              </div>
            )}
          </Card>
        </div>

        <EmptyState
          icon={<UserRound className="size-4" />}
          title={account ? "Your account is ready" : "Want your own account?"}
          description={
            account
              ? "Use the Hosts tab to find someone new, or Connections to see an answer."
              : "A guest account keeps your host connections and any future stays in one place."
          }
          action={
            <Link
              href={account ? "/hosts" : "/guest/signup"}
              className="btn-primary btn-sm"
            >
              {account ? "Browse hosts" : "Create a guest account"}
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />

        {stay ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <Clock3 className="size-3" />
            Stay dates and booking details are controlled by the host. Ask your host if
            something is wrong.
          </p>
        ) : null}
      </div>
    </GuestShell>
  );
}
