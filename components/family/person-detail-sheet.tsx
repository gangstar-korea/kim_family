"use client";

import { CalendarDays, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Person, PersonRelations } from "@/lib/types";

const TEXT = {
  close: "\uB2EB\uAE30",
  title: "\uAC00\uC871 \uC0C1\uC138",
  noValue: "-",
  name: "\uC774\uB984",
  hanjaName: "\uD55C\uC790\uBA85",
  role: "\uAD6C\uBD84",
  blood: "\uD608\uC871",
  spouse: "\uBC30\uC6B0\uC790",
  branch: "\uBD84\uD30C",
  generation: "\uC138\uB300",
  birthOrder: "\uCD9C\uC0DD \uC21C\uC11C",
  birthDate: "\uC0DD\uB144\uC6D4\uC77C",
  deceasedDate: "\uBCC4\uC138\uC77C",
  phone: "\uC5F0\uB77D\uCC98",
  email: "\uC774\uBA54\uC77C",
  address: "\uC8FC\uC18C",
  region: "\uC9C0\uC5ED",
  memo: "\uBA54\uBAA8",
  spouses: "\uBC30\uC6B0\uC790",
  parents: "\uBD80\uBAA8",
  children: "\uC790\uB140",
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
  relations,
}: PersonDetailSheetProps) {
  if (!open || !person) {
    return null;
  }

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
        className="relative max-h-[82vh] w-full overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg sm:max-w-md"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{TEXT.title}</p>
            <h3 id="person-detail-title" className="mt-1 truncate text-xl font-bold">
              {person.full_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">{TEXT.close}</span>
          </button>
        </div>

        <dl className="space-y-2 text-sm">
          <DetailItem icon={UserRound} label={TEXT.name} value={person.full_name} />
          <DetailItem label={TEXT.hanjaName} value={person.hanja_name} />
          <DetailItem
            label={TEXT.role}
            value={person.family_role_type === "blood" ? TEXT.blood : TEXT.spouse}
          />
          <DetailItem label={TEXT.branch} value={person.branch_code} />
          <DetailItem
            label={TEXT.generation}
            value={
              typeof person.generation_depth === "number"
                ? `${person.generation_depth}${TEXT.generation}`
                : null
            }
          />
          <DetailItem
            label={TEXT.birthOrder}
            value={typeof person.birth_order === "number" ? String(person.birth_order) : null}
          />
          <DetailItem icon={CalendarDays} label={TEXT.birthDate} value={person.birth_date} />
          {!person.is_alive ? (
            <DetailItem
              icon={CalendarDays}
              label={TEXT.deceasedDate}
              value={person.deceased_date}
            />
          ) : null}
          <DetailItem icon={Phone} label={TEXT.phone} value={person.phone} />
          <DetailItem icon={Mail} label={TEXT.email} value={person.email} />
          <DetailItem icon={MapPin} label={TEXT.address} value={person.address} />
          <DetailItem label={TEXT.region} value={person.region} />
          <DetailItem label={TEXT.memo} value={person.memo} />
          <DetailItem
            label={TEXT.spouses}
            value={formatPeople(relations?.spouses ?? [])}
          />
          <DetailItem
            label={TEXT.parents}
            value={formatPeople(relations?.parents ?? [])}
          />
          <DetailItem
            label={TEXT.children}
            value={formatPeople(relations?.children ?? [])}
          />
        </dl>
      </section>
    </div>
  );
}

function formatPeople(people: Person[]) {
  if (people.length === 0) {
    return null;
  }

  return people.map((person) => person.full_name).join(", ");
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 rounded-md bg-muted/50 px-3 py-2">
      <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-foreground">{value || TEXT.noValue}</dd>
    </div>
  );
}
