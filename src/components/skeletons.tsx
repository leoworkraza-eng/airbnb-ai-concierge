import { Logo } from "@/components/brand";

export function GuestPageSkeleton({
  embedded = false,
}: {
  embedded?: boolean;
} = {}) {
  return (
    <div
      className={embedded ? "space-y-5" : "container-page space-y-5 py-8"}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading your stay…</span>
      <div className="skeleton h-[220px] w-full rounded-[26px]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton h-[104px] w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <div className="skeleton h-[210px] w-full rounded-[22px]" />
          <div className="skeleton h-[160px] w-full rounded-[22px]" />
        </div>
        <div className="space-y-5">
          <div className="skeleton h-[190px] w-full rounded-[22px]" />
          <div className="skeleton h-[140px] w-full rounded-[22px]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state used while a guest route resolves. It mirrors the guest header,
 * primary tabs and trip-tools row, so moving between pages never flashes an
 * empty screen or makes the navigation jump.
 */
export function GuestShellSkeleton() {
  return (
    <div
      className="flex min-h-screen flex-col bg-cream"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading your guest workspace…</span>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="skeleton h-3 w-16" />
            <span className="skeleton h-8 w-24 rounded-full" />
          </div>
        </div>
        <nav aria-hidden="true" className="border-t border-line/60">
          <div className="container-page flex gap-1 overflow-hidden py-2">
            {[76, 66, 52, 88, 58].map((width, index) => (
              <span
                key={index}
                className="skeleton h-7 shrink-0 rounded-full"
                style={{ width }}
              />
            ))}
          </div>
        </nav>
        <div aria-hidden="true" className="border-t border-line/50 bg-white/35">
          <div className="container-page flex items-center gap-2 py-1.5">
            <span className="skeleton mr-1 h-2.5 w-14" />
            {[42, 56, 46, 50].map((width, index) => (
              <span
                key={index}
                className="skeleton h-5 shrink-0 rounded-full"
                style={{ width }}
              />
            ))}
          </div>
        </div>
      </header>
      <main className="container-page flex-1 py-6 sm:py-9">
        <GuestPageSkeleton embedded />
      </main>
    </div>
  );
}

export function HostPageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the host workspace…</span>
      <div className="skeleton h-8 w-56 rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-[92px] w-full rounded-[22px]" />
        ))}
      </div>
      <div className="skeleton h-[280px] w-full rounded-[22px]" />
      <div className="skeleton h-[200px] w-full rounded-[22px]" />
    </div>
  );
}

/**
 * Host equivalent of GuestShellSkeleton: a stable header and sidebar while the
 * next host page loads.
 */
export function HostShellSkeleton() {
  return (
    <div className="min-h-screen bg-cream" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the host workspace…</span>
      <header className="border-b border-line bg-white/70">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="skeleton h-5 w-12 rounded-full" />
          </div>
          <span className="skeleton size-9 rounded-full" />
        </div>
      </header>
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:py-8">
        <aside aria-hidden="true" className="lg:sticky lg:top-8 lg:self-start">
          <div className="surface space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className="skeleton block h-9 w-full rounded-xl"
              />
            ))}
          </div>
        </aside>
        <main className="min-w-0">
          <HostPageSkeleton />
        </main>
      </div>
    </div>
  );
}
