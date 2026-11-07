import Link from "next/link";
import { Info, Lock, Sparkles } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { SettingsForm } from "@/components/host/SettingsForm";
import { Card, EmptyState, Note, Pill } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import { isConciergeConfigured } from "@/lib/env";

export const metadata = { title: "AI settings" };
export const dynamic = "force-dynamic";

export default async function HostSettingsPage() {
  const workspace = await getHostWorkspace();

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(workspace.properties)}
    >
      <div className="space-y-5">
        <div>
          <p className="eyebrow">AI settings</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            How the concierge speaks
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
            Tune the tone and the service details per property. These settings change
            how the concierge sounds — they cannot change what it is allowed to do.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={isConciergeConfigured ? "success" : "warning"}>
            <span
              className={`size-1.5 rounded-full ${
                isConciergeConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isConciergeConfigured ? "Concierge connected" : "Model not configured"}
          </Pill>
          <Pill tone="neutral">Runs server-side</Pill>
          <Pill tone="neutral">Key never sent to the browser</Pill>
        </div>

        {workspace.properties.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-4" />}
            title="Add a property first"
            description="The concierge settings belong to a property, so create one to configure it."
            action={
              <Link href="/host/properties/new" className="btn-primary btn-sm">
                Add offering
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {workspace.properties.map((property) => (
              <SettingsForm key={property.id} property={property} />
            ))}
          </div>
        )}

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-ink-soft" />
            <h2 className="text-[15px] font-semibold">Fixed behaviour</h2>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            These rules are part of the concierge&rsquo;s system prompt and are not
            configurable from the dashboard:
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              "Only answer property questions from the verified record",
              "Never invent a ticket number, price, opening time or event",
              "Always ask before filing a maintenance request",
              "Ask permission before saving guest preferences",
              "Direct emergencies to 112 before anything else",
              "Never expose another guest's conversation or host-only settings",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-ink-soft">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Note tone="neutral" className="bg-white" icon={<Info className="size-4" />}>
          Settings changes apply to the next guest message. Existing conversations keep
          their history.
        </Note>
      </div>
    </HostShell>
  );
}
