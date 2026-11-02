import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";
import { HostNav } from "./HostNav";
import type { HostSession } from "@/lib/types";

export function HostShell({
  session,
  unread,
  propertyLabel,
  children,
}: {
  session: HostSession;
  unread: number;
  propertyLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white/70">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-sand px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-ink-soft uppercase sm:inline">
              Host
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-medium text-ink">{session.fullName}</p>
              <p className="text-[11px] text-muted">
                {propertyLabel} · {session.mode === "supabase" ? "Supabase" : "local demo"}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-ink text-[12px] font-semibold text-cream">
              {session.fullName.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:py-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="surface p-2">
            <HostNav unread={unread} />
          </div>
          <div className="mt-4 hidden px-1 lg:block">
            <Link
              href="/stay"
              className="text-[12px] text-muted transition hover:text-ink"
            >
              View guest experience →
            </Link>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <footer className="border-t border-line bg-white/60">
        <div className="container-page py-6">
          <Disclaimer className="max-w-2xl" />
        </div>
      </footer>
    </div>
  );
}
