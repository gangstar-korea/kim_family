"use server";

import { redirect } from "next/navigation";

import { BRANCH_OPTIONS, FAMILY_ROLE_OPTIONS } from "@/lib/constants";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import type { AuthActionState, BranchCode, FamilyRoleType, JoinRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import {
  isValidKoreanMobilePhone,
  normalizePhoneNumber,
  phoneToInternalEmail,
} from "@/lib/auth/normalize-phone";

const PASSWORD_MIN_LENGTH = 8;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isBranchCode(value: string): value is BranchCode {
  return BRANCH_OPTIONS.some((option) => option.value === value);
}

function isFamilyRoleType(value: string): value is FamilyRoleType {
  return FAMILY_ROLE_OPTIONS.some((option) => option.value === value);
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const phone = getText(formData, "phone");
  const password = getText(formData, "password");

  if (!isValidKoreanMobilePhone(phone)) {
    return { ok: false, message: "휴대폰 번호를 정확히 입력해 주세요." };
  }

  if (!password) {
    return { ok: false, message: "비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToInternalEmail(phone),
    password,
  });

  if (error) {
    return {
      ok: false,
      message: "로그인에 실패했습니다. 번호와 비밀번호를 확인해 주세요.",
    };
  }

  redirect("/");
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const phone = getText(formData, "phone");
  const password = getText(formData, "password");
  const passwordConfirm = getText(formData, "passwordConfirm");
  const displayName = getText(formData, "displayName");
  const branchCode = getText(formData, "branchCode");
  const familyRoleType = getText(formData, "familyRoleType");

  if (!displayName) {
    return { ok: false, message: "이름을 입력해 주세요." };
  }

  if (!isValidKoreanMobilePhone(phone)) {
    return { ok: false, message: "휴대폰 번호를 정확히 입력해 주세요." };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    };
  }

  if (password !== passwordConfirm) {
    return { ok: false, message: "비밀번호 확인이 일치하지 않습니다." };
  }

  if (!isBranchCode(branchCode)) {
    return { ok: false, message: "1대 가족을 선택해 주세요." };
  }

  if (!isFamilyRoleType(familyRoleType)) {
    return { ok: false, message: "가족 구분을 선택해 주세요." };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const supabase = await createClient();
  const { data: signupData, error } = await supabase.auth.signUp({
    email: phoneToInternalEmail(phone),
    password,
    options: {
      data: {
        phone: normalizedPhone,
        display_name: displayName,
        branch_code: branchCode,
        family_role_type: familyRoleType,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: "회원가입에 실패했습니다. 이미 가입한 번호인지 확인해 주세요.",
    };
  }

  const authUserId = signupData.user?.id;

  if (!authUserId) {
    return {
      ok: false,
      message: "가입 신청 처리 중 사용자 정보를 확인하지 못했습니다. 다시 시도해 주세요.",
    };
  }

  const currentProfile = await getCurrentUserProfile(supabase);

  if (currentProfile) {
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName,
        phone: normalizedPhone,
        branch_code: branchCode,
        family_role_type: familyRoleType,
        status: "pending",
      })
      .eq("id", currentProfile.id);

    if (profileError) {
      console.error("[signup] user_profiles update failed", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });
      return {
        ok: false,
        message: "가입 신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
  }

  const { data: existingJoinRequest, error: joinLookupError } = await supabase
    .from("join_requests")
    .select("*")
    .eq("user_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<JoinRequest>();

  if (joinLookupError) {
    console.error("[signup] join request lookup failed", {
      code: joinLookupError.code,
      message: joinLookupError.message,
      details: joinLookupError.details,
      hint: joinLookupError.hint,
    });
    return {
      ok: false,
      message: "가입 신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const joinRequestPayload = {
    user_id: authUserId,
    person_id: existingJoinRequest?.person_id ?? null,
    phone: normalizedPhone,
    display_name: displayName,
    branch_code: branchCode,
    family_role_type: familyRoleType,
    status: "pending" as const,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
  };

  if (existingJoinRequest) {
    const { error: joinUpdateError } = await supabase
      .from("join_requests")
      .update(joinRequestPayload)
      .eq("id", existingJoinRequest.id);

    if (joinUpdateError) {
      console.error("[signup] join request update failed", {
        code: joinUpdateError.code,
        message: joinUpdateError.message,
        details: joinUpdateError.details,
        hint: joinUpdateError.hint,
      });
      return {
        ok: false,
        message: "가입 신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
  } else {
    const { error: joinInsertError } = await supabase
      .from("join_requests")
      .insert(joinRequestPayload);

    if (joinInsertError) {
      console.error("[signup] join request insert failed", {
        code: joinInsertError.code,
        message: joinInsertError.message,
        details: joinInsertError.details,
        hint: joinInsertError.hint,
      });
      return {
        ok: false,
        message: "가입 신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
  }

  return {
    ok: true,
    message: "가입 신청이 완료되었습니다. 관리자 승인 후 이용할 수 있습니다.",
  };
}
