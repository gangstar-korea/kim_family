import Link from "next/link";
import { CalendarDays, MapPin, UsersRound } from "lucide-react";

import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

type FamilyListTabProps = {
  persons: Person[];
};

export function FamilyListTab({ persons }: FamilyListTabProps) {
  const sortedPersons = [...persons].sort((a, b) => {
    const depthA = a.generation_depth ?? 999;
    const depthB = b.generation_depth ?? 999;

    if (depthA !== depthB) {
      return depthA - depthB;
    }

    const orderA = a.birth_order ?? 999;
    const orderB = b.birth_order ?? 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const birthDateCompare = (a.birth_date ?? "").localeCompare(b.birth_date ?? "");

    if (birthDateCompare !== 0) {
      return birthDateCompare;
    }

    return a.full_name.localeCompare(b.full_name);
  });

  if (sortedPersons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        표시할 가족 목록이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {sortedPersons.map((person) => (
        <PersonListItem key={person.id} person={person} />
      ))}
    </div>
  );
}

function PersonListItem({ person }: { person: Person }) {
  return (
    <Link
      href={`/family/${person.id}`}
      className={cn(
        "block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !person.is_alive && "bg-muted/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{person.full_name}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {person.generation_depth ?? "-"}세대 · {person.branch_code} ·{" "}
            {person.family_role_type === "blood" ? "혈족" : "배우자"}
          </p>
        </div>
        {!person.is_alive ? (
          <span className="shrink-0 rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
            고인
          </span>
        ) : null}
      </div>

      <dl className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <UsersRound className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">내부 코드</dt>
          <dd className="min-w-0 break-all">{person.internal_code}</dd>
        </div>
        {person.birth_date ? (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <dt className="sr-only">생년월일</dt>
            <dd>{person.birth_date}</dd>
          </div>
        ) : null}
        {person.address ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            <dt className="sr-only">주소</dt>
            <dd className="min-w-0 truncate">{person.address}</dd>
          </div>
        ) : null}
      </dl>
    </Link>
  );
}
