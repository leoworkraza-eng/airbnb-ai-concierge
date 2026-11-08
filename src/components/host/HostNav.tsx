"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/host", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/host/affiliations", label: "Affiliations", icon: UserPlus },
  { href: "/host/properties", label: "Offering", icon: Building2 },
  { href: "/host/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/host/guests", label: "Guest chats", icon: MessageSquare },
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
          <NavLink
            key={item.href}
            href={item.href}
            current={active}
            className={cn(
              "relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition",
              active
                ? "bg-ink text-cream"
                : "text-ink-soft hover:bg-sand hover:text-ink",
            )}
          >
            <item.icon className="size-4" strokeWidth={1.7} />
            <span className="whitespace-nowrap">{item.label}</span>
            {item.href === "/host/guests" && unread > 0 ? (
              <span
                className={cn(
                  "ml-auto grid size-5 place-items-center rounded-full text-[10px] font-semibold",
                  active ? "bg-white/20 text-white" : "bg-brand text-white",
                )}
              >
                {unread}
              </span>
            ) : null}
          </NavLink>
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
