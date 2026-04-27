import type { ReactNode } from "react";

import { FamilyRelationshipTree } from "@/components/family/family-relationship-tree";
import { buildFamilyHierarchyTree } from "@/lib/family/tree-adapter";
import type { FamilyGraphData, UserProfile } from "@/lib/types";

const TEXT = {
  title: "가족 관계 중심 계층도",
  description:
    "최상위 가구에서 시작해 선택한 줄기를 오른쪽 컬럼으로 확장해 보는 탐색형 계층도입니다.",
};

type FamilyTreeTabProps = {
  data: FamilyGraphData;
  currentUserProfile?: UserProfile | null;
};

export function FamilyTreeTab({ data, currentUserProfile }: FamilyTreeTabProps) {
  const tree = buildFamilyHierarchyTree(data.persons, data.relationships);

  return (
    <FamilyTreeStage
      tree={
        <FamilyRelationshipTree
          tree={tree}
          persons={data.persons}
          relationships={data.relationships}
          currentUserProfile={currentUserProfile ?? null}
        />
      }
    />
  );
}

function FamilyTreeStage({ tree }: { tree: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">{TEXT.title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{TEXT.description}</p>
      </div>

      <div className="mt-5">{tree}</div>
    </section>
  );
}
