import type { ReactNode } from "react";

import { FamilyRelationshipTree } from "@/components/family/family-relationship-tree";
import { buildFamilyHierarchyTree } from "@/lib/family/tree-adapter";
import type { FamilyGraphData } from "@/lib/types";

const TEXT = {
  title: "\uAC00\uC871 \uAD00\uACC4 \uC911\uC2EC \uACC4\uCE35\uB3C4",
  description:
    "\uCD5C\uC0C1\uC704 \uAC00\uAD6C\uC5D0\uC11C \uC2DC\uC791\uD574 \uC120\uD0DD\uD55C \uC778\uBB3C\uC758 \uC790\uB140 \uAC00\uC9C0\uB97C \uC624\uB978\uCABD \uCEEC\uB7FC\uC73C\uB85C \uD655\uC7A5\uD558\uB294 \uD0D0\uC0C9\uD615 \uACC4\uCE35\uB3C4\uC785\uB2C8\uB2E4.",
};

type FamilyTreeTabProps = {
  data: FamilyGraphData;
};

export function FamilyTreeTab({ data }: FamilyTreeTabProps) {
  const tree = buildFamilyHierarchyTree(data.persons, data.relationships, 3);

  return (
    <FamilyTreeStage
      tree={
        <FamilyRelationshipTree
          tree={tree}
          persons={data.persons}
          relationships={data.relationships}
        />
      }
    />
  );
}

function FamilyTreeStage({ tree }: { tree: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">{TEXT.title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{TEXT.description}</p>
      </div>

      <div className="mt-5">{tree}</div>
    </section>
  );
}
