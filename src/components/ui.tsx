import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={cn("surface surface-shadow", className)}>{children}</Tag>
  );
}

export function Pill({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "brand" | "gold" | "success" | "warning";
}) {
  const tones = {
    neutral: "bg-white text-ink-soft ring-line",
    brand: "bg-brand-soft text-brand-dark ring-brand/15",
    gold: "bg-[#F6EEE2] text-[#7A5A33] ring-[#E7D6BE]",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        tones,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="text-[26px] leading-[1.15] font-semibold sm:text-[32px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}

export function Note({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: "neutral" | "warning" | "danger" | "success";
  className?: string;
  icon?: ReactNode;
}) {
  const tones = {
    neutral: "border-line bg-sand/50 text-ink-soft",
    warning: "border-amber-200 bg-amber-50/70 text-amber-900",
    danger: "border-red-200 bg-red-50/70 text-red-900",
    success: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  }[tone];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3.5 text-[13px] leading-relaxed",
        tones,
        className,
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      {icon ? (
        <span className="mb-3 grid size-10 place-items-center rounded-full bg-sand text-ink-soft">
          {icon}
        </span>
      ) : null}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="surface surface-shadow px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-muted">{label}</p>
        {icon ? (
          <span
            className={cn(
              "grid size-7 place-items-center rounded-lg",
              accent ? "bg-brand-soft text-brand" : "bg-sand text-ink-soft",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
