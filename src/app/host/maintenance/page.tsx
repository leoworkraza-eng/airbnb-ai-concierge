import Link from "next/link";
import { CheckCircle2, Clock, Filter, Wrench } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { StatusSelect } from "@/components/host/StatusSelect";
import { Card, EmptyState, Pill } from "@/components/ui";
import { getHostWorkspace, propertyName } from "@/lib/host-context";
import {
  cn,
  formatDateTime,
  priorityLabels,
  priorityStyles,
  statusLabels,
  statusStyles,
} from "@/lib/utils";
import type { MaintenanceStatus, Priority } from "@/lib/types";

export const metadata = { title: "Maintenance" };
export const dynamic = "force-dynamic";

const priorities: Priority[] = ["urgent", "high", "normal", "low"];
const statuses: MaintenanceStatus[] = ["new", "in_progress", "resolved"];

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const workspace = await getHostWorkspace();
  const { status, priority } = await searchParams;

  const propertyNames = new Map(
    workspace.properties.map((property) => [property.id, property.name]),
  );

  const filtered = workspace.requests.filter((request) => {
    if (status && request.status !== status) return false;
    if (priority && request.priority !== priority) return false;
    return true;
  });

  const base = "/host/maintenance";
  const query = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status, priority, ...next };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const string = params.toString();
    return string ? `${base}?${string}` : base;
  };

  const counts = {
    new: workspace.requests.filter((request) => request.status === "new").length,
    in_progress: workspace.requests.filter((request) => request.status === "in_progress")
      .length,
    resolved: workspace.requests.filter((request) => request.status === "resolved")
      .length,
  };

  return (
    <HostShell
      session={workspace.session}
      unread={workspace.unread}
      propertyLabel={propertyName(workspace.properties)}
    >
      <div className="space-y-5">
        <div>
          <p className="eyebrow">Maintenance</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            Maintenance &amp; requests
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
            Every ticket created by the concierge or the guest support form appears
            here. Update the status as you work through them.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "New", value: counts.new, icon: Wrench, tone: "text-brand" },
            {
              label: "In progress",
              value: counts.in_progress,
              icon: Clock,
              tone: "text-amber-600",
            },
            {
              label: "Resolved",
              value: counts.resolved,
              icon: CheckCircle2,
              tone: "text-emerald-600",
            },
          ].map((item) => (
            <div key={item.label} className="surface flex items-center gap-3 px-4 py-3">
              <item.icon className={`size-4 ${item.tone}`} />
              <div>
                <p className="text-[18px] leading-none font-semibold">{item.value}</p>
                <p className="mt-1 text-[11px] text-muted">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
              <Filter className="size-3.5" /> Filter
            </p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip href={query({ status: undefined })} active={!status}>
                All statuses
              </FilterChip>
              {statuses.map((option) => (
                <FilterChip
                  key={option}
                  href={query({ status: option })}
                  active={status === option}
                >
                  {statusLabels[option]}
                </FilterChip>
              ))}
              <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
              <FilterChip href={query({ priority: undefined })} active={!priority}>
                Any priority
              </FilterChip>
              {priorities.map((option) => (
                <FilterChip
                  key={option}
                  href={query({ priority: option })}
                  active={priority === option}
                >
                  {priorityLabels[option]}
                </FilterChip>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Wrench className="size-4" />}
                title="No tickets match this filter"
                description="Try a different status, or ask a guest to report an issue through the concierge."
                action={
                  <Link href={base} className="btn-secondary btn-sm">
                    Clear filters
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden border-b border-line bg-cream/50 px-4 py-2.5 text-[10.5px] font-medium tracking-wide text-muted uppercase sm:grid sm:grid-cols-[92px_1fr_120px_110px_150px] sm:gap-3">
                <span>Ticket</span>
                <span>Issue</span>
                <span>Priority</span>
                <span>Created</span>
                <span>Status</span>
              </div>
              <ul className="divide-y divide-line">
                {filtered.map((request) => (
                  <li
                    key={request.id}
                    className="grid gap-3 px-4 py-4 sm:grid-cols-[92px_1fr_120px_110px_150px] sm:items-start"
                  >
                    <div>
                      <span className="font-mono text-[11.5px] font-medium text-ink">
                        {request.ticketCode}
                      </span>
                      <p className="mt-1 text-[10px] text-muted capitalize sm:hidden">
                        {request.category}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[13px] leading-relaxed text-ink">
                        {request.description}
                      </p>
                      <p className="mt-1 text-[10.5px] text-muted">
                        {request.guestName} ·{" "}
                        {propertyNames.get(request.propertyId) ?? "Property"}
                        {request.urgencyNote ? ` · ${request.urgencyNote}` : ""}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityStyles[request.priority]}`}
                      >
                        {priorityLabels[request.priority]}
                      </span>
                    </div>

                    <div className="text-[10.5px] text-muted">
                      {formatDateTime(request.createdAt)}
                    </div>

                    <div>
                      <StatusSelect requestId={request.id} status={request.status} />
                      <p className="mt-1 text-[10px] text-muted">
                        Updated {formatDateTime(request.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <p className="flex items-center gap-2 text-[11px] text-muted">
          <Pill tone="neutral">Live data</Pill>
          Status changes are written to the database immediately and are visible to
          the next page load.
        </p>
      </div>
    </HostShell>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
        active
          ? "border-ink bg-ink text-cream"
          : "border-line bg-white text-ink-soft hover:border-ink/25",
      )}
    >
      {children}
    </Link>
  );
}
