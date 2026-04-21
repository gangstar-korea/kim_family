import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminApprovalsPage() {
  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>관리자 승인</CardTitle>
          <CardDescription>가입 신청과 정보 수정 요청을 검토하는 자리입니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          super_admin은 전체, branch_admin은 자기 branch_code 요청만 처리하도록 쿼리와
          가드를 연결할 예정입니다.
        </CardContent>
      </Card>
    </PageContainer>
  );
}
