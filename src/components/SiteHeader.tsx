import Link from "next/link";
import { Logo } from "@/components/brand";
import { getGuestSessionId, getHostSession } from "@/lib/auth";
import { getGuestAccount } from "@/lib/guest-account";

export async function SiteHeader() {
  const [account, guestSessionId, host] = await Promise.all([
    getGuestAccount(),
    getGuestSessionId(),
    getHostSession(),
  ]);
  const hasDemoStay = Boolean(guestSessionId);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-cream"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden h-7 w-px bg-line sm:block" />
          <nav aria-label="Public" className="hidden items-center gap-4 text-[12.5px] sm:flex">
            <Link href="/" className="text-muted transition hover:text-ink">
              Home
            </Link>
            <Link href="/hosts" className="font-medium text-ink">
              Hosts
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          {account || hasDemoStay ? (
            <>
              <Link href="/stay" className="hidden text-muted hover:text-ink sm:inline">
                My stay
              </Link>
              <Link
                href={account ? "/profile" : "/welcome"}
                className="font-medium text-ink hover:text-brand"
              >
                {account ? "My account" : "My demo stay"}
              </Link>
            </>
          ) : (
            <Link href="/guest/login" className="text-muted hover:text-ink">
              Guest sign in
            </Link>
          )}
          {host ? (
            <Link href="/host" className="btn-primary btn-sm">
              Host dashboard
            </Link>
          ) : (
            <Link href="/host/login" className="btn-secondary btn-sm">
              For hosts
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
