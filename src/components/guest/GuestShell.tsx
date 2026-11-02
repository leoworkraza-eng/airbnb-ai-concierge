import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-muted/90", className)}>
      Airbnb Concierge is an independent educational prototype. It is not
      affiliated with, endorsed by, or connected to Airbnb. Property, guest and
      venue details are fictional demonstration data.
    </p>
  );
}

export function GuestShell({
  propertyName,
  active,
  guestName,
  children,
}: {
  propertyName: string;
  active: "stay" | "concierge" | "explore" | "support";
  guestName: string;
  children: ReactNode;
}) {
  const tabs = [
    { id: "stay", label: "My stay", href: "/stay" },
    { id: "concierge", label: "Concierge", href: "/concierge" },
    { id: "explore", label: "Explore Barcelona", href: "/explore" },
    { id: "support", label: "Support", href: "/support" },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur-md">
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
        <nav aria-label="Guest sections" className="border-t border-line/70">
          <div className="container-page no-scrollbar flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active === tab.id ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                  active === tab.id
                    ? "bg-ink text-cream"
                    : "text-ink-soft hover:bg-sand",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="container-page flex-1 py-6 sm:py-9">{children}</main>

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
