import { FamilyTreeTab } from "@/components/family/family-tree-tab";
import { MonthlyBirthdayBanner } from "@/components/family/monthly-birthday-banner";
import { PageContainer } from "@/components/layout/page-container";
import { requireApprovedProfile } from "@/lib/auth/guards";
import { getCurrentUserProfile, getFamilyGraphData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

const TEXT = {
  title: "가족 공간",
  description:
    "최상위 가구에서 시작해 선택한 줄기를 오른쪽으로 확장해 보는 탐색형 가계도입니다.",
};

export default async function HomePage() {
  await requireApprovedProfile();

  const supabase = await createClient();
  const [currentUserProfile, familyGraphData] = await Promise.all([
    getCurrentUserProfile(supabase),
    getFamilyGraphData(supabase),
  ]);
  const debug = familyGraphData.debug;

  if (
    debug?.supabaseErrorMessage ||
    debug?.personsErrorMessage ||
    debug?.relationshipsErrorMessage
  ) {
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

      <MonthlyBirthdayBanner persons={familyGraphData.persons} />

      <FamilyTreeTab data={familyGraphData} currentUserProfile={currentUserProfile} />
    </PageContainer>
  );
}
