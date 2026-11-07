import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { RequestForm } from "@/components/guest/RequestForm";
import { Card, EmptyState, Note, Pill } from "@/components/ui";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestRepo } from "@/lib/data";
import {
  formatDateTime,
  priorityLabels,
  priorityStyles,
  statusLabels,
  statusStyles,
} from "@/lib/utils";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const context = await getGuestContext();
  if (!context) {
    const account = await getGuestAccount();
    redirect(account ? "/stay" : "/guest/login?next=/support");
  }

  const { property, guest } = context;
  const repo = await getGuestRepo();
  const requests = await repo.listMaintenanceForGuest(guest.id);

  return (
    <GuestShell propertyName={property.name} active="support" guestName={guest.guestName}>
      <div className="mb-5">
        <p className="eyebrow">Support</p>
        <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
          Something not right?
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Report a problem, ask {property.hostName} for help, or request an extra
          service. Every submission becomes a tracked ticket.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card className="border-red-200 bg-red-50/50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-700" />
              <div>
                <h2 className="text-[14px] font-semibold text-red-900">
                  If it&rsquo;s an emergency, call 112 first
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-red-900/80">
                  Fire, gas, flooding, a medical emergency or danger to a person.
                  The concierge and this form cannot dispatch help.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="tel:112" className="btn bg-red-600 btn-sm text-white hover:bg-red-700">
                    <Phone className="size-3.5" /> Call 112
                  </a>
                  <a
                    href={`tel:${property.hostPhone.replace(/\s/g, "")}`}
                    className="btn-secondary btn-sm"
                  >
                    Call {property.hostName}
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                <Wrench className="size-4" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold">New request</h2>
                <p className="text-[11.5px] text-muted">
                  Saved to the database and visible to {property.hostName}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <RequestForm hostName={property.hostName} />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold">Your requests</h2>
              <span className="text-[11px] text-muted">
                {requests.length} total
              </span>
            </div>
            <div className="mt-4">
              {requests.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="size-4" />}
                  title="No requests yet"
                  description="Anything you report here — or through the concierge — will appear in this list with its ticket number."
                />
              ) : (
                <ul className="space-y-3">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="rounded-xl border border-line bg-cream/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted">
                            {request.ticketCode}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityStyles[request.priority]}`}
                          >
                            {priorityLabels[request.priority]}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusStyles[request.status]}`}
                          >
                            {statusLabels[request.status]}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
                          <Clock className="size-3" /> {formatDateTime(request.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                        {request.description}
                      </p>
                      <p className="mt-1.5 text-[10.5px] text-muted capitalize">
                        {request.category} · updated {formatDateTime(request.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold">Contact your host</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              {property.hostName} handles anything the concierge can&rsquo;t decide,
              including refunds, late check-out and access problems.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href={`tel:${property.hostPhone.replace(/\s/g, "")}`}
                className="flex items-center justify-between rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-[12.5px] transition hover:border-ink/20"
              >
                <span className="inline-flex items-center gap-2">
                  <Phone className="size-3.5 text-muted" /> Call
                </span>
                <span className="text-muted">{property.hostPhone}</span>
              </a>
              <a
                href={`mailto:${property.hostEmail}`}
                className="flex items-center justify-between rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-[12.5px] transition hover:border-ink/20"
              >
                <span className="inline-flex items-center gap-2">
                  <Mail className="size-3.5 text-muted" /> Email
                </span>
                <span className="text-muted">Write</span>
              </a>
              <a
                href="/concierge?prompt=Can%20you%20ask%20the%20host%20to%20contact%20me%3F"
                className="flex items-center justify-between rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-[12.5px] transition hover:border-ink/20"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-muted" /> Via concierge
                </span>
                <span className="text-muted">Ask</span>
              </a>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-ink-soft" />
              <h2 className="text-[14px] font-semibold">How your request is handled</h2>
            </div>
            <ol className="mt-3 space-y-3">
              {[
                "Saved with a unique ticket number and priority.",
                "The host is notified in the dashboard immediately.",
                "Status moves from New to In progress to Resolved.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sand text-[10px] font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-[12px] leading-relaxed text-muted">{step}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Note tone="neutral" icon={<AlertTriangle className="size-4" />} className="bg-white">
            <Pill tone="warning" className="mb-2">
              Important
            </Pill>
            <p>
              The concierge cannot promise a repair time, refund or compensation. It
              records the request and escalates it to {property.hostName}.
            </p>
          </Note>
        </aside>
      </div>
    </GuestShell>
  );
}
