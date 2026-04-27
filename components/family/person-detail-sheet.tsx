"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { PersonAddChildSheet } from "@/components/family/person-add-child-sheet";
import { PersonAddSpouseSheet } from "@/components/family/person-add-spouse-sheet";
import { PersonEditSheet } from "@/components/family/person-edit-sheet";
import { Button } from "@/components/ui/button";
import { formatKoreanMobilePhone } from "@/lib/auth/normalize-phone";
import type { PersonActionPermissions } from "@/lib/family/permissions";
import type { Person, PersonRelations, UserProfile } from "@/lib/types";

const TEXT = {
  close: "닫기",
  title: "가족 상세",
  noValue: "-",
  birthDate: "생년월일",
  deceasedDate: "별세일",
  phone: "연락처",
  address: "주소",
  memo: "메모",
  bornSuffix: "출생",
  deceasedSuffix: "별세",
  solar: "양력",
  lunar: "음력",
  leapMonth: "윤달",
  edit: "수정",
  addChild: "자녀 추가",
  addSpouse: "배우자 추가",
  spouseExists: "이미 배우자 관계가 등록된 가구입니다.",
};

export type PersonDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  relations?: PersonRelations | null;
  currentUserProfile?: UserProfile | null;
  permissions?: PersonActionPermissions | null;
};

export function PersonDetailSheet({
  open,
  onOpenChange,
  person,
  relations,
  currentUserProfile,
  permissions,
}: PersonDetailSheetProps) {
  const [activeSheet, setActiveSheet] = useState<"edit" | "child" | "spouse" | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setActiveSheet(null);
    }
  }, [open, person?.id]);

  if (!open || !person) {
    return null;
  }

  const summaryText = buildSummaryText(person);
  const spouseExists = Boolean(relations && relations.spouses.length > 0);
  const birthDateDisplay = formatBirthDateDisplay(person);
  const phoneDisplay = person.phone ? formatKoreanMobilePhone(person.phone) : null;
  const actionPermissions = permissions ?? {
    canEdit: false,
    canAddChild: false,
    canAddSpouse: false,
  };

  function handleMutationSuccess() {
    setActiveSheet(null);
    onOpenChange(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end bg-black/40 pt-10 sm:items-center sm:justify-center sm:p-6">
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
          className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-lg sm:max-h-[82vh] sm:max-w-md sm:rounded-2xl sm:px-5 sm:pb-5"
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
              <DetailListItem label={TEXT.birthDate} value={birthDateDisplay} />
              {!person.is_alive ? (
                <DetailListItem label={TEXT.deceasedDate} value={person.deceased_date} />
              ) : null}
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <DetailListItem label={TEXT.phone} value={phoneDisplay} />
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

            <section className="border-t border-border pt-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {actionPermissions.canEdit ? (
                  <Button type="button" variant="outline" onClick={() => setActiveSheet("edit")}>
                    {TEXT.edit}
                  </Button>
                ) : null}
                {actionPermissions.canAddChild ? (
                  <Button type="button" variant="outline" onClick={() => setActiveSheet("child")}>
                    {TEXT.addChild}
                  </Button>
                ) : null}
                {actionPermissions.canAddSpouse ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveSheet("spouse")}
                    disabled={spouseExists}
                  >
                    {TEXT.addSpouse}
                  </Button>
                ) : null}
              </div>
              {actionPermissions.canAddSpouse && spouseExists ? (
                <p className="mt-2 text-xs text-muted-foreground">{TEXT.spouseExists}</p>
              ) : null}
            </section>
          </div>
        </section>
      </div>

      <PersonEditSheet
        open={activeSheet === "edit"}
        onOpenChange={(nextOpen) => setActiveSheet(nextOpen ? "edit" : null)}
        person={person}
        currentUserProfile={currentUserProfile ?? null}
        onSuccess={handleMutationSuccess}
      />
      <PersonAddChildSheet
        open={activeSheet === "child"}
        onOpenChange={(nextOpen) => setActiveSheet(nextOpen ? "child" : null)}
        parentPerson={person}
        currentUserProfile={currentUserProfile ?? null}
        onSuccess={handleMutationSuccess}
      />
      <PersonAddSpouseSheet
        open={activeSheet === "spouse"}
        onOpenChange={(nextOpen) => setActiveSheet(nextOpen ? "spouse" : null)}
        targetPerson={person}
        spouseExists={spouseExists}
        currentUserProfile={currentUserProfile ?? null}
        onSuccess={handleMutationSuccess}
      />
    </>
  );
}

function buildSummaryText(person: Person) {
  const birthDateDisplay = formatBirthDateDisplay(person);
  const birthText =
    birthDateDisplay === TEXT.noValue
      ? TEXT.noValue
      : `${birthDateDisplay} ${TEXT.bornSuffix}`;

  if (!person.is_alive && person.deceased_date) {
    return `${birthText} · ${person.deceased_date} ${TEXT.deceasedSuffix}`;
  }

  return birthText;
}

function formatBirthDateDisplay(person: Person) {
  const birthDate =
    person.birth_calendar_type === "lunar"
      ? person.birth_date_lunar ?? person.birth_date
      : person.birth_date_solar ?? person.birth_date;

  if (!birthDate) {
    return TEXT.noValue;
  }

  if (person.birth_calendar_type === "lunar") {
    return person.is_lunar_leap_month
      ? `${birthDate} (${TEXT.lunar}, ${TEXT.leapMonth})`
      : `${birthDate} (${TEXT.lunar})`;
  }

  return `${birthDate} (${TEXT.solar})`;
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
