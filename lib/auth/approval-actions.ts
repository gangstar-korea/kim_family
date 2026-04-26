"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdminProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { JoinRequest } from "@/lib/types";

const APPROVAL_PATHS = ["/", "/me", "/admin/approvals"];

export async function approveJoinRequestAction(joinRequestId: string): Promise<void> {
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
    redirect("/admin/approvals?result=error");
  }

  const reviewedAt = new Date().toISOString();

  const { error: joinUpdateError } = await supabase
    .from("join_requests")
    .update({
      status: "approved",
      reviewed_by: profile.id,
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
    redirect("/admin/approvals?result=error");
  }

  const { error: profileUpdateError } = await supabase
    .from("user_profiles")
    .update({
      status: "approved",
    })
    .eq("id", joinRequest.user_id);

  if (profileUpdateError) {
    console.error("[approval] user profile approve failed", {
      joinRequestId,
      code: profileUpdateError.code,
      message: profileUpdateError.message,
      details: profileUpdateError.details,
      hint: profileUpdateError.hint,
    });
    redirect("/admin/approvals?result=error");
  }

  revalidateApprovalPaths();
  redirect("/admin/approvals?result=approved");
}

export async function rejectJoinRequestAction(joinRequestId: string): Promise<void> {
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
    redirect("/admin/approvals?result=error");
  }

  const reviewedAt = new Date().toISOString();

  const { error: joinUpdateError } = await supabase
    .from("join_requests")
    .update({
      status: "rejected",
      reviewed_by: profile.id,
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
    redirect("/admin/approvals?result=error");
  }

  const { error: profileUpdateError } = await supabase
    .from("user_profiles")
    .update({
      status: "rejected",
    })
    .eq("id", joinRequest.user_id);

  if (profileUpdateError) {
    console.error("[approval] user profile reject failed", {
      joinRequestId,
      code: profileUpdateError.code,
      message: profileUpdateError.message,
      details: profileUpdateError.details,
      hint: profileUpdateError.hint,
    });
    redirect("/admin/approvals?result=error");
  }

  revalidateApprovalPaths();
  redirect("/admin/approvals?result=rejected");
}

function revalidateApprovalPaths() {
  APPROVAL_PATHS.forEach((path) => revalidatePath(path));
}
