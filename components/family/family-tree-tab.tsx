import type { FamilyGraphData } from "@/lib/types";

const TEXT = {
  title: "\uAC00\uC871 \uAD00\uACC4 \uC911\uC2EC \uACC4\uCE35\uB3C4",
  description:
    "\uBD80\uBAA8, \uC790\uB140, \uBC30\uC6B0\uC790 \uAD00\uACC4\uB97C \uC2DC\uAC01\uC801\uC73C\uB85C \uC5F0\uACB0\uD558\uB294 \uACC4\uCE35\uB3C4\uB294 \uB2E4\uC74C \uB2E8\uACC4\uC5D0\uC11C \uAD6C\uD604 \uC608\uC815\uC785\uB2C8\uB2E4. \uD604\uC7AC \uD0ED\uC5D0\uC11C\uB294 \uC798\uBABB\uB41C \uC7AC\uADC0\uD615 \uD2B8\uB9AC \uB80C\uB354\uB9C1\uC744 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
};

type FamilyTreeTabProps = {
  data: FamilyGraphData;
};

export function FamilyTreeTab({ data }: FamilyTreeTabProps) {
  const parentRelationCount = data.relationships.filter(
    (relationship) => relationship.relation_type === "parent",
  ).length;
  const childRelationCount = data.relationships.filter(
    (relationship) => relationship.relation_type === "child",
  ).length;
  const spouseRelationCount = data.relationships.filter(
    (relationship) => relationship.relation_type === "spouse",
  ).length;

  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">{TEXT.title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{TEXT.description}</p>
      </div>

      <dl className="mt-5 grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-semibold text-foreground">persons</dt>
          <dd>{data.persons.length}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">parent relations</dt>
          <dd>{parentRelationCount}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">child relations</dt>
          <dd>{childRelationCount}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">spouse relations</dt>
          <dd>{spouseRelationCount}</dd>
        </div>
      </dl>
    </section>
  );
}
