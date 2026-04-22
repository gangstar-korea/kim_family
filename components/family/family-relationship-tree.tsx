"use client";

import { useState } from "react";
import { CalendarDays, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { FamilyTree, FamilyUnitMember } from "@/lib/family/tree-adapter";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEXT = {
  noTree: "\uD45C\uC2DC\uD560 \uAC00\uC871 \uACC4\uCE35\uB3C4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  deceased: "\uACE0\uC778",
  spouseSeparator: "\uBC30\uC6B0\uC790",
  detailTitle: "\uAC00\uC871 \uC0C1\uC138",
  close: "\uB2EB\uAE30",
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
  noValue: "-",
};

type FamilyRelationshipTreeProps = {
  tree: FamilyTree;
};

export function FamilyRelationshipTree({ tree }: FamilyRelationshipTreeProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  if (tree.generations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {TEXT.noTree}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-full space-y-4">
          {tree.generations.map((generation, index) => (
            <section key={generation.generationDepth ?? "unknown"} className="relative">
              {index > 0 ? (
                <div className="mx-auto mb-3 h-5 w-px bg-border" aria-hidden />
              ) : null}

              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-bold">{generation.label}</h3>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {generation.units.map((unit) => {
                  const members: FamilyUnitMember[] = [
                    { person: unit.primary, role: "primary" },
                    ...unit.spouses.map((spouse) => ({
                      person: spouse,
                      role: "spouse" as const,
                    })),
                  ];

                  return (
                    <div
                      key={unit.id}
                      className="shrink-0 rounded-lg border border-border bg-background p-2 shadow-sm"
                    >
                      <div className="flex items-stretch gap-1.5">
                        {members.map((member, memberIndex) => (
                          <div key={member.person.id} className="flex items-center gap-1.5">
                            {memberIndex > 0 ? (
                              <span
                                className="text-[10px] font-semibold text-muted-foreground"
                                aria-label={TEXT.spouseSeparator}
                              >
                                +
                              </span>
                            ) : null}
                            <TreePersonButton
                              member={member}
                              onSelect={setSelectedPerson}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <PersonDetailPanel
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </>
  );
}

function TreePersonButton({
  member,
  onSelect,
}: {
  member: FamilyUnitMember;
  onSelect: (person: Person) => void;
}) {
  const { person, role } = member;

  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      className={cn(
        "flex min-h-14 w-24 flex-col items-center justify-center rounded-md border px-2 py-2 text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        role === "primary" ? "border-primary/30 bg-primary/5" : "border-border bg-card",
        !person.is_alive && "bg-muted/70 text-muted-foreground",
      )}
    >
      <span className="line-clamp-2 break-keep font-bold leading-4">
        {person.full_name}
      </span>
      {!person.is_alive ? (
        <span className="mt-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {TEXT.deceased}
        </span>
      ) : null}
    </button>
  );
}

function PersonDetailPanel({
  person,
  onClose,
}: {
  person: Person | null;
  onClose: () => void;
}) {
  if (!person) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-3 pb-3 pt-12 sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={TEXT.close}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-person-detail-title"
        className="relative max-h-[82vh] w-full overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg sm:max-w-md"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{TEXT.detailTitle}</p>
            <h3 id="family-person-detail-title" className="mt-1 truncate text-xl font-bold">
              {person.full_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
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
        </dl>
      </section>
    </div>
  );
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
