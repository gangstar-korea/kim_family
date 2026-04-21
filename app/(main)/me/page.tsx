import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MePage() {
  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
          <CardDescription>로그인 사용자와 연결된 가족 프로필 자리입니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          user_profiles.person_id 기준으로 내 가족 정보, 승인 상태, 수정 요청 내역을 보여줄
          예정입니다.
        </CardContent>
      </Card>
    </PageContainer>
  );
}
