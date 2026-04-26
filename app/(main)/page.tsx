import { FamilyListTab } from "@/components/family/family-list-tab";
import { FamilyTreeTab } from "@/components/family/family-tree-tab";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getFamilyGraphData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

const TEXT = {
  title: "\uAC00\uC871 \uACF5\uAC04",
  description:
    "\uAC00\uC871 \uACC4\uCE35\uB3C4\uB294 \uC120\uD0DD\uD55C \uC904\uAE30\uB97C \uB530\uB77C \uC624\uB978\uCABD\uC73C\uB85C \uD655\uC7A5\uB418\uACE0, \uAC00\uC871 \uBAA9\uB85D\uC5D0\uC11C\uB294 \uC138\uB300\uBCC4 \uBD80\uBD80 \uB2E8\uC704 \uCE74\uB4DC \uB514\uB809\uD1A0\uB9AC\uB97C \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  treeTab: "\uAC00\uC871 \uACC4\uCE35\uB3C4",
  listTab: "\uAC00\uC871 \uBAA9\uB85D",
};

export default async function HomePage() {
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const familyGraphData = await getFamilyGraphData(supabase);
  const debug = familyGraphData.debug;

  if (debug?.supabaseErrorMessage || debug?.personsErrorMessage || debug?.relationshipsErrorMessage) {
    console.error("[family page] data load error", {
      supabaseErrorMessage: debug.supabaseErrorMessage,
      personsErrorMessage: debug.personsErrorMessage,
      relationshipsErrorMessage: debug.relationshipsErrorMessage,
    });
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <section className="space-y-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">{TEXT.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {TEXT.description}
          </p>
        </div>
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
