import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedUser, resolveCurrentAccessContext } from "@/lib/auth/guards";

const TEXT = {
  missingProfileTitle: "로그인 계정 확인이 필요합니다.",
  missingProfileDescription: "현재 로그인 계정과 가족 프로필 연결 정보를 찾지 못했습니다.",
  pendingTitle: "현재 가입 승인 대기 중입니다.",
  pendingDescription: "관리자 승인 후 이용하실 수 있습니다.",
  rejectedTitle: "가입 신청이 반려되었습니다.",
  rejectedDescription: "필요 시 관리자에게 문의해 주세요.",
  approvedTitle: "내 정보",
  approvedDescription: "로그인 사용자와 연결된 가족 프로필을 확인하는 영역입니다.",
  unknownStatusTitle: "승인 상태 확인이 필요합니다.",
  unknownStatusDescription: "현재 계정의 승인 상태 값을 확인하지 못했습니다.",
};

export default async function MePage() {
  await requireAuthenticatedUser();
  const accessContext = await resolveCurrentAccessContext();
  const profile = accessContext.profile;

  if (profile?.role === "super_admin") {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>{TEXT.approvedTitle}</CardTitle>
            <CardDescription>{TEXT.approvedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            user_profiles.person_id 기준으로 내 가족 정보, 승인 상태, 수정 요청 내역을 보여줄 예정입니다.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>{TEXT.missingProfileTitle}</CardTitle>
            <CardDescription>{TEXT.missingProfileDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            로그인은 되었지만 이 계정에 연결된 user_profiles 정보를 찾지 못했습니다. 관리자에게 계정 연결 상태를 확인해 주세요.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (accessContext.decision === "unknown_status") {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>{TEXT.unknownStatusTitle}</CardTitle>
            <CardDescription>{TEXT.unknownStatusDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            role 또는 status 값이 비어 있거나 예상과 다를 수 있습니다. 관리자에게 user_profiles 상태를 확인해 주세요.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (profile.status === "pending") {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>{TEXT.pendingTitle}</CardTitle>
            <CardDescription>{TEXT.pendingDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            가입 신청이 확인되는 대로 관리자가 승인해 드립니다. 승인 전에는 가족 공간 열람과 수정 기능이 제한됩니다.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (profile.status === "rejected") {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>{TEXT.rejectedTitle}</CardTitle>
            <CardDescription>{TEXT.rejectedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            가입 신청 정보나 가족 연결이 필요한 경우 관리자에게 문의해 주세요.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>{TEXT.approvedTitle}</CardTitle>
          <CardDescription>{TEXT.approvedDescription}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          user_profiles.person_id 기준으로 내 가족 정보, 승인 상태, 수정 요청 내역을 보여줄 예정입니다.
        </CardContent>
      </Card>
    </PageContainer>
  );
}
