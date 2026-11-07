import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { PropertyForm } from "@/components/host/PropertyForm";
import { getHostWorkspace, propertyName } from "@/lib/host-context";

export const metadata = { title: "Edit offering" };
export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getHostWorkspace();
  const property = workspace.properties.find((item) => item.id === id);

  if (!property) notFound();

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(workspace.properties)}
    >
      <div className="space-y-5">
        <Link
          href="/host/properties"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> Back to offerings
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Edit offering</p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
              {property.name}
            </h1>
            <p className="mt-1 text-[12.5px] text-muted">{property.address}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/host/settings" className="btn-secondary btn-sm">
              <Sparkles className="size-3.5 text-brand" /> AI settings
            </Link>
            <Link
              href={`/hosts/${workspace.session.hostId}`}
              className="btn-secondary btn-sm"
            >
              <ExternalLink className="size-3.5" /> Public profile
            </Link>
          </div>
        </div>

        <PropertyForm property={property} />
      </div>
    </HostShell>
  );
}
