import Link from "next/link";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Brand: an original mark (a lit doorway with a handle) and a warm concierge
   avatar. The name references Airbnb as a reference point for this academic
   prototype; the mark itself is drawn for this project.
   --------------------------------------------------------------------------- */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-5", className)} aria-hidden="true">
      <path
        d="M9 26V15.2a7 7 0 0 1 14 0V26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <circle cx="19.6" cy="19.6" r="1.9" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  href = "/",
  tone = "dark",
  className,
}: {
  href?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Airbnb Concierge — home"
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-[11px] transition group-hover:bg-brand",
          tone === "dark" ? "bg-ink text-cream" : "bg-white/15 text-white",
        )}
      >
        <LogoMark className="size-[19px] text-brand group-hover:text-white" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-[9px] font-semibold uppercase tracking-[0.24em]",
            tone === "dark" ? "text-muted" : "text-white/60",
          )}
        >
          Airbnb
        </span>
        <span
          className={cn(
            "mt-1 block font-display text-[19px] leading-none tracking-tight",
            tone === "dark" ? "text-ink" : "text-white",
          )}
        >
          Concierge
        </span>
      </span>
    </Link>
  );
}

export function ConciergeAvatar({
  size = "md",
  state = "idle",
  className,
}: {
  size?: "sm" | "md" | "lg";
  state?: "idle" | "thinking";
  className?: string;
}) {
  const dimensions = {
    sm: "size-8",
    md: "size-10",
    lg: "size-14",
  }[size];

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full bg-sand ring-1 ring-line/80",
        dimensions,
        state === "thinking" && "pulse-ring",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="size-[78%]">
        <circle cx="24" cy="24" r="23" fill="#F2E4D3" />
        <path
          d="M24 5.5c8.6 0 14.4 5.9 14.4 14.2 0 8.6-6.2 14.9-14.4 22.2C15.8 34.6 9.6 28.3 9.6 19.7 9.6 11.4 15.4 5.5 24 5.5Z"
          fill="#FBF3E8"
          opacity="0.75"
        />
        <circle cx="24" cy="19.4" r="7.1" fill="#F3DFC9" />
        <circle cx="21.2" cy="18.7" r="1.35" fill="#191310" />
        <circle cx="26.8" cy="18.7" r="1.35" fill="#191310" />
        <path
          d="M21.1 22.4c.9 1.1 1.9 1.6 2.9 1.6s2-.5 2.9-1.6"
          fill="none"
          stroke="#191310"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M16.4 33.2c2.1-3.3 4.6-4.9 7.6-4.9s5.5 1.6 7.6 4.9" fill="#191310" />
        <path
          d="M24 35.4 20 33c1.4-1 2.8-1.5 4-1.5s2.6.5 4 1.5l-4 2.4Z"
          fill="#E22B4F"
        />
        <circle cx="24" cy="33.4" r="1.5" fill="#FBF3E8" />
      </svg>
      {state === "thinking" ? (
        <span className="absolute inset-0 rounded-full ring-1 ring-brand/30" />
      ) : null}
    </span>
  );
}

export function PulsingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="typing-dot size-1.5 rounded-full bg-muted"
          style={{ animationDelay: `${index * 0.16}s` }}
        />
      ))}
    </span>
  );
}
