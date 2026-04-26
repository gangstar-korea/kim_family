"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdminProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { JoinRequest, PersonWriteActionResult } from "@/lib/types";

const APPROVAL_PATHS = ["/", "/me", "/admin/approvals"];

export async function approveJoinRequestAction(
  joinRequestId: string,
): Promise<PersonWriteActionResult> {
  const profile = await requireSuperAdminProfile();
  const supabase = await createClient();

  const { data: joinRequest, error: joinRequestError } = await supabase
    .from("join_requests")
    .select("*")
    .eq("id", joinRequestId)
    .maybeSingle<JoinRequest>();

  if (joinRequestError || !joinRequest) {
    console.error("[approval] join request lookup failed", {
      joinRequestId,
      error: joinRequestError?.message ?? "not found",
    });
    return { ok: false, message: "승인할 가입 신청을 찾지 못했습니다." };
  }

  const reviewedAt = new Date().toISOString();

  const { error: joinUpdateError } = await supabase
    .from("join_requests")
    .update({
      status: "approved",
      reviewed_by: profile.user_id,
      reviewed_at: reviewedAt,
      rejection_reason: null,
    })
    .eq("id", joinRequest.id);

  if (joinUpdateError) {
    console.error("[approval] join request approve failed", {
      joinRequestId,
      code: joinUpdateError.code,
      message: joinUpdateError.message,
      details: joinUpdateError.details,
      hint: joinUpdateError.hint,
    });
    return { ok: false, message: "가입 승인 처리 중 오류가 발생했습니다." };
  }

  const { error: profileUpdateError } = await supabase
    .from("user_profiles")
    .update({
      status: "approved",
    })
    .eq("user_id", joinRequest.user_id);

  if (profileUpdateError) {
    console.error("[approval] user profile approve failed", {
      joinRequestId,
      code: profileUpdateError.code,
      message: profileUpdateError.message,
      details: profileUpdateError.details,
      hint: profileUpdateError.hint,
    });
    return { ok: false, message: "프로필 승인 상태 저장 중 오류가 발생했습니다." };
  }

  revalidateApprovalPaths();
  return { ok: true, message: "가입 신청을 승인했습니다." };
}

export async function rejectJoinRequestAction(
  joinRequestId: string,
): Promise<PersonWriteActionResult> {
  const profile = await requireSuperAdminProfile();
  const supabase = await createClient();

  const { data: joinRequest, error: joinRequestError } = await supabase
    .from("join_requests")
    .select("*")
    .eq("id", joinRequestId)
    .maybeSingle<JoinRequest>();

  if (joinRequestError || !joinRequest) {
    console.error("[approval] join request lookup failed", {
      joinRequestId,
      error: joinRequestError?.message ?? "not found",
    });
    return { ok: false, message: "반려할 가입 신청을 찾지 못했습니다." };
  }

  const reviewedAt = new Date().toISOString();

  const { error: joinUpdateError } = await supabase
    .from("join_requests")
    .update({
      status: "rejected",
      reviewed_by: profile.user_id,
      reviewed_at: reviewedAt,
      rejection_reason: "관리자 검토 후 반려",
    })
    .eq("id", joinRequest.id);

  if (joinUpdateError) {
    console.error("[approval] join request reject failed", {
      joinRequestId,
      code: joinUpdateError.code,
      message: joinUpdateError.message,
      details: joinUpdateError.details,
      hint: joinUpdateError.hint,
    });
    return { ok: false, message: "가입 반려 처리 중 오류가 발생했습니다." };
  }

  const { error: profileUpdateError } = await supabase
    .from("user_profiles")
    .update({
      status: "rejected",
    })
    .eq("user_id", joinRequest.user_id);

  if (profileUpdateError) {
    console.error("[approval] user profile reject failed", {
      joinRequestId,
      code: profileUpdateError.code,
      message: profileUpdateError.message,
      details: profileUpdateError.details,
      hint: profileUpdateError.hint,
    });
    return { ok: false, message: "프로필 반려 상태 저장 중 오류가 발생했습니다." };
  }

  revalidateApprovalPaths();
  return { ok: true, message: "가입 신청을 반려했습니다." };
}

function revalidateApprovalPaths() {
  APPROVAL_PATHS.forEach((path) => revalidatePath(path));
}
