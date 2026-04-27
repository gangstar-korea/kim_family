"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCheck, Home, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "가계도", icon: Home },
  { href: "/admin/approvals", label: "승인", icon: CheckCheck },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 z-40 w-[100dvw] max-w-[100dvw] overflow-hidden border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="하단 메뉴"
    >
      <div className="grid h-16 w-[100dvw] max-w-[100dvw] grid-cols-2 overflow-hidden">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon =
            item.icon === Home && pathname.startsWith("/family")
              ? UsersRound
              : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 items-center justify-center gap-2 overflow-hidden border-r border-border/60 px-3 text-sm font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring last:border-r-0",
                active && "bg-primary/10 text-primary",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate"> {item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
