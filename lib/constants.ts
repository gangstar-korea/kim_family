import type { BranchCode, FamilyRoleType } from "@/lib/types";

export const SITE_NAME = "강릉김씨 김양수 패밀리";
export const SITE_DESCRIPTION = "가족의 연결과 소식을 차분히 담는 비공개 공간";
export const INTERNAL_EMAIL_DOMAIN = "family.com";

export const BRANCH_OPTIONS: Array<{ value: BranchCode; label: string }> = [
  { value: "ROOT", label: "공통/본가" },
  { value: "BR01", label: "김성안 가정" },
  { value: "BR02", label: "김성록 가정" },
  { value: "BR03", label: "김성학 가정" },
  { value: "BR04", label: "김성춘 가정" },
  { value: "BR05", label: "김성옥 가정" },
  { value: "BR06", label: "김성달 가정" },
  { value: "BR07", label: "김성복 가정" },
  { value: "BR08", label: "김성천 가정" },
];

export const FAMILY_ROLE_OPTIONS: Array<{
  value: FamilyRoleType;
  label: string;
}> = [
  { value: "blood", label: "직계" },
  { value: "spouse", label: "배우자" },
];
