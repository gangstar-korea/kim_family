import type { BranchCode, FamilyRoleType } from "@/lib/types";

export const SITE_NAME = "강릉김씨 김양수 패밀리";
export const SITE_DESCRIPTION = "가족의 연결과 소식을 차분히 담는 비공개 공간";
export const INTERNAL_EMAIL_DOMAIN = "family.com";

export const BRANCH_OPTIONS: Array<{ value: BranchCode; label: string }> = [
  { value: "ROOT", label: "공통/본가" },
  { value: "BR01", label: "1지파" },
  { value: "BR02", label: "2지파" },
  { value: "BR03", label: "3지파" },
  { value: "BR04", label: "4지파" },
  { value: "BR05", label: "5지파" },
  { value: "BR06", label: "6지파" },
  { value: "BR07", label: "7지파" },
  { value: "BR08", label: "8지파" },
];

export const FAMILY_ROLE_OPTIONS: Array<{
  value: FamilyRoleType;
  label: string;
}> = [
  { value: "blood", label: "혈족" },
  { value: "spouse", label: "배우자" },
];
