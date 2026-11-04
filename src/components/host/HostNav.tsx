"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquare,
  Settings,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/host", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/host/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/host/properties", label: "Properties", icon: Building2 },
  { href: "/host/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/host/guests", label: "Guest interactions", icon: MessageSquare },
  { href: "/host/integrations", label: "Airbnb connection", icon: Link2 },
  { href: "/host/settings", label: "AI settings", icon: Settings },
];

export function HostNav({ unread }: { unread: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Host sections" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition",
              active
                ? "bg-ink text-cream"
                : "text-ink-soft hover:bg-sand hover:text-ink",
            )}
          >
            <item.icon className="size-4" strokeWidth={1.7} />
            <span className="whitespace-nowrap">{item.label}</span>
            {item.href === "/host/maintenance" && unread > 0 ? (
              <span
                className={cn(
                  "ml-auto grid size-5 place-items-center rounded-full text-[10px] font-semibold",
                  active ? "bg-white/20 text-white" : "bg-brand text-white",
                )}
              >
                {unread}
              </span>
            ) : null}
          </Link>
        );
      })}
      <form action="/api/host/logout" method="post" className="mt-1 lg:mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-muted transition hover:bg-sand hover:text-ink"
        >
          <LogOut className="size-4" strokeWidth={1.7} />
          Sign out
        </button>
      </form>
    </nav>
  );
}
