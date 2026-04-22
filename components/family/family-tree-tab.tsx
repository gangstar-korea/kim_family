import { FamilyTreeView } from "@/components/family/family-tree";
import { buildFamilyTree } from "@/lib/family/tree-adapter";
import type { FamilyGraphData } from "@/lib/types";

type FamilyTreeTabProps = {
  data: FamilyGraphData;
};

export function FamilyTreeTab({ data }: FamilyTreeTabProps) {
  const tree = buildFamilyTree(data.persons, data.relationships);

  return <FamilyTreeView tree={tree} />;
}
