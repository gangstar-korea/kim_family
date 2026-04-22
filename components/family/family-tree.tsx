import Link from "next/link";
import { CalendarDays, Heart, MapPin, UsersRound } from "lucide-react";

import type {
  FamilyGenerationGroup,
  FamilyGenerationPerson,
  FamilyTree,
} from "@/lib/family/tree-adapter";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

type FamilyTreeProps = {
  tree: FamilyTree;
};

export function FamilyTreeView({ tree }: FamilyTreeProps) {
  if (tree.generations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        표시할 가족 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {tree.generations.map((generation) => (
        <GenerationSection
          key={generation.generationDepth ?? "unknown"}
          generation={generation}
        />
      ))}
    </div>
  );
}

function GenerationSection({ generation }: { generation: FamilyGenerationGroup }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{generation.label}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {generation.persons.length}명
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          generation_depth: {generation.generationDepth ?? "-"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {generation.persons.map((item) => (
          <GenerationPersonCard key={item.person.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function GenerationPersonCard({ item }: { item: FamilyGenerationPerson }) {
  const { person } = item;

  return (
    <Link
      href={`/family/${person.id}`}
      className={cn(
        "block rounded-md border border-border bg-background p-3 transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !person.is_alive && "bg-muted/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{person.full_name}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {person.branch_code} · {person.family_role_type === "blood" ? "혈족" : "배우자"}
          </p>
        </div>
        {!person.is_alive ? (
          <span className="shrink-0 rounded-full border border-border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
            고인
          </span>
        ) : null}
      </div>

      <RelationshipSummary item={item} />
      <PersonMeta person={person} />
    </Link>
  );
}

function RelationshipSummary({ item }: { item: FamilyGenerationPerson }) {
  const summaries = [
    item.spouseNames.length > 0 ? `배우자 ${item.spouseNames.join(", ")}` : null,
    item.parentNames.length > 0 ? `부모 ${item.parentNames.join(", ")}` : null,
    item.childCount > 0 ? `자녀 ${item.childCount}명` : null,
  ].filter((summary): summary is string => Boolean(summary));

  if (summaries.length === 0) {
    return (
      <p className="mt-3 rounded-md bg-muted/50 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        등록된 관계 요약이 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-1.5">
      {summaries.map((summary) => (
        <p
          key={summary}
          className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-xs leading-5 text-muted-foreground"
        >
          {summary.startsWith("배우자") ? (
            <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <UsersRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 truncate">{summary}</span>
        </p>
      ))}
    </div>
  );
}

function PersonMeta({ person }: { person: Person }) {
  return (
    <dl className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">
      {person.birth_date ? (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">생년월일</dt>
          <dd>{person.birth_date}</dd>
        </div>
      ) : null}
      {!person.is_alive && person.deceased_date ? (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">별세일</dt>
          <dd>별세 {person.deceased_date}</dd>
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
  );
}
