import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FamilyDetailPageProps = {
  params: Promise<{
    personId: string;
  }>;
};

export default async function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const { personId } = await params;

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>가족 상세정보</CardTitle>
          <CardDescription>person_id: {personId}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          persons, relationships, edit_requests를 연결해 상세 프로필과 수정 요청 기능을
          붙일 예정입니다.
        </CardContent>
      </Card>
    </PageContainer>
  );
}
