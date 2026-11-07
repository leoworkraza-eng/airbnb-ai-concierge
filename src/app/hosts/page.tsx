import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, MapPin, Sparkles, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestShell } from "@/components/guest/GuestShell";
import { Card, EmptyState, Pill } from "@/components/ui";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext } from "@/lib/guest-context";
import { getPublicHosts } from "@/lib/hosts";

export const metadata = { title: "Hosts" };
export const dynamic = "force-dynamic";

export default async function HostsPage() {
  const [hosts, account, stay] = await Promise.all([
    getPublicHosts(),
    getGuestAccount(),
    getGuestContext(),
  ]);

  const content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Browse</p>
          <h1 className="mt-1.5 text-[30px] leading-tight font-semibold">Hosts</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
            Local people offering a place, an activity or a service. Open a profile,
            then ask the host to connect.
          </p>
        </div>
        <Pill tone="neutral">
          {hosts.length} host{hosts.length === 1 ? "" : "s"}
        </Pill>
      </div>

      {hosts.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="size-4" />}
          title="No hosts yet"
          description="Host profiles appear here as soon as someone creates an account and adds an offering."
          action={
            <Link href="/host/signup" className="btn-secondary btn-sm">
              Become the first host <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {hosts.map((host) => {
            const lead = host.offerings[0];
            return (
              <Card key={host.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand font-display text-[18px]">
                      {host.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-[17px] font-semibold">{host.name}</h2>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-muted">
                        <MapPin className="size-3" /> {host.city}
                      </p>
                    </div>
                  </div>
                  <Pill tone="brand">{lead.typeLabel}</Pill>
                </div>

                <p className="mt-4 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">
                  {host.description}
                </p>

                <div className="mt-4 rounded-xl border border-line bg-cream/50 p-3.5">
                  <p className="text-[10.5px] tracking-[0.14em] text-muted uppercase">
                    Offers
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {host.offerings.slice(0, 3).map((offering) => (
                      <li key={offering.property.id} className="text-[12.5px] text-ink-soft">
                        {offering.property.name}
                        <span className="text-muted"> · {offering.category}</span>
                        {offering.priceLabel ? (
                          <span className="text-muted"> · {offering.priceLabel}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {host.offerings.length > 3 ? (
                    <p className="mt-1 text-[11px] text-muted">
                      +{host.offerings.length - 3} more
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/hosts/${host.id}`}
                  className="btn-secondary btn-sm mt-auto self-start pt-0 sm:mt-4"
                >
                  View {host.name.split(" ")[0]}&rsquo;s profile
                  <ArrowRight className="size-3.5" />
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {!account ? (
        <Card className="flex flex-col gap-4 border-brand/15 bg-brand-soft/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <p className="text-[13px] font-semibold">
                {stay ? "You are browsing as a demo guest." : "Sign in to ask a host to connect."}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                A guest account keeps your requests and their answers in one place.
              </p>
            </div>
          </div>
          <Link
            href={stay ? "/guest/signup" : "/guest/login"}
            className="btn-primary btn-sm shrink-0"
          >
            {stay ? "Create a guest account" : "Guest sign in"}
            <ArrowRight className="size-3.5" />
          </Link>
        </Card>
      ) : null}
    </div>
  );

  if (account || stay) {
    return (
      <GuestShell
        propertyName={stay?.property.name ?? "Hosts in Barcelona"}
        active="hosts"
        guestName={account?.fullName ?? stay?.guest.guestName ?? "Guest"}
        hasStay={Boolean(stay)}
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
