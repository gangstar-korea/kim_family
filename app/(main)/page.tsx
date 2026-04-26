import { FamilyTreeTab } from "@/components/family/family-tree-tab";
import { PageContainer } from "@/components/layout/page-container";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getFamilyGraphData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

const TEXT = {
  title: "\uAC00\uC871 \uACF5\uAC04",
  description:
    "\uCD5C\uC0C1\uC704 \uAC00\uAD6C\uC5D0\uC11C \uC2DC\uC791\uD574 \uC120\uD0DD\uD55C \uC778\uBB3C\uC758 \uC790\uB140 \uAC00\uC9C0\uB97C \uC624\uB978\uCABD\uC73C\uB85C \uD655\uC7A5\uD558\uB294 \uD0D0\uC0C9\uD615 \uAC00\uACC4\uB3C4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
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

      <FamilyTreeTab data={familyGraphData} />
    </PageContainer>
  );
}
