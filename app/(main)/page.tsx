import { FamilyListTab } from "@/components/family/family-list-tab";
import { FamilyTreeTab } from "@/components/family/family-tree-tab";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getFamilyGraphData } from "@/lib/supabase/queries";

export default async function HomePage() {
  const supabase = await createClient();
  const familyGraphData = await getFamilyGraphData(supabase);

  return (
    <PageContainer size="wide" className="space-y-6">
      <section className="space-y-3">
        <div className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Supabase 실데이터
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">가족 가계도</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            persons와 relationships 테이블을 기준으로 가족 계층도와 목록을 표시합니다.
            지파와 고인 여부를 함께 확인할 수 있습니다.
          </p>
        </div>
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
          <FamilyListTab persons={familyGraphData.persons} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
