import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  KeyRound,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  Webhook,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ConciergeAvatar } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";
import { Card, Pill } from "@/components/ui";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestSessionId, getHostSession } from "@/lib/auth";

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
  const [account, guestSessionId, host] = await Promise.all([
    getGuestAccount(),
    getGuestSessionId(),
    getHostSession(),
  ]);
  const hasGuestAccess = Boolean(account || guestSessionId);

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-cream"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="relative isolate overflow-hidden border-b border-line">
          <div aria-hidden="true" className="hero-aurora hero-aurora-a" />
          <div aria-hidden="true" className="hero-aurora hero-aurora-b" />
          <div aria-hidden="true" className="hero-grid" />

          <div className="container-page relative z-10 py-14 sm:py-20 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div className="max-w-2xl">
                <Pill tone="brand">
                  <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                  Independent prototype
                </Pill>
                <h1 className="mt-5 font-hero text-[46px] leading-[0.92] tracking-[-0.045em] sm:text-[68px] lg:text-[76px]">
                  <span className="block">
                    <span className="hero-word">Find a host.</span>
                  </span>
                  <span className="mt-1 block">
                    <span
                      className="hero-word"
                      style={{ animationDelay: "140ms" }}
                    >
                      Ask to
                    </span>{" "}
                    <span
                      className="hero-word relative text-brand"
                      style={{ animationDelay: "250ms" }}
                    >
                      connect.
                      <span
                        aria-hidden="true"
                        className="hero-underline absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-brand via-[#f08a5d] to-gold"
                      />
                    </span>
                  </span>
                </h1>
                <p
                  className="hero-fade mt-5 max-w-xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]"
                  style={{ animationDelay: "400ms" }}
                >
                  Hosts offer a place, an activity or a service. Guests browse, choose
                  and send one simple request. No booking required to join.
                </p>

                <div
                  className="hero-fade mt-7 flex flex-wrap gap-2.5"
                  style={{ animationDelay: "500ms" }}
                >
                  {hasGuestAccess ? (
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
                      <Link href="/concierge" className="btn-secondary h-11 px-5">
                        Concierge
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

                <p
                  className="hero-fade mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted"
                  style={{ animationDelay: "600ms" }}
                >
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="size-3" /> Guest accounts are independent
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" /> Browse more than one host
                  </span>
                </p>
              </div>

              <div
                className="hero-fade relative mx-auto w-full max-w-md lg:max-w-none"
                style={{ animationDelay: "620ms" }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-brand/15 via-transparent to-gold/25 blur-2xl"
                />

                <div className="surface surface-shadow relative overflow-hidden rounded-[28px]">
                  <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                      <ConciergeAvatar size="md" className="avatar-breathe" />
                      <div>
                        <p className="text-[13px] leading-tight font-semibold">
                          Concierge
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          Casa Barcelona · Eixample
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Verified
                    </span>
                  </div>

                  <div className="space-y-3.5 bg-[linear-gradient(180deg,#FFFDFB_0%,#FAF7F3_100%)] px-5 py-5">
                    <div className="ml-auto max-w-[84%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[12px] leading-relaxed text-cream">
                      What&rsquo;s the Wi-Fi password?
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ConciergeAvatar size="sm" />
                      <div className="rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-soft">
                        <span className="font-medium text-ink">
                          CasaBarcelona_Guest
                        </span>
                        <span className="text-muted"> · </span>
                        <span className="font-mono text-[11px]">
                          Barcelona2026Demo
                        </span>
                        <span className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-700">
                          <Check className="size-3" /> From the host&rsquo;s record
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-line bg-white px-5 py-3 text-[10.5px] text-muted">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    Verified answers · real maintenance tickets
                  </div>
                </div>

                <div className="float-slow absolute -bottom-5 -left-4 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_18px_40px_-24px_rgba(25,19,16,0.5)] sm:block">
                  <p className="text-[9px] tracking-[0.16em] text-muted uppercase">
                    Tonight
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium">
                    3 stops near Eixample
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-12 sm:py-16">
          <div className="stagger grid gap-3 md:grid-cols-3">
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
          <div className="stagger mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              href={account ? "/profile" : guestSessionId ? "/stay" : "/guest/signup"}
              className="text-muted hover:text-ink"
            >
              {account ? "My account" : guestSessionId ? "My stay" : "Guest account"}
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
