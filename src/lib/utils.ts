import type { MaintenanceStatus, Priority } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeAgo(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(date);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T15:00:00`);
  const end = new Date(`${checkOut}T11:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Number.isFinite(nights) && nights > 0 ? nights : 1;
}

export function todayISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export const statusLabels: Record<MaintenanceStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const priorityLabels: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

export const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-50 text-red-700 ring-red-200",
  high: "bg-amber-50 text-amber-800 ring-amber-200",
  normal: "bg-sand text-ink-soft ring-line",
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const statusStyles: Record<MaintenanceStatus, string> = {
  new: "bg-brand-soft text-brand-dark ring-brand/20",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function isUrgent(gas: boolean | undefined, priority: Priority) {
  return gas === true || priority === "urgent";
}
