import type { ReactNode } from "react";

import { FamilyRelationshipTree } from "@/components/family/family-relationship-tree";
import { buildFamilyTree } from "@/lib/family/tree-adapter";
import type { FamilyGraphData } from "@/lib/types";

const TEXT = {
  title: "\uAC00\uC871 \uAD00\uACC4 \uC911\uC2EC \uACC4\uCE35\uB3C4",
  description:
    "\uBD80\uBAA8, \uC790\uB140, \uBC30\uC6B0\uC790 \uAD00\uACC4\uB97C \uC2DC\uAC01\uC801\uC73C\uB85C \uC5F0\uACB0\uD558\uB294 \uC804\uC6A9 \uD654\uBA74\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uB2E8\uACC4\uC5D0\uC11C \uC2E4\uC81C \uAD00\uACC4\uB3C4 UI\uB97C \uC774 \uC601\uC5ED\uC5D0 \uBD99\uC785\uB2C8\uB2E4.",
};

type FamilyTreeTabProps = {
  data: FamilyGraphData;
};

export function FamilyTreeTab({ data }: FamilyTreeTabProps) {
  const tree = buildFamilyTree(data.persons, data.relationships);

  return <FamilyTreeStage tree={<FamilyRelationshipTree tree={tree} />} />;
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
