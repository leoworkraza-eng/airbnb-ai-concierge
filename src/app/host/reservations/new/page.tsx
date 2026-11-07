import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { ReservationForm } from "@/components/host/ReservationForm";
import { EmptyState } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";

export const metadata = { title: "New reservation" };
export const dynamic = "force-dynamic";

export default async function NewReservationPage() {
  const workspace = await getHostWorkspace();
  const { properties } = workspace;

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(properties)}
    >
      <div className="space-y-5">
        <Link
          href="/host/reservations"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> Back to reservations
        </Link>

        <div>
          <p className="eyebrow">New reservation</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            Add a booking by hand
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
            This is the supported path while official Airbnb API access is unavailable.
            The row is marked as manual so it is never mistaken for synced data.
          </p>
        </div>

        {properties.length === 0 ? (
          <EmptyState
            title="Add a property first"
            description="Reservations belong to a property, so create one before adding a booking."
            action={
              <Link href="/host/properties/new" className="btn-primary btn-sm">
                Add offering
              </Link>
            }
          />
        ) : (
          <ReservationForm
            properties={properties.map((property) => ({
              id: property.id,
              name: property.name,
            }))}
          />
        )}
      </div>
    </HostShell>
  );
}
