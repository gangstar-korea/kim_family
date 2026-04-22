import Link from "next/link";
import { CalendarDays, Heart, MapPin, UsersRound } from "lucide-react";

import type {
  FamilyGenerationGroup,
  FamilyUnit,
  FamilyUnitMember,
  FamilyTree,
} from "@/lib/family/tree-adapter";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEXT = {
  noFamilyList: "\uD45C\uC2DC\uD560 \uAC00\uC871 \uBAA9\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  household: "\uAC00\uAD6C",
  personCount: "\uBA85",
  coupleUnitList: "\uBD80\uBD80 \uB2E8\uC704 \uBAA9\uB85D",
  blood: "\uD608\uC871",
  spouse: "\uBC30\uC6B0\uC790",
  deceased: "\uACE0\uC778",
  spousePrefix: "\uBC30\uC6B0\uC790",
  parentPrefix: "\uBD80\uBAA8",
  childPrefix: "\uC790\uB140",
  morePrefix: "\uC678",
  noRelationSummary:
    "\uB4F1\uB85D\uB41C \uAD00\uACC4 \uC694\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  birthDate: "\uC0DD\uB144\uC6D4\uC77C",
  deceasedDate: "\uBCC4\uC138\uC77C",
  deceasedDatePrefix: "\uBCC4\uC138",
  address: "\uC8FC\uC18C",
};

type FamilyTreeProps = {
  tree: FamilyTree;
};

export function FamilyGenerationListView({ tree }: FamilyTreeProps) {
  if (tree.generations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {TEXT.noFamilyList}
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
  const memberCount = generation.units.reduce(
    (total, unit) => total + 1 + unit.spouses.length,
    0,
  );

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{generation.label}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {generation.units.length}
            {TEXT.household} / {memberCount}
            {TEXT.personCount}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {TEXT.coupleUnitList}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {generation.units.map((unit) => (
          <FamilyUnitCard key={unit.id} unit={unit} />
        ))}
      </div>
    </section>
  );
}

function FamilyUnitCard({ unit }: { unit: FamilyUnit }) {
  const members: FamilyUnitMember[] = [
    { person: unit.primary, role: "primary" },
    ...unit.spouses.map((spouse) => ({
      person: spouse,
      role: "spouse" as const,
    })),
  ];

  return (
    <article className="rounded-md border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {unit.primary.full_name} {TEXT.household}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
          {members.length}
          {TEXT.personCount}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {members.map((member) => (
          <PersonCard key={`${unit.id}-${member.person.id}`} member={member} />
        ))}
      </div>

      <RelationshipSummary unit={unit} />
    </article>
  );
}

function PersonCard({ member }: { member: FamilyUnitMember }) {
  const { person, role } = member;

  return (
    <Link
      href={`/family/${person.id}`}
      className={cn(
        "block min-w-0 rounded-md border p-3 transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        role === "primary" ? "border-primary/30 bg-primary/5" : "border-border bg-card",
        !person.is_alive && "bg-muted/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{person.full_name}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {person.branch_code} / {person.family_role_type === "blood" ? TEXT.blood : TEXT.spouse}
          </p>
        </div>
        {!person.is_alive ? (
          <span className="shrink-0 rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
            {TEXT.deceased}
          </span>
        ) : null}
      </div>

      <PersonMeta person={person} />
    </Link>
  );
}

function RelationshipSummary({ unit }: { unit: FamilyUnit }) {
  const spouseSummary =
    unit.spouses.length > 0
      ? `${TEXT.spousePrefix} ${formatNameList(unit.spouses.map((spouse) => spouse.full_name))}`
      : null;
  const parentSummary =
    unit.parentNames.length > 0
      ? `${TEXT.parentPrefix} ${formatNameList(unit.parentNames)}`
      : null;
  const childSummary =
    unit.childNames.length > 0
      ? `${TEXT.childPrefix} ${formatNameList(unit.childNames)}`
      : null;
  const summaries = [
    spouseSummary,
    parentSummary,
    childSummary,
  ].filter((summary): summary is string => Boolean(summary));

  if (summaries.length === 0) {
    return (
      <p className="mt-3 rounded-md bg-muted/50 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        {TEXT.noRelationSummary}
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
          {summary.startsWith(TEXT.spousePrefix) ? (
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

function formatNameList(names: string[], visibleCount = 2) {
  const uniqueNames = [...new Set(names)].filter(Boolean);
  const visibleNames = uniqueNames.slice(0, visibleCount).join(", ");
  const hiddenCount = uniqueNames.length - visibleCount;

  if (hiddenCount <= 0) {
    return visibleNames;
  }

  return `${visibleNames} ${TEXT.morePrefix} ${hiddenCount}${TEXT.personCount}`;
}

function PersonMeta({ person }: { person: Person }) {
  return (
    <dl className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">
      {person.birth_date ? (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">{TEXT.birthDate}</dt>
          <dd>{person.birth_date}</dd>
        </div>
      ) : null}
      {!person.is_alive && person.deceased_date ? (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">{TEXT.deceasedDate}</dt>
          <dd>
            {TEXT.deceasedDatePrefix} {person.deceased_date}
          </dd>
        </div>
      ) : null}
      {person.address ? (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">{TEXT.address}</dt>
          <dd className="min-w-0 truncate">{person.address}</dd>
        </div>
      ) : null}
    </dl>
  );
}
