import Link from "next/link";
import { CheckCheck, UsersRound } from "lucide-react";

import { SITE_NAME } from "@/lib/constants";

type AppHeaderProps = {
  title?: string;
};

const desktopLinks = [
  { href: "/", label: "가계도", icon: UsersRound },
  { href: "/admin/approvals", label: "승인", icon: CheckCheck },
];

export function AppHeader({ title = SITE_NAME }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="text-xs font-semibold text-muted-foreground">비공개 가족 공간</p>
          <h1 className="truncate text-base font-bold leading-tight text-foreground md:text-lg">
            {title}
          </h1>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
          {desktopLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
