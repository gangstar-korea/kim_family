"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type PersonSheetShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
};

export function PersonSheetShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: PersonSheetShellProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/45 pt-10 sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl sm:px-5 sm:pb-5"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">닫기</span>
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
