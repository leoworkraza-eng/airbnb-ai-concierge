import Link from "next/link";
import { ArrowRight, Check, Clock3, UsersRound, X } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { AffiliationActions } from "@/components/host/AffiliationActions";
import { Card, EmptyState, Pill } from "@/components/ui";
import { listAffiliationsForHost } from "@/lib/affiliations";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import type { AffiliationStatus } from "@/lib/types";

export const metadata = { title: "Affiliations" };
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

export default async function HostAffiliationsPage() {
  const workspace = await getHostWorkspace();
  const affiliations = await listAffiliationsForHost(
    workspace.session.hostId,
    workspace.properties.map((property) => property.id),
  );
  const pending = affiliations.filter((item) => item.status === "pending");
  const answered = affiliations.filter((item) => item.status !== "pending");

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(workspace.properties)}
    >
      <div className="space-y-5">
        <div>
          <p className="eyebrow">Host workspace</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">Affiliations</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
            Guests ask to connect with you. Accept to confirm the relationship, or
            decline with no further step.
          </p>
        </div>

        {affiliations.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="size-4" />}
            title="No guest requests yet"
            description="When a guest asks to connect, their name, email and offering will appear here."
            action={
              <Link href="/host/properties" className="btn-secondary btn-sm">
                Review your offering <ArrowRight className="size-3.5" />
              </Link>
            }
          />
        ) : (
          <>
            {pending.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-brand" />
                  <h2 className="text-[14px] font-semibold">
                    Waiting for your answer ({pending.length})
                  </h2>
                </div>
                {pending.map((affiliation) => (
                  <Card key={affiliation.id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15.5px] font-semibold">
                            {affiliation.guestName}
                          </h3>
                          <Pill tone="brand">{statusLabel[affiliation.status]}</Pill>
                        </div>
                        <p className="mt-1 text-[11.5px] text-muted">
                          {affiliation.guestEmail} · {affiliation.propertyName}
                        </p>
                        <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted">
                          {affiliation.reservationId
                            ? "This request came from an official reservation on your offering."
                            : "This guest found your profile in the host directory."}
                        </p>
                      </div>
                      <AffiliationActions id={affiliation.id} />
                    </div>
                  </Card>
                ))}
              </section>
            ) : null}

            {answered.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-[14px] font-semibold">Past answers</h2>
                {answered.map((affiliation) => (
                  <Card key={affiliation.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold">
                            {affiliation.guestName}
                          </h3>
                          <Pill tone={statusTone[affiliation.status]}>
                            {affiliation.status === "accepted" ? (
                              <Check className="size-3" />
                            ) : (
                              <X className="size-3" />
                            )}
                            {statusLabel[affiliation.status]}
                          </Pill>
                        </div>
                        <p className="mt-1 text-[11.5px] text-muted">
                          {affiliation.guestEmail} · {affiliation.propertyName}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted">
                        Updated{" "}
                        {new Date(affiliation.updatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </Card>
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </HostShell>
  );
}
