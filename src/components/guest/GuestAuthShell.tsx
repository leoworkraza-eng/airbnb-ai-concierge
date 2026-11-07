import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";
import { cn } from "@/lib/utils";

export function GuestAuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  backHref,
  backLabel,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  backHref: string;
  backLabel: string;
  className?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,#E22B4F_0%,rgba(226,43,79,0)_68%)] opacity-30"
        />
        <Logo tone="light" />
        <div className="relative max-w-sm">
          <p className="eyebrow text-white/40">Concierge</p>
          <h2 className="mt-4 font-display text-[38px] leading-[1.06] text-white">
            Find a host. Ask to connect. Keep it simple.
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-white/55">
            A guest account lets you browse local hosts and track the connection
            you request. Your stay is optional.
          </p>
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/6 px-4 py-3">
            <ShieldCheck className="size-4 shrink-0 text-brand" />
            <p className="text-[11.5px] leading-relaxed text-white/60">
              Guest accounts and host accounts are kept separate.
            </p>
          </div>
        </div>
        <p className="relative text-[10.5px] text-white/30">
          Independent educational prototype · not affiliated with Airbnb
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-9 sm:px-10">
        <div className={cn("mx-auto w-full max-w-md", className)}>
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href={backHref}
            className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> {backLabel}
          </Link>
          <p className="eyebrow mt-6">{eyebrow}</p>
          <h1 className="mt-2 text-[29px] leading-tight font-semibold">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-5 text-[12px] text-muted">{footer}</div> : null}
          <div className="mt-8 border-t border-line pt-5">
            <Disclaimer />
          </div>
        </div>
      </main>
    </div>
  );
}
