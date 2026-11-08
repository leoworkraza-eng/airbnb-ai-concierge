"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <div className="container-page flex h-16 items-center">
        <Logo />
      </div>
      <main className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
          <AlertTriangle className="size-5" />
        </span>
        <h1 className="mt-4 text-[26px] font-semibold">
          Something interrupted that page.
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
          Nothing was lost. Try the page again, or continue from a known place.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCcw className="size-4" /> Try again
          </button>
          <Link href="/welcome" className="btn-secondary">
            Guest area
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </main>
      <div className="container-page border-t border-line py-5">
        <p className="text-[11px] leading-relaxed text-muted/90">
          Airbnb Concierge is an independent educational prototype. It is not
          affiliated with, endorsed by, or connected to Airbnb.
        </p>
      </div>
    </div>
  );
}
