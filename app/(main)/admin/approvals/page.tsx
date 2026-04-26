import { approveJoinRequestAction, rejectJoinRequestAction } from "@/lib/auth/approval-actions";
import { requireSuperAdminProfile } from "@/lib/auth/guards";
import { getAllJoinRequests } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { BRANCH_OPTIONS, FAMILY_ROLE_OPTIONS } from "@/lib/constants";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEXT = {
  title: "회원 가입 승인",
  description: "가입 신청 목록을 확인하고 승인 또는 반려할 수 있습니다.",
  empty: "표시할 가입 신청이 없습니다.",
};

export default async function AdminApprovalsPage() {
  await requireSuperAdminProfile();
  const supabase = await createClient();
  const joinRequests = await getAllJoinRequests(supabase);

  return (
    <PageContainer className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{TEXT.title}</CardTitle>
          <CardDescription>{TEXT.description}</CardDescription>
        </CardHeader>
      </Card>

      {joinRequests.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">{TEXT.empty}</CardContent>
        </Card>
      ) : (
        joinRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{request.display_name}</CardTitle>
                  <CardDescription>{request.phone}</CardDescription>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {formatStatus(request.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                <p>1대 가족: {formatBranchCode(request.branch_code)}</p>
                <p>가족 구분: {formatFamilyRole(request.family_role_type)}</p>
                <p>가입 일시: {request.created_at}</p>
                <p>person 연결: {request.person_id ?? "-"}</p>
              </div>

              {request.status === "pending" ? (
                <div className="flex gap-2">
                  <form action={approveJoinRequestAction.bind(null, request.id)}>
                    <Button type="submit">승인</Button>
                  </form>
                  <form action={rejectJoinRequestAction.bind(null, request.id)}>
                    <Button type="submit" variant="outline">
                      반려
                    </Button>
                  </form>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </PageContainer>
  );
}

function formatStatus(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return "승인 완료";
  }

  if (status === "rejected") {
    return "반려";
  }

  return "승인 대기";
}

function formatBranchCode(branchCode: string) {
  return BRANCH_OPTIONS.find((option) => option.value === branchCode)?.label ?? branchCode;
}

function formatFamilyRole(familyRoleType: string) {
  return (
    FAMILY_ROLE_OPTIONS.find((option) => option.value === familyRoleType)?.label ??
    familyRoleType
  );
}
