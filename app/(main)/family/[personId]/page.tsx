import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireApprovedProfile } from "@/lib/auth/guards";

type FamilyDetailPageProps = {
  params: Promise<{
    personId: string;
  }>;
};

export default async function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  await requireApprovedProfile();
  const { personId } = await params;

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>가족 상세정보</CardTitle>
          <CardDescription>person_id: {personId}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          persons, relationships, edit_requests를 연결한 상세 프로필과 수정 요청 기능을 붙일 예정입니다.
        </CardContent>
      </Card>
    </PageContainer>
  );
}
