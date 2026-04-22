import { FamilyTreeView } from "@/components/family/family-tree";
import type { FamilyTree } from "@/lib/family/tree-adapter";

type FamilyTreeTabProps = {
  tree: FamilyTree;
};

export function FamilyTreeTab({ tree }: FamilyTreeTabProps) {
  return <FamilyTreeView tree={tree} />;
}
