import Link from "next/link";
import { CalendarDays, Heart, MapPin } from "lucide-react";

import type { FamilyTree, FamilyTreeNode } from "@/lib/family/tree-adapter";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

type FamilyTreeProps = {
  tree: FamilyTree;
};

export function FamilyTreeView({ tree }: FamilyTreeProps) {
  if (tree.roots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        표시할 가족 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      {tree.roots.map((root) => (
        <FamilyBranch key={root.person.id} node={root} depth={0} />
      ))}
    </div>
  );
}

function FamilyBranch({ node, depth }: { node: FamilyTreeNode; depth: number }) {
  return (
    <section className="relative w-full">
      <div className="flex flex-col items-center">
        <CoupleCard node={node} depth={depth} />

        {node.children.length > 0 ? (
          <>
            <div className="h-6 w-px bg-border" aria-hidden />
            <div className="mb-3 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground shadow-sm">
              자녀 {node.children.length}명
            </div>
            <div
              className={cn(
                "grid w-full gap-4",
                depth === 0 ? "md:grid-cols-2" : "md:grid-cols-1",
                "xl:grid-cols-3",
              )}
            >
              {node.children.map((child) => (
                <div
                  key={child.person.id}
                  className="relative rounded-lg border border-border/60 bg-background/45 p-2 md:p-3"
                >
                  <div
                    className="absolute left-1/2 top-0 h-4 w-px -translate-y-4 bg-border md:hidden"
                    aria-hidden
                  />
                  <FamilyBranch node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function CoupleCard({ node, depth }: { node: FamilyTreeNode; depth: number }) {
  return (
    <article
      className={cn(
        "w-full rounded-lg border border-border bg-card p-4 shadow-sm",
        depth === 0 ? "max-w-2xl" : "max-w-xl",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {node.person.generation_depth ?? depth + 1}세대
        </span>
        <span className="text-xs font-semibold text-primary">{node.person.branch_code}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch">
        <PersonCard person={node.person} primary />

        {node.spouse ? (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground sm:flex-col">
            <span className="h-px w-10 bg-border sm:h-10 sm:w-px" aria-hidden />
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              배우자
            </span>
            <span className="h-px w-10 bg-border sm:h-10 sm:w-px" aria-hidden />
          </div>
        ) : null}

        {node.spouse ? <PersonCard person={node.spouse} /> : null}
      </div>
    </article>
  );
}

function PersonCard({ person, primary = false }: { person: Person; primary?: boolean }) {
  return (
    <Link
      href={`/family/${person.id}`}
      className={cn(
        "block min-w-0 rounded-md border p-3 transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        primary ? "border-primary/30 bg-primary/5" : "border-border bg-background",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{person.full_name}</p>
          <p className="mt-1 break-all text-xs font-medium text-muted-foreground">
            {person.family_role_type === "blood" ? "혈족" : "배우자"} · {person.internal_code}
          </p>
        </div>
        {!person.is_alive ? (
          <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            고인
          </span>
        ) : null}
      </div>

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
    </Link>
  );
}
