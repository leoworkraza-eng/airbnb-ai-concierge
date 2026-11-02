import Link from "next/link";
import { ArrowRight, Building2, MapPin, Plus, Wifi } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { Card, EmptyState, Pill } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Properties" };
export const dynamic = "force-dynamic";

export default async function HostPropertiesPage() {
  const workspace = await getHostWorkspace();
  const { session, properties, requests } = workspace;

  return (
    <HostShell
      session={session}
      unread={workspace.unread}
      propertyLabel={propertyName(properties)}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Property management</p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
              Your properties
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
              Everything here is what the concierge knows. Edit a property and the
              next guest answer uses it immediately.
            </p>
          </div>
          <Link href="/host/properties/new" className="btn-primary btn-sm">
            <Plus className="size-3.5" /> Add property
          </Link>
        </div>

        {properties.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-4" />}
            title="No properties yet"
            description="Add your first property to give the concierge a verified record to answer from."
            action={
              <Link href="/host/properties/new" className="btn-primary btn-sm">
                <Plus className="size-3.5" /> Add property
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((property) => {
              const open = requests.filter(
                (request) =>
                  request.propertyId === property.id && request.status !== "resolved",
              ).length;

              return (
                <Card key={property.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[16px] font-semibold">{property.name}</h2>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted">
                        <MapPin className="size-3" /> {property.address}
                      </p>
                    </div>
                    <Pill tone={open > 0 ? "brand" : "success"}>
                      {open > 0 ? `${open} open` : "All clear"}
                    </Pill>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                    {property.description || "No description yet."}
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-cream/50 p-3.5">
                    <div>
                      <dt className="text-[10px] tracking-wide text-muted uppercase">
                        Check-in
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-medium">{property.checkIn}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] tracking-wide text-muted uppercase">
                        Check-out
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-medium">{property.checkOut}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] tracking-wide text-muted uppercase">
                        Wi-Fi
                      </dt>
                      <dd className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px]">
                        <Wifi className="size-3 text-muted" /> {property.wifiName || "Not set"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className="text-[10.5px] text-muted">
                      Updated {formatDateTime(property.updatedAt)}
                    </span>
                    <Link
                      href={`/host/properties/${property.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-dark"
                    >
                      Edit <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Adding another property</h2>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            Each property keeps its own record, guest sessions, conversations and
            maintenance tickets. Guest links and property scoping are already built
            into the data model, so a second property works without code changes.
          </p>
        </Card>
      </div>
    </HostShell>
  );
}
