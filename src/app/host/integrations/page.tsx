import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Link2,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { AirbnbConnectionForm } from "@/components/host/AirbnbConnectionForm";
import { Card, Note, Pill } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import { getServiceRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { formatDateTime } from "@/lib/utils";
import type { HostIntegration, IntegrationStatus } from "@/lib/types";

export const metadata = { title: "Airbnb connection" };
export const dynamic = "force-dynamic";

const statusCopy: Record<
  IntegrationStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "brand" }
> = {
  not_connected: { label: "Not connected", tone: "neutral" },
  demo: { label: "Demo mode — no live data", tone: "warning" },
  pending_verification: { label: "Awaiting Airbnb approval", tone: "brand" },
  connected: { label: "Connected", tone: "success" },
  error: { label: "Error", tone: "warning" },
};

export default async function AirbnbConnectionPage() {
  const workspace = await getHostWorkspace();

  let integration: HostIntegration | null = null;
  let migrationMessage: string | null = null;

  try {
    integration = await (await getServiceRepo()).getIntegration(workspace.session.hostId);
  } catch (error) {
    if (error instanceof MigrationRequiredError) migrationMessage = error.message;
    else console.error("[host/integrations] could not read the connection", error);
  }

  const status = statusCopy[integration?.status ?? "not_connected"];

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(workspace.properties)}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Airbnb connection</p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
              Integration architecture
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
              This page is built for a real Airbnb integration: connection state,
              server-side credentials, sync status and error handling. It is also honest
              about why nothing is connected today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={status.tone}>
              <span
                className={`size-1.5 rounded-full ${
                  integration?.status === "connected"
                    ? "bg-emerald-500"
                    : integration?.status === "demo"
                      ? "bg-amber-500"
                      : "bg-ink/30"
                }`}
              />
              {status.label}
            </Pill>
            <Pill tone="neutral">
              <Link2 className="size-3" /> airbnb
            </Pill>
          </div>
        </div>

        {migrationMessage ? (
          <Note tone="warning">
            <strong className="font-semibold">Migration pending.</strong>{" "}
            {migrationMessage}
          </Note>
        ) : null}

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-ink-soft" />
              <h2 className="text-[15px] font-semibold">Connection status</h2>
            </div>
            {integration ? (
              <span className="text-[11px] text-muted">
                Updated {formatDateTime(integration.updatedAt)}
              </span>
            ) : null}
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-cream/50 p-3.5">
              <dt className="text-[10.5px] tracking-wide text-muted uppercase">Mode</dt>
              <dd className="mt-1 text-[12.5px] font-medium capitalize">
                {integration?.mode ?? "oauth"}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-cream/50 p-3.5">
              <dt className="text-[10.5px] tracking-wide text-muted uppercase">
                Credentials
              </dt>
              <dd className="mt-1 text-[12.5px] font-medium">
                {integration?.hasCredentials ? "Stored server-side" : "None stored"}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-cream/50 p-3.5">
              <dt className="text-[10.5px] tracking-wide text-muted uppercase">
                Last sync attempt
              </dt>
              <dd className="mt-1 text-[12.5px] font-medium">
                {integration?.lastSyncAt
                  ? formatDateTime(integration.lastSyncAt)
                  : "Never attempted"}
              </dd>
            </div>
          </dl>

          {integration?.lastError ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-red-800">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {integration.lastError}
            </p>
          ) : null}

          {integration && integration.events.length > 0 ? (
            <div className="mt-4">
              <p className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Sync log
              </p>
              <ul className="mt-2 space-y-2">
                {integration.events.slice(0, 6).map((event, index) => (
                  <li
                    key={`${event.at}-${index}`}
                    className="flex items-start gap-2 rounded-lg border border-line bg-white px-3 py-2"
                  >
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        event.kind === "error" ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-[11.5px] leading-relaxed text-ink-soft">
                        {event.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {formatDateTime(event.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <AirbnbConnectionForm
          integration={integration}
          migrationPending={Boolean(migrationMessage)}
        />

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Unplug className="size-4 text-ink-soft" />
            <h2 className="text-[15px] font-semibold">Why this cannot connect today</h2>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            Airbnb does not offer a public API. Access is granted only through its API
            Programme — the Homes API (listings, availability, reservations) and the
            Activities API (activities and guest messages) — to companies that are
            accepted as software partners. Airbnb decides which scopes each partner
            receives, and it can change or revoke them. There is no self-serve key, no
            free tier and no academic access. Scraping or calling undocumented endpoints
            breaches Airbnb&rsquo;s terms, so this prototype does neither.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              "Company entity, not an individual",
              "Mutual NDA and Airbnb API Terms",
              "Partner-specific terms signed",
              "Data security review passed",
              "Build against the partner sandbox",
              "Mandatory API features shipped within six months",
            ].map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[12px] leading-relaxed text-ink-soft"
              >
                <Check className="mt-0.5 size-3 shrink-0 text-brand" strokeWidth={2.6} />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-[11.5px]">
            <a
              href="https://developer.withairbnb.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-dark"
            >
              Airbnb developer portal <ExternalLink className="size-3" />
            </a>
            <a
              href="https://www.airbnb.com/help/article/3418"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-dark"
            >
              Airbnb API Terms <ExternalLink className="size-3" />
            </a>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-ink-soft" />
            <h2 className="text-[15px] font-semibold">What this build does instead</h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {[
              "Reservations can be created by hand and are labelled “Added by host”.",
              "The demo property ships with sample reservations labelled “Demo data”.",
              "A guest session claims the next open sample reservation, so the stay page has real context.",
              "Credential fields, connection state and a sync log exist and persist — ready for an approved app.",
              "Sync attempts fail honestly and record the reason; nothing is ever presented as imported.",
            ].map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[12.5px] leading-relaxed text-ink-soft"
              >
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                  strokeWidth={2.6}
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
            Review the reservation list in{" "}
            <Link href="/host/reservations" className="font-medium text-brand">
              Reservations
            </Link>{" "}
            to see the source label on every row.
          </p>
        </Card>
      </div>
    </HostShell>
  );
}
