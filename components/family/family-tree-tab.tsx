import type { FamilyGraphData } from "@/lib/types";

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
        <h3 className="text-lg font-bold">가족 관계 중심 계층도</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          부모-자녀와 배우자 관계를 시각적으로 연결하는 계층도는 다음 단계에서 구현
          예정입니다. 현재 이 탭에서는 잘못된 트리 렌더링을 사용하지 않습니다.
        </p>
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
