import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  KeyRound,
  MapPin,
  MessageSquare,
  Sparkles,
  Sun,
  UsersRound,
  Webhook,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Disclaimer } from "@/components/guest/GuestShell";
import { Card, Pill } from "@/components/ui";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestContext } from "@/lib/guest-context";
import { getHostSession } from "@/lib/auth";

export const metadata = {
  title: "Concierge — hosts, guests and a simpler connection",
  description:
    "A small host and guest site: browse hosts, ask to connect, and manage the answer.",
};
export const dynamic = "force-dynamic";

const products = [
  {
    name: "Web",
    description: "This host and guest website.",
    icon: Compass,
  },
  {
    name: "Napkin",
    description: "The visual business and journey map.",
    icon: Sparkles,
  },
  {
    name: "AI agent",
    description: "The concierge and host assistant.",
    icon: MessageSquare,
  },
  {
    name: "Suno",
    description: "The project's sonic identity.",
    icon: Sun,
  },
];

export default async function LandingPage() {
  const [account, stay, host] = await Promise.all([
    getGuestAccount(),
    getGuestContext(),
    getHostSession(),
  ]);

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 right-[-12%] size-[540px] rounded-full bg-[radial-gradient(circle,#F4E4CE_0%,rgba(244,228,206,0)_70%)]"
          />
          <div className="container-page relative py-14 sm:py-20">
            <div className="max-w-2xl">
              <Pill tone="brand">
                <Sparkles className="size-3" /> Independent prototype
              </Pill>
              <h1 className="mt-5 font-display text-[40px] leading-[1.02] tracking-tight sm:text-[58px]">
                Find a host.
                <br />
                Ask to connect.
              </h1>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft">
                Hosts offer a place, an activity or a service. Guests browse, choose
                and send one simple request. No booking required to join.
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {account || stay ? (
                  <>
                    <Link href="/hosts" className="btn-primary h-11 px-5">
                      Browse hosts <ArrowRight className="size-4" />
                    </Link>
                    <Link href="/stay" className="btn-secondary h-11 px-5">
                      My stay
                    </Link>
                    <Link href="/connections" className="btn-secondary h-11 px-5">
                      Connections
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/guest/signup" className="btn-primary h-11 px-5">
                      Create a guest account <ArrowRight className="size-4" />
                    </Link>
                    <Link href="/guest/login" className="btn-secondary h-11 px-5">
                      Guest sign in
                    </Link>
                  </>
                )}
                {host ? (
                  <Link href="/host" className="btn-secondary h-11 px-5">
                    Host dashboard
                  </Link>
                ) : (
                  <Link href="/host/signup" className="btn-secondary h-11 px-5">
                    Become a host
                  </Link>
                )}
              </div>

              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <KeyRound className="size-3" /> Guest accounts are independent
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> Browse more than one host
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="container-page py-12 sm:py-16">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse hosts",
                body: "See who is offering what, in plain language.",
                icon: UsersRound,
              },
              {
                step: "02",
                title: "Ask to connect",
                body: "Open a profile and send one request. No booking needed.",
                icon: UsersRound,
              },
              {
                step: "03",
                title: "Host answers",
                body: "Accepted or declined, the status stays visible to both of you.",
                icon: Check,
              },
            ].map((item) => (
              <Card key={item.step} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink-soft">
                    <item.icon className="size-4" strokeWidth={1.7} />
                  </span>
                  <span className="font-display text-[19px] text-brand">{item.step}</span>
                </div>
                <h2 className="mt-4 text-[14.5px] font-semibold">{item.title}</h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  {item.body}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-white/60">
          <div className="container-page py-12 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Hosts</p>
                <h2 className="mt-1.5 text-[24px] leading-tight font-semibold">
                  A real account and a real offering
                </h2>
                <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
                  Hosts describe their own place, activity or service. Guests see that
                  profile and ask to connect; you accept or decline.
                </p>
              </div>
              <Link href="/hosts" className="btn-secondary btn-sm">
                View the host directory <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Your profile, your words",
                "Several offerings, one account",
                "Clear accept or decline",
              ].map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-3 text-[12px] text-ink-soft"
                >
                  <Check className="size-3.5 text-emerald-600" /> {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="container-page py-12 sm:py-16">
          <p className="eyebrow">The wider project</p>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[24px] leading-tight font-semibold">Four products</h2>
              <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
                This site presents the project. The four products below are separate
                deliverables; only the web product is running here.
              </p>
            </div>
            <Pill tone="neutral">Easy to extend</Pill>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Card key={product.name} className="p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink-soft">
                  <product.icon className="size-4" strokeWidth={1.7} />
                </span>
                <p className="mt-3 text-[13.5px] font-semibold">{product.name}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  {product.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white/60">
        <div className="container-page flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <Webhook className="size-3.5" /> Barcelona · independent prototype
          </div>
          <div className="flex flex-wrap gap-4 text-[11.5px]">
            <Link href="/hosts" className="text-muted hover:text-ink">
              Hosts
            </Link>
            <Link
              href={account ? "/profile" : stay ? "/stay" : "/guest/signup"}
              className="text-muted hover:text-ink"
            >
              {account ? "My account" : stay ? "My stay" : "Guest account"}
            </Link>
            <Link
              href={host ? "/host" : "/host/login"}
              className="text-muted hover:text-ink"
            >
              {host ? "Host dashboard" : "Host sign in"}
            </Link>
          </div>
        </div>
        <div className="container-page pb-7">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
