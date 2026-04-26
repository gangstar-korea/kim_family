import type {
  BranchCode,
  FamilyRoleType,
  Person,
  PersonFormValues,
} from "@/lib/types";

const DEFAULT_FAMILY_CODE = "KYS";

type PersonInsertDraft = Omit<
  Person,
  "id" | "created_at" | "updated_at"
> & {
  created_at: string;
  updated_at: string;
};

type BuildChildDraftParams = {
  parent: Person;
  existingPersons: Person[];
  values: PersonFormValues;
  actorUserId: string | null;
};

type BuildSpouseDraftParams = {
  targetPerson: Person;
  existingPersons: Person[];
  values: PersonFormValues;
  actorUserId: string | null;
};

type NormalizedPersonFormValues = {
  full_name: string;
  gender: Person["gender"];
  birth_calendar_type: "solar" | "lunar";
  birth_year: string;
  birth_month: string;
  birth_day: string;
  birth_date_solar: string | null;
  birth_date_lunar: string | null;
  birth_date: string | null;
  is_lunar_leap_month: boolean;
  is_alive: boolean;
  deceased_date: string | null;
  phone: string | null;
  address: string | null;
  memo: string | null;
  birth_order: string;
};

type ParsedBloodInternalCode = {
  familyCode: string;
  generationDepth: number;
  branchCode: BranchCode;
  sequence: number;
};

export function createEmptyPersonFormValues(): PersonFormValues {
  return {
    full_name: "",
    gender: "",
    birth_calendar_type: "solar",
    birth_year: "",
    birth_month: "",
    birth_day: "",
    is_lunar_leap_month: false,
    is_alive: true,
    deceased_date: "",
    phone: "",
    address_base: "",
    address_detail: "",
    memo: "",
    birth_order: "",
  };
}

export function createPersonFormValuesFromPerson(person: Person): PersonFormValues {
  const calendarType = person.birth_calendar_type === "lunar" ? "lunar" : "solar";
  const birthDateInput =
    calendarType === "lunar"
      ? person.birth_date_lunar ?? person.birth_date ?? ""
      : person.birth_date_solar ?? person.birth_date ?? "";
  const birthDateParts = splitIsoDate(birthDateInput);
  const addressParts = splitAddress(person.address);

  return {
    full_name: person.full_name,
    gender: person.gender ?? "",
    birth_calendar_type: calendarType,
    birth_year: birthDateParts.year,
    birth_month: birthDateParts.month,
    birth_day: birthDateParts.day,
    is_lunar_leap_month: Boolean(person.is_lunar_leap_month),
    is_alive: person.is_alive,
    deceased_date: person.deceased_date ?? "",
    phone: person.phone ?? "",
    address_base: addressParts.base,
    address_detail: addressParts.detail,
    memo: person.memo ?? "",
    birth_order: person.birth_order === null ? "" : String(person.birth_order),
  };
}

export function validatePersonFormValues(
  values: PersonFormValues,
  options?: {
    requireBirthOrder?: boolean;
  },
) {
  if (!values.full_name.trim()) {
    return "이름은 필수입니다.";
  }

  const birthDateInput = joinDateParts(values.birth_year, values.birth_month, values.birth_day);

  if (!values.birth_calendar_type) {
    return "달력 구분을 선택해 주세요.";
  }

  if (hasAnyBirthDatePart(values) && !birthDateInput) {
    return "생년월일은 연도, 월, 일을 모두 숫자로 입력해 주세요.";
  }

  if (birthDateInput && !isIsoDate(birthDateInput)) {
    return "생년월일은 올바른 날짜로 입력해 주세요.";
  }

  if (!values.is_alive && values.deceased_date && !isIsoDate(values.deceased_date)) {
    return "별세일은 YYYY-MM-DD 형식으로 입력해 주세요.";
  }

  if (!values.is_alive && !values.deceased_date) {
    return "고인인 경우 별세일을 입력해 주세요.";
  }

  if (options?.requireBirthOrder && values.birth_order) {
    const birthOrder = Number(values.birth_order);

    if (!Number.isInteger(birthOrder) || birthOrder <= 0) {
      return "출생 순서는 1 이상 정수로 입력해 주세요.";
    }
  }

  return null;
}

export function buildPersonUpdatePayload(
  person: Person,
  values: PersonFormValues,
  actorUserId: string | null,
) {
  const normalized = normalizeFormValues(values);
  const timestamp = new Date().toISOString();

  return {
    full_name: normalized.full_name,
    gender: normalized.gender,
    birth_date: normalized.birth_date,
    birth_date_solar: normalized.birth_date_solar,
    birth_date_lunar: normalized.birth_date_lunar,
    birth_calendar_type: normalized.birth_calendar_type,
    is_lunar_leap_month:
      normalized.birth_calendar_type === "lunar" ? normalized.is_lunar_leap_month : false,
    is_alive: normalized.is_alive,
    deceased_date: normalized.is_alive ? null : normalized.deceased_date,
    phone: normalized.phone,
    address: normalized.address,
    memo: normalized.memo,
    updated_at: timestamp,
    updated_by: actorUserId ?? person.updated_by,
  };
}

export function buildChildDraft({
  parent,
  existingPersons,
  values,
  actorUserId,
}: BuildChildDraftParams): PersonInsertDraft {
  const normalized = normalizeFormValues(values);
  const timestamp = new Date().toISOString();
  const generationDepth =
    typeof parent.generation_depth === "number" ? parent.generation_depth + 1 : null;
  const branchCode = computeBranchCodeForChild(parent);

  return buildBasePersonDraft({
    values: normalized,
    actorUserId,
    timestamp,
    generationDepth,
    branchCode,
    familyRoleType: "blood",
    birthOrder: parseBirthOrder(normalized.birth_order),
    internalCode: computeNextBloodInternalCode({
      existingPersons,
      generationDepth,
      branchCode,
      preferredSourceCode: parent.internal_code,
    }),
  });
}

export function buildSpouseDraft({
  targetPerson,
  existingPersons,
  values,
  actorUserId,
}: BuildSpouseDraftParams): PersonInsertDraft {
  const normalized = normalizeFormValues(values);
  const timestamp = new Date().toISOString();
  const generationDepth =
    typeof targetPerson.generation_depth === "number" ? targetPerson.generation_depth : null;
  const branchCode = computeBranchCodeForSpouse(targetPerson);
  const bloodInternalCode = resolveBloodInternalCode(targetPerson);

  return buildBasePersonDraft({
    values: normalized,
    actorUserId,
    timestamp,
    generationDepth,
    branchCode,
    familyRoleType: "spouse",
    birthOrder: null,
    internalCode: computeSpouseInternalCode({
      bloodInternalCode,
      existingPersons,
    }),
  });
}

export function computeBranchCodeForChild(parent: Person): BranchCode {
  return parent.branch_code;
}

export function computeBranchCodeForSpouse(targetPerson: Person): BranchCode {
  return targetPerson.branch_code;
}

export function computeNextBloodInternalCode(params: {
  existingPersons: Person[];
  generationDepth: number | null;
  branchCode: BranchCode;
  preferredSourceCode?: string | null;
}) {
  const familyCode = extractFamilyCode(params.preferredSourceCode, params.existingPersons);
  const nextSequence = computeNextBloodSequence({
    existingPersons: params.existingPersons,
    familyCode,
    generationDepth: params.generationDepth,
    branchCode: params.branchCode,
  });

  return `${familyCode}-${params.generationDepth ?? 0}-${params.branchCode}-${String(nextSequence).padStart(3, "0")}`;
}

export function computeSpouseInternalCode(params: {
  bloodInternalCode: string;
  existingPersons: Person[];
}) {
  const spouseInternalCode = `${params.bloodInternalCode}s`;

  if (
    params.existingPersons.some((person) => person.internal_code === spouseInternalCode)
  ) {
    throw new Error(`배우자 internal_code 중복: ${spouseInternalCode}`);
  }

  return spouseInternalCode;
}

export function incrementBloodInternalCode(internalCode: string) {
  const matched = internalCode.match(/^(.*-)(\d{3})$/);

  if (!matched) {
    throw new Error(`혈족 internal_code 증가 실패: ${internalCode}`);
  }

  const nextSequence = Number(matched[2]) + 1;
  return `${matched[1]}${String(nextSequence).padStart(3, "0")}`;
}

function buildBasePersonDraft(params: {
  values: NormalizedPersonFormValues;
  actorUserId: string | null;
  timestamp: string;
  generationDepth: number | null;
  branchCode: BranchCode;
  familyRoleType: FamilyRoleType;
  birthOrder: number | null;
  internalCode: string;
}): PersonInsertDraft {
  return {
    full_name: params.values.full_name,
    hanja_name: null,
    gender: params.values.gender,
    birth_date: params.values.birth_date,
    generation_depth: params.generationDepth,
    internal_code: params.internalCode,
    phone: params.values.phone,
    email: null,
    address: params.values.address,
    region: null,
    profile_image_url: null,
    is_alive: params.values.is_alive,
    deceased_date: params.values.is_alive ? null : params.values.deceased_date,
    deceased_note: null,
    is_visible: true,
    memo: params.values.memo,
    created_at: params.timestamp,
    updated_at: params.timestamp,
    created_by: params.actorUserId,
    updated_by: params.actorUserId,
    branch_code: params.branchCode,
    family_role_type: params.familyRoleType,
    birth_order: params.birthOrder,
    birth_date_solar: params.values.birth_date_solar,
    birth_date_lunar: params.values.birth_date_lunar,
    birth_calendar_type: params.values.birth_calendar_type,
    is_lunar_leap_month:
      params.values.birth_calendar_type === "lunar"
        ? params.values.is_lunar_leap_month
        : false,
  };
}

function normalizeFormValues(values: PersonFormValues): NormalizedPersonFormValues {
  const birthYear = values.birth_year.trim();
  const birthMonth = values.birth_month.trim();
  const birthDay = values.birth_day.trim();
  const birthDateInput = joinDateParts(birthYear, birthMonth, birthDay);
  const birthCalendarType = values.birth_calendar_type === "lunar" ? "lunar" : "solar";

  return {
    full_name: values.full_name.trim(),
    gender: normalizeGender(values.gender),
    birth_calendar_type: birthCalendarType,
    birth_year: birthYear,
    birth_month: birthMonth,
    birth_day: birthDay,
    birth_date_solar: birthCalendarType === "solar" ? birthDateInput : null,
    birth_date_lunar: birthCalendarType === "lunar" ? birthDateInput : null,
    birth_date: birthDateInput,
    is_lunar_leap_month: birthCalendarType === "lunar" ? values.is_lunar_leap_month : false,
    is_alive: Boolean(values.is_alive),
    deceased_date: normalizeOptionalText(values.deceased_date),
    phone: normalizeOptionalText(values.phone),
    address: joinAddressParts(values.address_base, values.address_detail),
    memo: normalizeOptionalText(values.memo),
    birth_order: values.birth_order.trim(),
  };
}

function normalizeGender(gender: PersonFormValues["gender"]): Person["gender"] {
  if (gender === "male" || gender === "female" || gender === "unknown") {
    return gender;
  }

  return null;
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseBirthOrder(value: string) {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function computeNextBloodSequence(params: {
  existingPersons: Person[];
  familyCode: string;
  generationDepth: number | null;
  branchCode: BranchCode;
}) {
  const sequences = params.existingPersons
    .filter((person) => person.family_role_type === "blood")
    .map((person) => parseBloodInternalCode(person.internal_code))
    .filter((parsed): parsed is ParsedBloodInternalCode => Boolean(parsed))
    .filter(
      (parsed) =>
        parsed.familyCode === params.familyCode &&
        parsed.generationDepth === (params.generationDepth ?? 0) &&
        parsed.branchCode === params.branchCode,
    )
    .map((parsed) => parsed.sequence);

  if (sequences.length === 0) {
    return 1;
  }

  return Math.max(...sequences) + 1;
}

function extractFamilyCode(preferredSourceCode: string | null | undefined, existingPersons: Person[]) {
  const parsedPreferred = preferredSourceCode
    ? parseBloodInternalCode(stripSpouseSuffix(preferredSourceCode))
    : null;

  if (parsedPreferred) {
    return parsedPreferred.familyCode;
  }

  const parsedExisting = existingPersons
    .map((person) => parseBloodInternalCode(person.internal_code))
    .find((parsed): parsed is ParsedBloodInternalCode => Boolean(parsed));

  return parsedExisting?.familyCode ?? DEFAULT_FAMILY_CODE;
}

function resolveBloodInternalCode(person: Person) {
  if (person.family_role_type !== "blood") {
    throw new Error("배우자 추가는 blood person 기준으로만 가능합니다.");
  }

  const baseInternalCode = stripSpouseSuffix(person.internal_code);

  if (!parseBloodInternalCode(baseInternalCode)) {
    throw new Error(`혈족 internal_code 형식이 올바르지 않습니다: ${person.internal_code}`);
  }

  return baseInternalCode;
}

function stripSpouseSuffix(internalCode: string) {
  return internalCode.endsWith("s") ? internalCode.slice(0, -1) : internalCode;
}

function parseBloodInternalCode(internalCode: string): ParsedBloodInternalCode | null {
  const matched = internalCode.match(/^([A-Z]+)-(\d+)-(ROOT|BR0[1-8])-(\d{3})$/);

  if (!matched) {
    return null;
  }

  return {
    familyCode: matched[1],
    generationDepth: Number(matched[2]),
    branchCode: matched[3] as BranchCode,
    sequence: Number(matched[4]),
  };
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function splitIsoDate(value: string | null) {
  if (!value || !isIsoDate(value)) {
    return {
      year: "",
      month: "",
      day: "",
    };
  }

  const [year, month, day] = value.split("-");

  return {
    year,
    month,
    day,
  };
}

function splitAddress(value: string | null) {
  if (!value) {
    return {
      base: "",
      detail: "",
    };
  }

  const [baseAddress, ...rest] = value.split("\n");
  const detailAddress = rest.join("\n").trim();

  return {
    base: baseAddress?.trim() ?? "",
    detail: detailAddress,
  };
}

function joinAddressParts(base: string, detail: string) {
  const normalizedBase = base.trim();
  const normalizedDetail = detail.trim();

  if (!normalizedBase && !normalizedDetail) {
    return null;
  }

  if (!normalizedBase) {
    return normalizedDetail || null;
  }

  return normalizedDetail ? `${normalizedBase}\n${normalizedDetail}` : normalizedBase;
}

function hasAnyBirthDatePart(values: PersonFormValues) {
  return Boolean(
    values.birth_year.trim() || values.birth_month.trim() || values.birth_day.trim(),
  );
}

function joinDateParts(year: string, month: string, day: string) {
  const normalizedYear = year.trim();
  const normalizedMonth = month.trim();
  const normalizedDay = day.trim();

  if (!normalizedYear && !normalizedMonth && !normalizedDay) {
    return null;
  }

  if (
    !/^\d{4}$/.test(normalizedYear) ||
    !/^\d{1,2}$/.test(normalizedMonth) ||
    !/^\d{1,2}$/.test(normalizedDay)
  ) {
    return null;
  }

  const paddedMonth = normalizedMonth.padStart(2, "0");
  const paddedDay = normalizedDay.padStart(2, "0");
  const candidate = `${normalizedYear}-${paddedMonth}-${paddedDay}`;

  if (!isRealDate(candidate)) {
    return null;
  }

  return candidate;
}

function isRealDate(value: string) {
  if (!isIsoDate(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
