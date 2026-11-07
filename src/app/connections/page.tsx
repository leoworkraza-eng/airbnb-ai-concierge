import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock3, MapPin, UserRound, UsersRound } from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { AffiliationButton } from "@/components/guest/AffiliationButton";
import { Card, EmptyState, Pill } from "@/components/ui";
import { listAffiliationsForGuest } from "@/lib/affiliations";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext } from "@/lib/guest-context";
import type { AffiliationStatus } from "@/lib/types";

export const metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

const statusTone: Record<AffiliationStatus, "brand" | "success" | "neutral"> = {
  pending: "brand",
  accepted: "success",
  declined: "neutral",
};

const statusLabel: Record<AffiliationStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

export default async function ConnectionsPage() {
  const [account, stay] = await Promise.all([getGuestAccount(), getGuestContext()]);
  if (!account && !stay) redirect("/guest/login?next=/connections");

  if (!account) {
    return (
      <GuestShell
        propertyName={stay?.property.name ?? "Demo stay"}
        active="connections"
        guestName={stay?.guest.guestName ?? "Guest"}
        hasStay
      >
        <div className="mx-auto max-w-2xl">
          <Card className="p-6 sm:p-8">
            <p className="eyebrow">Connections</p>
            <h1 className="mt-2 text-[28px] leading-tight font-semibold">
              A guest account is needed
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              This demo stay is not linked to an account, so host answers cannot be
              saved. Create an account with the booking email to keep them.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/guest/signup" className="btn-primary">
                Create a guest account
              </Link>
              <Link href="/hosts" className="btn-secondary">
                Browse hosts
              </Link>
            </div>
          </Card>
        </div>
      </GuestShell>
    );
  }

  const affiliations = await listAffiliationsForGuest(account.id);
  const pending = affiliations.filter((item) => item.status === "pending").length;

  return (
    <GuestShell
      propertyName={
        stay?.isPlanning
          ? "Your guest account"
          : (stay?.property.name ?? "Your guest account")
      }
      active="connections"
      guestName={account.fullName}
      hasStay={Boolean(stay && !stay.isPlanning)}
      planning={Boolean(stay?.isPlanning)}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Guest account</p>
            <h1 className="mt-1.5 text-[30px] leading-tight font-semibold">
              Your connections
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
              Every host you asked to connect with, and their answer.
            </p>
          </div>
          {pending > 0 ? (
            <Pill tone="brand">
              <Clock3 className="size-3" /> {pending} pending
            </Pill>
          ) : null}
        </div>

        {affiliations.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="size-4" />}
            title="No connections yet"
            description="Browse the hosts, open a profile you like, and ask them to connect. Their answer will appear here."
            action={
              <Link href="/hosts" className="btn-primary btn-sm">
                Browse hosts <ArrowRight className="size-3.5" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {affiliations.map((affiliation) => (
              <Card key={affiliation.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[16px] font-semibold">{affiliation.hostName}</h2>
                      <Pill tone={statusTone[affiliation.status]}>
                        {statusLabel[affiliation.status]}
                      </Pill>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted">
                      <MapPin className="size-3" /> {affiliation.propertyName}
                    </p>
                    <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted">
                      {affiliation.status === "pending"
                        ? `${affiliation.hostName} has not answered yet.`
                        : affiliation.status === "accepted"
                          ? `You are connected. Open ${affiliation.hostName}'s profile to see their offerings.`
                          : `${affiliation.hostName} declined this request. You can ask another host or try again.`}
                      {affiliation.reservationId
                        ? " This request is linked to your reservation."
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/hosts/${affiliation.hostId}`}
                      className="btn-secondary btn-sm"
                    >
                      View host
                    </Link>
                    {affiliation.status === "declined" ? (
                      <AffiliationButton
                        hostId={affiliation.hostId}
                        propertyId={affiliation.propertyId}
                        hostName={affiliation.hostName}
                        signedIn
                        initialStatus={affiliation.status}
                        nextPath="/connections"
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <UserRound className="mt-0.5 size-4 shrink-0 text-muted" />
            <div>
              <p className="text-[12.5px] font-medium">Your guest profile</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {account.fullName} · {account.email}
              </p>
            </div>
          </div>
          <Link href="/profile" className="text-[12px] font-medium text-brand">
            Open profile <ArrowRight className="size-3" />
          </Link>
        </Card>
      </div>
    </GuestShell>
  );
}
