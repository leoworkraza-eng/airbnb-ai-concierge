import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { PropertyForm } from "@/components/host/PropertyForm";
import { getHostWorkspace, propertyName } from "@/lib/host-context";

export const metadata = { title: "Add a property" };
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const workspace = await getHostWorkspace();

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
        <div>
          <p className="eyebrow">New offering</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            Add an offering
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
            Choose a stay, activity or service, then add the details guests should see.
          </p>
        </div>

        <PropertyForm />
      </div>
    </HostShell>
  );
}
