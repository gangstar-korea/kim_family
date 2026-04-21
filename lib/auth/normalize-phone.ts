import { INTERNAL_EMAIL_DOMAIN } from "@/lib/constants";

export function normalizePhoneNumber(input: string) {
  return input.replace(/[^\d]/g, "");
}

export function isValidKoreanMobilePhone(input: string) {
  const normalized = normalizePhoneNumber(input);
  return /^01[016789]\d{7,8}$/.test(normalized);
}

export function phoneToInternalEmail(input: string) {
  const normalized = normalizePhoneNumber(input);

  if (!isValidKoreanMobilePhone(normalized)) {
    throw new Error("휴대폰 번호 형식이 올바르지 않습니다.");
  }

  return `${normalized}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function formatKoreanMobilePhone(input: string) {
  const normalized = normalizePhoneNumber(input);

  if (normalized.length === 11) {
    return normalized.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  if (normalized.length === 10) {
    return normalized.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  return normalized;
}
