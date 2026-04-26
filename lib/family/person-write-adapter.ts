import type {
  BranchCode,
  FamilyRoleType,
  Person,
  PersonFormValues,
} from "@/lib/types";

const DEFAULT_INTERNAL_CODE_PREFIX = "PERSON-";
const DEFAULT_CODE_WIDTH = 2;

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

export function createEmptyPersonFormValues(): PersonFormValues {
  return {
    full_name: "",
    gender: "",
    birth_date: "",
    is_alive: true,
    deceased_date: "",
    phone: "",
    address: "",
    memo: "",
    region: "",
    birth_order: "",
  };
}

export function createPersonFormValuesFromPerson(person: Person): PersonFormValues {
  return {
    full_name: person.full_name,
    gender: person.gender ?? "",
    birth_date: person.birth_date ?? "",
    is_alive: person.is_alive,
    deceased_date: person.deceased_date ?? "",
    phone: person.phone ?? "",
    address: person.address ?? "",
    memo: person.memo ?? "",
    region: person.region ?? "",
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
    return "\uC774\uB984\uC740 \uD544\uC218\uC785\uB2C8\uB2E4.";
  }

  if (values.birth_date && !isIsoDate(values.birth_date)) {
    return "\uC0DD\uB144\uC6D4\uC77C\uC740 YYYY-MM-DD \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
  }

  if (!values.is_alive && values.deceased_date && !isIsoDate(values.deceased_date)) {
    return "\uBCC4\uC138\uC77C\uC740 YYYY-MM-DD \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
  }

  if (!values.is_alive && !values.deceased_date) {
    return "\uACE0\uC778\uC778 \uACBD\uC6B0 \uBCC4\uC138\uC77C\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
  }

  if (options?.requireBirthOrder && values.birth_order) {
    const birthOrder = Number(values.birth_order);

    if (!Number.isInteger(birthOrder) || birthOrder <= 0) {
      return "\uCD9C\uC0DD \uC21C\uC11C\uB294 1 \uC774\uC0C1 \uC815\uC218\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
    }
  }

  return null;
}

export function buildPersonUpdatePayload(person: Person, values: PersonFormValues, actorUserId: string | null) {
  const normalized = normalizeFormValues(values);
  const timestamp = new Date().toISOString();

  return {
    full_name: normalized.full_name,
    gender: normalized.gender,
    birth_date: normalized.birth_date,
    is_alive: normalized.is_alive,
    deceased_date: normalized.is_alive ? null : normalized.deceased_date,
    phone: normalized.phone,
    address: normalized.address,
    memo: normalized.memo,
    region: normalized.region,
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
    internalCode: computeNextInternalCode({
      existingPersons,
      branchCode,
      generationDepth,
      familyRoleType: "blood",
      preferredSeedCode: parent.internal_code,
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

  return buildBasePersonDraft({
    values: normalized,
    actorUserId,
    timestamp,
    generationDepth,
    branchCode,
    familyRoleType: "spouse",
    birthOrder: null,
    internalCode: computeNextInternalCode({
      existingPersons,
      branchCode,
      generationDepth,
      familyRoleType: "spouse",
      preferredSeedCode: targetPerson.internal_code,
    }),
  });
}

export function computeBranchCodeForChild(parent: Person): BranchCode {
  return parent.branch_code;
}

export function computeBranchCodeForSpouse(targetPerson: Person): BranchCode {
  return targetPerson.branch_code;
}

export function computeNextInternalCode(params: {
  existingPersons: Person[];
  branchCode: BranchCode;
  generationDepth: number | null;
  familyRoleType: FamilyRoleType;
  preferredSeedCode?: string | null;
}) {
  const comparablePeople = params.existingPersons.filter(
    (person) =>
      person.branch_code === params.branchCode &&
      person.generation_depth === params.generationDepth &&
      person.family_role_type === params.familyRoleType &&
      Boolean(person.internal_code),
  );
  // TODO: Confirm the production internal_code rule with more branch samples.
  // For now, follow the most common existing prefix in the same branch/generation/role.
  const prefixInfo = pickInternalCodePrefix(comparablePeople, params.preferredSeedCode);
  const nextSequence = findNextSequence(comparablePeople, prefixInfo.prefix);

  return `${prefixInfo.prefix}${String(nextSequence).padStart(prefixInfo.width, "0")}`;
}

function buildBasePersonDraft(params: {
  values: ReturnType<typeof normalizeFormValues>;
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
    region: params.values.region,
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
    birth_date_solar: null,
    birth_date_lunar: null,
    birth_calendar_type: null,
    is_lunar_leap_month: null,
  };
}

function normalizeFormValues(values: PersonFormValues) {
  return {
    full_name: values.full_name.trim(),
    gender: normalizeGender(values.gender),
    birth_date: normalizeOptionalText(values.birth_date),
    is_alive: Boolean(values.is_alive),
    deceased_date: normalizeOptionalText(values.deceased_date),
    phone: normalizeOptionalText(values.phone),
    address: normalizeOptionalText(values.address),
    memo: normalizeOptionalText(values.memo),
    region: normalizeOptionalText(values.region),
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

function pickInternalCodePrefix(existingPeople: Person[], preferredSeedCode?: string | null) {
  const prefixCounter = new Map<string, { count: number; width: number }>();

  existingPeople.forEach((person) => {
    const parts = splitInternalCode(person.internal_code);
    const current = prefixCounter.get(parts.prefix);

    prefixCounter.set(parts.prefix, {
      count: (current?.count ?? 0) + 1,
      width: Math.max(current?.width ?? 0, parts.width),
    });
  });

  const bestExistingPrefix = [...prefixCounter.entries()].sort((a, b) => {
    if (b[1].count !== a[1].count) {
      return b[1].count - a[1].count;
    }

    return b[1].width - a[1].width;
  })[0];

  if (bestExistingPrefix) {
    return {
      prefix: bestExistingPrefix[0],
      width: Math.max(bestExistingPrefix[1].width, DEFAULT_CODE_WIDTH),
    };
  }

  if (preferredSeedCode) {
    const preferredParts = splitInternalCode(preferredSeedCode);

    return {
      prefix: preferredParts.prefix,
      width: Math.max(preferredParts.width, DEFAULT_CODE_WIDTH),
    };
  }

  return {
    prefix: DEFAULT_INTERNAL_CODE_PREFIX,
    width: DEFAULT_CODE_WIDTH,
  };
}

function findNextSequence(existingPeople: Person[], prefix: string) {
  const sequences = existingPeople
    .map((person) => splitInternalCode(person.internal_code))
    .filter((parts) => parts.prefix === prefix && parts.sequence !== null)
    .map((parts) => parts.sequence as number);

  if (sequences.length === 0) {
    return 1;
  }

  return Math.max(...sequences) + 1;
}

function splitInternalCode(code: string) {
  const trimmedCode = code.trim();
  const matched = trimmedCode.match(/^(.*?)(\d+)$/);

  if (!matched) {
    return {
      prefix: trimmedCode ? `${trimmedCode}-` : DEFAULT_INTERNAL_CODE_PREFIX,
      sequence: null,
      width: DEFAULT_CODE_WIDTH,
    };
  }

  return {
    prefix: matched[1],
    sequence: Number(matched[2]),
    width: matched[2].length,
  };
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
