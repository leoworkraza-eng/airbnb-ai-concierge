import Link from "next/link";
import type { ReactNode } from "react";
import {
  Compass,
  ConciergeBell,
  House,
  KeyRound,
  LifeBuoy,
} from "lucide-react";
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

const tabs = [
  { id: "welcome", label: "Welcome", href: "/welcome", icon: House },
  { id: "stay", label: "My stay", href: "/stay", icon: KeyRound },
  { id: "concierge", label: "Concierge", href: "/concierge", icon: ConciergeBell },
  { id: "explore", label: "Explore", href: "/explore", icon: Compass },
  { id: "support", label: "Support", href: "/support", icon: LifeBuoy },
] as const;

export type GuestTab = (typeof tabs)[number]["id"];

export function GuestShell({
  propertyName,
  active,
  guestName,
  children,
}: {
  propertyName: string;
  active: GuestTab;
  guestName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="hidden h-8 w-px bg-line sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[13px] font-medium text-ink">{propertyName}</p>
              <p className="text-[11px] text-muted">Guest stay · {guestName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/api/guest/reset"
              className="hidden text-[12px] text-muted transition hover:text-ink sm:inline"
            >
              End guest demo
            </Link>
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
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "group relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300",
                    current
                      ? "bg-ink text-cream shadow-[0_10px_24px_-16px_rgba(25,19,16,0.9)]"
                      : "text-ink-soft hover:bg-sand/80",
                  )}
                >
                  <tab.icon
                    className={cn(
                      "size-3.5 transition-transform duration-300",
                      current ? "text-brand" : "text-muted group-hover:scale-110",
                    )}
                    strokeWidth={1.9}
                  />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="container-page flex-1 py-6 sm:py-9">
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
