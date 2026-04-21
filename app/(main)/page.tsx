import { FamilyTreeView } from "@/components/family/family-tree";
import { PageContainer } from "@/components/layout/page-container";
import { buildFamilyTree } from "@/lib/family/tree-adapter";
import { mockPersons, mockRelationships } from "@/lib/family/mock-family-data";

export default function HomePage() {
  const tree = buildFamilyTree(mockPersons, mockRelationships);

  return (
    <PageContainer size="wide" className="space-y-6">
      <section className="space-y-3">
        <div className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          읽기 전용 프로토타입
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">가족 가계도</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            persons와 relationships 구조를 기준으로 1~3세대 가족 연결을 카드형으로
            미리 보여줍니다. 실제 Supabase 데이터는 같은 shape로 교체할 수 있습니다.
          </p>
        </div>
      </section>

      <section aria-label="가족 가계도 미리보기">
        <FamilyTreeView tree={tree} />
      </section>
    </PageContainer>
  );
}
