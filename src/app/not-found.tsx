import Link from "next/link";
import { Logo } from "@/components/brand";
import { Disclaimer } from "@/components/guest/GuestShell";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container-page flex h-16 items-center">
        <Logo />
      </div>
      <main className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="font-display text-[64px] leading-none text-brand">404</p>
        <h1 className="mt-4 text-[26px] font-semibold">This page isn&rsquo;t here.</h1>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
          The page you were looking for doesn&rsquo;t exist. Start from the home page or
          the host directory.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/hosts" className="btn-primary">
            Browse hosts
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </main>
      <div className="container-page border-t border-line py-5">
        <Disclaimer />
      </div>
    </div>
  );
}
