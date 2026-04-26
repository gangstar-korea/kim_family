import { BRANCH_OPTIONS, FAMILY_ROLE_OPTIONS } from "@/lib/constants";
import { approveJoinRequestAction, rejectJoinRequestAction } from "@/lib/auth/approval-actions";
import { requireSuperAdminProfile } from "@/lib/auth/guards";
import { getApprovalAdminItems } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEXT = {
  title: "회원 승인 관리",
  description: "가입한 사용자의 승인 상태를 확인하고 승인 또는 반려할 수 있습니다.",
  empty: "표시할 가입 신청이 없습니다.",
  emailGuide: "현재 데이터 구조상 이메일 대신 계정 ID와 연락처를 함께 표시합니다.",
  accountId: "계정 ID",
  name: "이름",
  phone: "연락처",
  branch: "1대 가족",
  familyRole: "가족 구분",
  joinedAt: "가입 일시",
  personLink: "person 연결",
  role: "권한",
  approve: "승인",
  reject: "반려",
  approvedFeedback: "승인되었습니다.",
  rejectedFeedback: "반려되었습니다.",
  failedFeedback: "처리에 실패했습니다.",
};

type AdminApprovalsPageProps = {
  searchParams: Promise<{
    result?: string;
  }>;
};

export default async function AdminApprovalsPage({
  searchParams,
}: AdminApprovalsPageProps) {
  await requireSuperAdminProfile();
  const supabase = await createClient();
  const approvalItems = await getApprovalAdminItems(supabase);
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackMessage(resolvedSearchParams.result);

  return (
    <PageContainer className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{TEXT.title}</CardTitle>
          <CardDescription>{TEXT.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-muted-foreground">{TEXT.emailGuide}</p>
          {feedback ? (
            <div
              className={
                feedback.tone === "success"
                  ? "rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
                  : "rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              }
            >
              {feedback.message}
            </div>
          ) : null}
        </CardContent>
      </Card>

          {approvalItems.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">{TEXT.empty}</CardContent>
        </Card>
      ) : (
        approvalItems.map((item) => (
          <Card key={item.joinRequest?.id ?? item.accountId}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{item.displayName}</CardTitle>
                  <CardDescription>{item.accountId}</CardDescription>
                </div>
                <StatusBadge status={item.effectiveStatus} />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoItem label={TEXT.accountId} value={item.accountId} />
                <InfoItem label={TEXT.name} value={item.displayName} />
                <InfoItem label={TEXT.phone} value={item.phone} />
                <InfoItem label={TEXT.branch} value={formatBranchCode(item.branchCode)} />
                <InfoItem label={TEXT.familyRole} value={formatFamilyRole(item.familyRoleType)} />
                <InfoItem label={TEXT.joinedAt} value={formatDateTime(item.createdAt)} />
                <InfoItem label={TEXT.personLink} value={item.personId ?? "-"} />
                <InfoItem label={TEXT.role} value={formatRole(item.role)} />
              </div>

              {item.effectiveStatus === "pending" && item.joinRequest ? (
                <div className="flex gap-2">
                  <form action={approveJoinRequestAction.bind(null, item.joinRequest.id)}>
                    <Button type="submit">{TEXT.approve}</Button>
                  </form>
                  <form action={rejectJoinRequestAction.bind(null, item.joinRequest.id)}>
                    <Button type="submit" variant="outline">
                      {TEXT.reject}
                    </Button>
                  </form>
                </div>
              ) : item.effectiveStatus === "pending" ? (
                <p className="text-sm text-muted-foreground">
                  가입 신청 기록이 없어 이 화면에서는 바로 처리할 수 없습니다.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </PageContainer>
  );
}

function getFeedbackMessage(result: string | undefined) {
  if (result === "approved") {
    return { tone: "success" as const, message: TEXT.approvedFeedback };
  }

  if (result === "rejected") {
    return { tone: "success" as const, message: TEXT.rejectedFeedback };
  }

  if (result === "error") {
    return { tone: "error" as const, message: TEXT.failedFeedback };
  }

  return null;
}

function formatBranchCode(branchCode: string | null) {
  if (!branchCode) {
    return "-";
  }

  return BRANCH_OPTIONS.find((option) => option.value === branchCode)?.label ?? branchCode;
}

function formatFamilyRole(familyRoleType: string | null) {
  if (!familyRoleType) {
    return "-";
  }

  return (
    FAMILY_ROLE_OPTIONS.find((option) => option.value === familyRoleType)?.label ??
    familyRoleType
  );
}

function formatRole(role: string | null) {
  return role ?? "-";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const label =
    status === "approved" ? "승인 완료" : status === "rejected" ? "반려" : "승인 대기";
  const className =
    status === "approved"
      ? "bg-primary/10 text-primary"
      : status === "rejected"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
