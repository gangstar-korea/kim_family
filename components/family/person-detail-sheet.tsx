"use client";

import { X } from "lucide-react";

import type { Person, PersonRelations } from "@/lib/types";

const TEXT = {
  close: "\uB2EB\uAE30",
  title: "\uAC00\uC871 \uC0C1\uC138",
  noValue: "-",
  name: "\uC774\uB984",
  birthDate: "\uC0DD\uB144\uC6D4\uC77C",
  deceasedDate: "\uBCC4\uC138\uC77C",
  phone: "\uC5F0\uB77D\uCC98",
  address: "\uC8FC\uC18C",
  memo: "\uBA54\uBAA8",
  bornSuffix: "\uCD9C\uC0DD",
  deceasedSuffix: "\uBCC4\uC138",
};

export type PersonDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  relations?: PersonRelations | null;
};

export function PersonDetailSheet({
  open,
  onOpenChange,
  person,
  relations: _relations,
}: PersonDetailSheetProps) {
  if (!open || !person) {
    return null;
  }

  const summaryText = buildSummaryText(person);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-3 pb-3 pt-12 sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={TEXT.close}
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-detail-title"
        className="relative max-h-[82vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card px-4 pb-5 pt-4 shadow-lg sm:max-w-md sm:rounded-2xl sm:px-5"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {TEXT.title}
            </p>
            <h3 id="person-detail-title" className="mt-1 truncate text-2xl font-bold">
              {person.full_name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{summaryText}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">{TEXT.close}</span>
          </button>
        </div>

        <div className="space-y-5">
          <section className="space-y-3">
            <DetailListItem label={TEXT.birthDate} value={person.birth_date} />
            {!person.is_alive ? (
              <DetailListItem label={TEXT.deceasedDate} value={person.deceased_date} />
            ) : null}
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <DetailListItem label={TEXT.phone} value={person.phone} />
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <DetailListItem label={TEXT.address} value={person.address} />
          </section>

          <section className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground">{TEXT.memo}</p>
            <div className="mt-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {person.memo || TEXT.noValue}
              </p>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function buildSummaryText(person: Person) {
  const birthText = person.birth_date
    ? `${person.birth_date} ${TEXT.bornSuffix}`
    : TEXT.noValue;

  if (!person.is_alive && person.deceased_date) {
    return `${birthText} · ${person.deceased_date} ${TEXT.deceasedSuffix}`;
  }

  return birthText;
}

function DetailListItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium leading-6 text-foreground">
        {value || TEXT.noValue}
      </p>
    </div>
  );
}
