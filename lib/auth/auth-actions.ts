"use server";

import { redirect } from "next/navigation";

import { BRANCH_OPTIONS, FAMILY_ROLE_OPTIONS } from "@/lib/constants";
import type { AuthActionState, BranchCode, FamilyRoleType } from "@/lib/types";
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
    return { ok: false, message: "지파를 선택해 주세요." };
  }

  if (!isFamilyRoleType(familyRoleType)) {
    return { ok: false, message: "가족 구분을 선택해 주세요." };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
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
      message: "회원가입에 실패했습니다. 이미 가입된 번호인지 확인해 주세요.",
    };
  }

  return {
    ok: true,
    message: "가입 신청이 접수되었습니다. 관리자 승인 후 이용할 수 있습니다.",
  };
}
