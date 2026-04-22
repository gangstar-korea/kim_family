import { FamilyListTab } from "@/components/family/family-list-tab";
import { FamilyTreeTab } from "@/components/family/family-tree-tab";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { buildFamilyTree, countFamilyTreeNodes } from "@/lib/family/tree-adapter";
import { getFamilyGraphData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

const TEXT = {
  badge: "\u0053\u0075\u0070\u0061\u0062\u0061\u0073\u0065 \uC2E4\uB370\uC774\uD130",
  title: "\uAC00\uC871 \uACF5\uAC04",
  description:
    "\uAC00\uC871 \uACC4\uCE35\uB3C4 \uD0ED\uC740 \uAD00\uACC4 \uC911\uC2EC \uD654\uBA74\uC73C\uB85C \uC900\uBE44 \uC911\uC774\uBA70, \uAC00\uC871 \uBAA9\uB85D \uD0ED\uC5D0\uC11C \uC138\uB300\uBCC4 \uBD80\uBD80 \uB2E8\uC704 \uCE74\uB4DC \uB514\uB809\uD1A0\uB9AC\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  debugTitle: "\uB370\uC774\uD130 \uB514\uBC84\uADF8",
  debugBadge: "\uC784\uC2DC \uD45C\uC2DC",
  treeTab: "\uAC00\uC871 \uACC4\uCE35\uB3C4",
  listTab: "\uAC00\uC871 \uBAA9\uB85D",
};

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
          {TEXT.badge}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">{TEXT.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {TEXT.description}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-sm shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-bold">{TEXT.debugTitle}</h3>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {TEXT.debugBadge}
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

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[360px]">
          <TabsTrigger value="tree">{TEXT.treeTab}</TabsTrigger>
          <TabsTrigger value="list">{TEXT.listTab}</TabsTrigger>
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
