import Link from "next/link";
import type { ReactNode } from "react";
import { NavLink } from "@/components/nav-link";
import {
  CalendarRange,
  Compass,
  ConciergeBell,
  House,
  KeyRound,
  LifeBuoy,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-muted/90", className)}>
      Airbnb Concierge is an independent educational prototype. It is not
      affiliated with, endorsed by, or connected to Airbnb. Property, guest and
      venue details are fictional demonstration data; photography is freely
      licensed and credited on the home page.
    </p>
  );
}

export type GuestTab =
  | "welcome"
  | "stay"
  | "hosts"
  | "connections"
  | "profile"
  | "itinerary"
  | "concierge"
  | "explore"
  | "support";

type NavItem = { id: GuestTab; label: string; href: string; icon: LucideIcon };

const noStayTabs: NavItem[] = [
  { id: "welcome", label: "Overview", href: "/welcome", icon: House },
  { id: "stay", label: "My stay", href: "/stay", icon: KeyRound },
  { id: "hosts", label: "Hosts", href: "/hosts", icon: MapPin },
  { id: "connections", label: "Connections", href: "/connections", icon: UsersRound },
  { id: "profile", label: "Profile", href: "/profile", icon: UserRound },
];

const stayTabs: NavItem[] = noStayTabs;

const stayTools: NavItem[] = [
  { id: "itinerary", label: "Plan", href: "/itinerary", icon: CalendarRange },
  { id: "concierge", label: "Concierge", href: "/concierge", icon: ConciergeBell },
  { id: "explore", label: "Explore", href: "/explore", icon: Compass },
  { id: "support", label: "Support", href: "/support", icon: LifeBuoy },
];

function linkClass(current: boolean) {
  return cn(
    "group relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300",
    current
      ? "bg-ink text-cream shadow-[0_10px_24px_-16px_rgba(25,19,16,0.9)]"
      : "text-ink-soft hover:bg-sand/80",
  );
}

export function GuestShell({
  propertyName,
  active,
  guestName,
  hasStay = true,
  planning = false,
  children,
}: {
  propertyName: string;
  active: GuestTab;
  guestName: string;
  hasStay?: boolean;
  planning?: boolean;
  children: ReactNode;
}) {
  const withTools = hasStay || planning;
  const tabs = withTools ? stayTabs : noStayTabs;
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <a
        href="#guest-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-cream"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="hidden h-8 w-px bg-line sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[13px] font-medium text-ink">{propertyName}</p>
              <p className="text-[11px] text-muted">
                {hasStay ? "Guest stay" : planning ? "Planning" : "Guest account"} ·{" "}
                {guestName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/guest/reset"
              className="text-[12px] text-muted transition hover:text-ink"
            >
              Sign out
            </a>
            <Link href="/host/login" className="btn-secondary btn-sm">
              Host sign in
            </Link>
          </div>
        </div>
        <nav aria-label="Guest sections" className="border-t border-line/60">
          <div className="container-page no-scrollbar flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const current = active === tab.id;
              return (
                <NavLink
                  key={tab.id}
                  href={tab.href}
                  current={current}
                  className={linkClass(current)}
                >
                  <tab.icon
                    className={cn(
                      "size-3.5 transition-transform duration-300",
                      current ? "text-brand" : "text-muted group-hover:scale-110",
                    )}
                    strokeWidth={1.9}
                  />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>
          {withTools ? (
            <div className="border-t border-line/50 bg-white/35">
              <div className="container-page no-scrollbar flex items-center gap-1 overflow-x-auto py-1.5">
                <span className="mr-1 shrink-0 text-[10px] tracking-[0.14em] text-muted uppercase">
                  {planning && !hasStay ? "Trip tools" : "Stay tools"}
                </span>
                {stayTools.map((tab) => {
                  const current = active === tab.id;
                  return (
                    <NavLink
                      key={tab.id}
                      href={tab.href}
                      current={current}
                      className={cn(
                        "relative inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] transition",
                        current
                          ? "bg-sand text-ink"
                          : "text-muted hover:bg-sand/70 hover:text-ink",
                      )}
                    >
                      <tab.icon className="size-3" />
                      {tab.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ) : null}
        </nav>
      </header>

      <main id="guest-main" className="container-page flex-1 py-6 sm:py-9">
        <div className="page-enter">{children}</div>
      </main>

      <footer className="mt-6 border-t border-line bg-white/60">
        <div className="container-page flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-[11px] text-muted">Barcelona · prototype</span>
          </div>
          <Disclaimer className="max-w-md sm:text-right" />
        </div>
      </footer>
    </div>
  );
}
