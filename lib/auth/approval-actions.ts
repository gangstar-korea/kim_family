"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdminProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { BranchCode, FamilyRoleType, JoinRequest, UserProfile } from "@/lib/types";

const APPROVAL_PATHS = ["/", "/me", "/admin/approvals"];

export async function approveJoinRequestAction(requesterUserId: string): Promise<void> {
  const adminProfile = await requireSuperAdminProfile();
  const supabase = await createClient();
  const joinRequest = await getLatestJoinRequestByRequesterUserId(supabase, requesterUserId);

  if (!joinRequest) {
    redirect("/admin/approvals?result=error");
  }

  const reviewedAt = new Date().toISOString();

  const { error: joinUpdateError } = await supabase
    .from("join_requests")
    .update({
      status: "approved",
      reviewed_by: adminProfile.id,
      reviewed_at: reviewedAt,
      review_note: null,
    })
    .eq("requester_user_id", joinRequest.requester_user_id)
    .eq("created_at", joinRequest.created_at);

  if (joinUpdateError) {
    console.error("[approval] join request approve failed", {
      requesterUserId,
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
    .eq("id", requesterUserId);

  if (profileUpdateError) {
    console.error("[approval] user profile approve failed", {
      requesterUserId,
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

export async function rejectJoinRequestAction(requesterUserId: string): Promise<void> {
  const adminProfile = await requireSuperAdminProfile();
  const supabase = await createClient();
  const joinRequest = await getLatestJoinRequestByRequesterUserId(supabase, requesterUserId);

  if (!joinRequest) {
    redirect("/admin/approvals?result=error");
  }

  const reviewedAt = new Date().toISOString();

  const { error: joinUpdateError } = await supabase
    .from("join_requests")
    .update({
      status: "rejected",
      reviewed_by: adminProfile.id,
      reviewed_at: reviewedAt,
      review_note: "관리자 검토 후 반려",
    })
    .eq("requester_user_id", joinRequest.requester_user_id)
    .eq("created_at", joinRequest.created_at);

  if (joinUpdateError) {
    console.error("[approval] join request reject failed", {
      requesterUserId,
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
    .eq("id", requesterUserId);

  if (profileUpdateError) {
    console.error("[approval] user profile reject failed", {
      requesterUserId,
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

export async function rejectUserProfileAction(profileId: string): Promise<void> {
  await requireSuperAdminProfile();
  const supabase = await createClient();

  const { error: profileUpdateError } = await supabase
    .from("user_profiles")
    .update({
      status: "rejected",
    })
    .eq("id", profileId);

  if (profileUpdateError) {
    console.error("[approval] user profile direct reject failed", {
      profileId,
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

export async function approveUserProfileWithJoinRequestAction(
  profileId: string,
  formData: FormData,
): Promise<void> {
  const adminProfile = await requireSuperAdminProfile();
  const supabase = await createClient();

  const branchCode = getText(formData, "branchCode") as BranchCode;
  const familyRoleType = getText(formData, "familyRoleType") as FamilyRoleType;

  if (!branchCode || !familyRoleType) {
    redirect("/admin/approvals?result=error");
  }

  const { data: profile, error: profileLookupError } = await supabase
    .from("user_profiles")
    .select("id, person_id, phone, display_name")
    .eq("id", profileId)
    .maybeSingle<Pick<UserProfile, "id" | "person_id" | "phone" | "display_name">>();

  if (profileLookupError || !profile) {
    console.error("[approval] user profile lookup for join request backfill failed", {
      profileId,
      code: profileLookupError?.code ?? null,
      message: profileLookupError?.message ?? "not found",
      details: profileLookupError?.details ?? null,
      hint: profileLookupError?.hint ?? null,
    });
    redirect("/admin/approvals?result=error");
  }

  const joinRequestPayload = {
    requester_user_id: profile.id,
    request_type: "signup",
    applicant_name: profile.display_name,
    applicant_phone: profile.phone,
    relation_hint: `${branchCode}:${familyRoleType}`,
    payload: {
      branch_code: branchCode,
      family_role_type: familyRoleType,
      person_id: profile.person_id ?? null,
    },
    status: "approved" as const,
    reviewed_by: adminProfile.id,
    reviewed_at: new Date().toISOString(),
    review_note: null,
  };

  const { error: joinInsertError } = await supabase.from("join_requests").insert(joinRequestPayload);

  if (joinInsertError) {
    console.error("[approval] join request backfill insert failed", {
      profileId,
      code: joinInsertError.code,
      message: joinInsertError.message,
      details: joinInsertError.details,
      hint: joinInsertError.hint,
    });
    redirect("/admin/approvals?result=error");
  }

  const { error: profileUpdateError } = await supabase
    .from("user_profiles")
    .update({
      status: "approved",
    })
    .eq("id", profileId);

  if (profileUpdateError) {
    console.error("[approval] user profile approve after join request backfill failed", {
      profileId,
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

function revalidateApprovalPaths() {
  APPROVAL_PATHS.forEach((path) => revalidatePath(path));
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getLatestJoinRequestByRequesterUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requesterUserId: string,
) {
  const { data: joinRequest, error: joinRequestError } = await supabase
    .from("join_requests")
    .select("*")
    .eq("requester_user_id", requesterUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<JoinRequest>();

  if (joinRequestError || !joinRequest) {
    console.error("[approval] join request lookup failed", {
      requesterUserId,
      code: joinRequestError?.code ?? null,
      message: joinRequestError?.message ?? "not found",
      details: joinRequestError?.details ?? null,
      hint: joinRequestError?.hint ?? null,
    });
    return null;
  }

  return joinRequest;
}
