import { FamilyListTab } from "@/components/family/family-list-tab";
import { FamilyTreeTab } from "@/components/family/family-tree-tab";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildFamilyTree, countFamilyTreeNodes } from "@/lib/family/tree-adapter";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getFamilyGraphData } from "@/lib/supabase/queries";

export default async function HomePage() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const familyGraphData = await getFamilyGraphData(supabase);
  const familyTree = buildFamilyTree(familyGraphData.persons, familyGraphData.relationships);
  const treeNodesCount = countFamilyTreeNodes(familyTree);
  const listItemsCount = familyGraphData.persons.length;
  const debug = familyGraphData.debug;

  console.error("[family page] render debug", {
    personsCount: familyGraphData.persons.length,
    relationshipsCount: familyGraphData.relationships.length,
    visiblePersonsCount: familyGraphData.persons.filter((person) => person.is_visible)
      .length,
    treeNodesCount,
    listItemsCount,
    authenticatedUserId: debug?.authenticatedUserId ?? user.id,
    supabaseErrorMessage: debug?.supabaseErrorMessage ?? null,
  });

  return (
    <PageContainer size="wide" className="space-y-6">
      <section className="space-y-3">
        <div className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Supabase 실데이터
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">가족 가계도</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            가족 계층도 탭은 관계 중심 화면으로 준비 중이며, 가족 목록 탭에서
            세대별 카드 디렉토리를 확인할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-sm shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-bold">데이터 디버그</h3>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            임시 표시
          </span>
        </div>
        <dl className="grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <DebugItem
            label="persons count"
            value={debug?.personsCount ?? familyGraphData.persons.length}
          />
          <DebugItem
            label="relationships count"
            value={debug?.relationshipsCount ?? familyGraphData.relationships.length}
          />
          <DebugItem
            label="visible persons count"
            value={
              debug?.visiblePersonsCount ??
              familyGraphData.persons.filter((person) => person.is_visible).length
            }
          />
          <DebugItem label="tree nodes count" value={treeNodesCount} />
          <DebugItem label="list items count" value={listItemsCount} />
          <DebugItem
            label="authenticated user id"
            value={debug?.authenticatedUserId ?? "none"}
          />
          <DebugItem
            label="branch_code filter"
            value={debug?.appliedFilters.branchCode ?? "ALL"}
          />
          <DebugItem
            label="is_visible filter"
            value={debug?.appliedFilters.isVisible ?? "not_applied"}
          />
          <DebugItem
            label="relation_type filter"
            value={debug?.appliedFilters.relationType ?? "not_applied"}
          />
          <DebugItem
            label="generation_depth"
            value={debug?.appliedFilters.generationDepth ?? "order_only"}
          />
          <DebugItem
            label="supabase error message"
            value={debug?.supabaseErrorMessage ?? "none"}
            wide
          />
          <DebugItem
            label="persons error"
            value={debug?.personsErrorMessage ?? "none"}
            wide
          />
          <DebugItem
            label="relationships error"
            value={debug?.relationshipsErrorMessage ?? "none"}
            wide
          />
        </dl>
      </section>

      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[360px]">
          <TabsTrigger value="tree">가족 계층도</TabsTrigger>
          <TabsTrigger value="list">가족 목록</TabsTrigger>
        </TabsList>
        <TabsContent value="tree">
          <FamilyTreeTab data={familyGraphData} />
        </TabsContent>
        <TabsContent value="list">
          <FamilyListTab data={familyGraphData} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function DebugItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: number | string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}
