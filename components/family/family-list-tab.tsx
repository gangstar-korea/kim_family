import { FamilyGenerationListView } from "@/components/family/family-tree";
import { buildFamilyTree } from "@/lib/family/tree-adapter";
import type { FamilyGraphData } from "@/lib/types";

type FamilyListTabProps = {
  data: FamilyGraphData;
};

export function FamilyListTab({ data }: FamilyListTabProps) {
  const generationList = buildFamilyTree(data.persons, data.relationships);

  return <FamilyGenerationListView tree={generationList} />;
}
