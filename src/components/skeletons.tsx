export function GuestPageSkeleton() {
  return (
    <div className="container-page space-y-5 py-8" aria-busy="true" aria-live="polite">
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
