import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Tag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestShell } from "@/components/guest/GuestShell";
import { AffiliationButton } from "@/components/guest/AffiliationButton";
import { Card, Pill } from "@/components/ui";
import { listAffiliationsForGuest } from "@/lib/affiliations";
import { getGuestSessionId } from "@/lib/auth";
import { getGuestAccount } from "@/lib/guest-account";
import { getPublicHost } from "@/lib/hosts";

export const metadata = { title: "Host profile" };
export const dynamic = "force-dynamic";

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ hostId: string }>;
}) {
  const { hostId } = await params;
  const host = await getPublicHost(hostId);
  if (!host) notFound();

  const [account, demoSessionId] = await Promise.all([
    getGuestAccount(),
    getGuestSessionId(),
  ]);
  const affiliations = account ? await listAffiliationsForGuest(account.id) : [];
  const affiliation = affiliations.find((item) => item.hostId === host.id) ?? null;

  const lead = host.offerings[0];
  const content = (
    <div className="space-y-5">
      <Link
        href="/hosts"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> All hosts
      </Link>

      <Card className="overflow-hidden p-0">
        <div className="relative overflow-hidden bg-ink px-6 py-7 text-cream sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_70%)] opacity-25"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="brand">{lead.typeLabel}</Pill>
                <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
                  <MapPin className="size-3" /> {host.city}
                </span>
              </div>
              <h1 className="mt-4 font-display text-[34px] leading-tight text-white">
                {host.name}
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/65">
                {host.description}
              </p>
            </div>
            <AffiliationButton
              hostId={host.id}
              propertyId={lead.property.id}
              hostName={host.name}
              signedIn={Boolean(account)}
              initialStatus={affiliation?.status ?? null}
              nextPath={`/hosts/${host.id}`}
            />
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          <div>
            <h2 className="text-[15px] font-semibold">What {host.name} offers</h2>
            <div className="mt-3 divide-y divide-line rounded-xl border border-line">
              {host.offerings.map((offering) => (
                <div key={offering.property.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium">{offering.property.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {offering.category}
                        {offering.duration ? ` · ${offering.duration}` : ""}
                      </p>
                    </div>
                    {offering.priceLabel ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-ink-soft">
                        <Tag className="size-3 text-muted" /> {offering.priceLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                    {offering.property.description}
                  </p>
                  {offering.property.address ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted">
                      <MapPin className="size-3" /> {offering.property.address}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-cream/50 p-4">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-medium">
              <CalendarClock className="size-3.5 text-muted" /> Connection, not a booking
            </p>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
              Asking to connect sends a request to {host.name}. They accept or decline.
              You can see the status in your connections, and so can they.
            </p>
          </div>
        </div>
      </Card>

      {!account ? (
        <Card className="p-5">
          <p className="text-[13px] font-semibold">
            {demoSessionId ? "You are in the demo stay." : "New to Concierge?"}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {demoSessionId
              ? "Create a guest account to send connection requests. The demo stay alone cannot receive a host response."
              : "Create a guest account to ask a host to connect and to track their answer."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/guest/signup" className="btn-primary btn-sm">
              Create a guest account
            </Link>
            <Link href="/guest/login" className="btn-secondary btn-sm">
              Sign in
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );

  if (account || demoSessionId) {
    return (
      <GuestShell
        propertyName={account ? `Hosts · ${host.city}` : "Demo stay"}
        active="hosts"
        guestName={account?.fullName ?? "Demo guest"}
        hasStay={Boolean(demoSessionId)}
        planning={Boolean(account) && !demoSessionId}
      >
        {content}
      </GuestShell>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="container-page py-8 sm:py-10">{content}</main>
    </div>
  );
}
