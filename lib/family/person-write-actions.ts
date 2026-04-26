"use server";

import { revalidatePath } from "next/cache";

import {
  buildChildDraft,
  buildPersonUpdatePayload,
  buildSpouseDraft,
  incrementBloodInternalCode,
  validatePersonFormValues,
} from "@/lib/family/person-write-adapter";
import { createClient } from "@/lib/supabase/server";
import type {
  Person,
  PersonFormValues,
  PersonWriteActionResult,
  Relationship,
} from "@/lib/types";

const PATHS_TO_REVALIDATE = ["/"];

export async function updatePersonAction(
  personId: string,
  values: PersonFormValues,
): Promise<PersonWriteActionResult> {
  const validationMessage = validatePersonFormValues(values);

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage,
    };
  }

  const supabase = await createClient();
  const authResult = await supabase.auth.getUser();
  const user = authResult.data.user;

  if (authResult.error || !user) {
    console.error("[person write] update auth failed", authResult.error?.message ?? "no user");
    return {
      ok: false,
      message: "로그인 상태를 확인한 뒤 다시 시도해 주세요.",
    };
  }

  const { data: existingPerson, error: personError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", personId)
    .maybeSingle<Person>();

  if (personError || !existingPerson) {
    console.error("[person write] update target lookup failed", {
      personId,
      error: personError?.message ?? "person not found",
    });
    return {
      ok: false,
      message: "수정할 가족 정보를 찾지 못했습니다.",
    };
  }

  const payload = buildPersonUpdatePayload(existingPerson, values, user.id);
  console.info("[person write] update payload", {
    personId,
    payload,
  });

  const { error } = await supabase.from("persons").update(payload).eq("id", personId);

  if (error) {
    console.error("[person write] update failed", {
      personId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload,
    });

    return {
      ok: false,
      message: buildWriteFailureMessage("수정 저장", error),
    };
  }

  revalidateFamilyPaths();

  return {
    ok: true,
    message: "가족 정보를 수정했습니다.",
    personId,
  };
}

export async function addChildAction(
  parentId: string,
  values: PersonFormValues,
): Promise<PersonWriteActionResult> {
  const validationMessage = validatePersonFormValues(values, {
    requireBirthOrder: true,
  });

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage,
    };
  }

  const supabase = await createClient();
  const authResult = await supabase.auth.getUser();
  const user = authResult.data.user;

  if (authResult.error || !user) {
    console.error("[person write] child auth failed", authResult.error?.message ?? "no user");
    return {
      ok: false,
      message: "로그인 상태를 확인한 뒤 다시 시도해 주세요.",
    };
  }

  const { data: parentPerson, error: parentError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", parentId)
    .maybeSingle<Person>();

  if (parentError || !parentPerson) {
    console.error("[person write] child parent lookup failed", {
      parentId,
      error: parentError?.message ?? "parent not found",
    });
    return {
      ok: false,
      message: "기준 부모 정보를 찾지 못했습니다.",
    };
  }

  const { data: existingPersons, error: existingPersonsError } = await supabase
    .from("persons")
    .select("*")
    .returns<Person[]>();

  if (existingPersonsError) {
    console.error("[person write] child existing persons lookup failed", {
      parentId,
      branchCode: parentPerson.branch_code,
      code: existingPersonsError.code,
      message: existingPersonsError.message,
      details: existingPersonsError.details,
      hint: existingPersonsError.hint,
    });
    return {
      ok: false,
      message: buildWriteFailureMessage("등록 기준 데이터 조회", existingPersonsError),
    };
  }

  let personDraft;

  try {
    personDraft = buildChildDraft({
      parent: parentPerson,
      existingPersons: existingPersons ?? [],
      values,
      actorUserId: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "child draft build failed";
    console.error("[person write] child draft build failed", {
      parentId,
      message,
    });

    return {
      ok: false,
      message: `자녀 등록 준비 실패: ${message}`,
    };
  }

  console.info("[person write] child draft", {
    parentId,
    generation_depth: personDraft.generation_depth,
    branch_code: personDraft.branch_code,
    internal_code: personDraft.internal_code,
    family_role_type: personDraft.family_role_type,
    birth_order: personDraft.birth_order,
    draft: personDraft,
  });

  const childInsertResult = await insertBloodPersonWithRetries(supabase, personDraft, {
    context: "child",
    referenceId: parentId,
  });
  const insertedPerson = childInsertResult.data;
  const insertPersonError = childInsertResult.error;
  personDraft = childInsertResult.draft;

  if (insertPersonError || !insertedPerson) {
    console.error("[person write] child person insert failed", {
      parentId,
      code: insertPersonError?.code ?? null,
      message: insertPersonError?.message ?? "inserted person missing",
      details: insertPersonError?.details ?? null,
      hint: insertPersonError?.hint ?? null,
      generation_depth: personDraft.generation_depth,
      branch_code: personDraft.branch_code,
      internal_code: personDraft.internal_code,
      relation_type: "parent",
      draft: personDraft,
    });

    return {
      ok: false,
      message: insertPersonError
        ? buildWriteFailureMessage("사람 등록", insertPersonError)
        : "사람 등록 후 응답에서 새 person id를 받지 못했습니다.",
    };
  }

  const relationshipDraft = buildRelationshipDraft({
    personId: parentPerson.id,
    relatedPersonId: insertedPerson.id,
    relationType: "parent",
    actorUserId: user.id,
  });

  console.info("[person write] child relationship draft", {
    parentId,
    newPersonId: insertedPerson.id,
    relation_type: relationshipDraft.relation_type,
    draft: relationshipDraft,
  });

  const { error: relationshipError } = await supabase
    .from("relationships")
    .insert(relationshipDraft);

  if (relationshipError) {
    console.error("[person write] child relationship insert failed", {
      parentId,
      newPersonId: insertedPerson.id,
      code: relationshipError.code,
      message: relationshipError.message,
      details: relationshipError.details,
      hint: relationshipError.hint,
      relation_type: relationshipDraft.relation_type,
      draft: relationshipDraft,
    });

    const rollbackResult = await supabase.from("persons").delete().eq("id", insertedPerson.id);

    if (rollbackResult.error) {
      console.error("[person write] child rollback failed", {
        insertedPersonId: insertedPerson.id,
        code: rollbackResult.error.code,
        message: rollbackResult.error.message,
        details: rollbackResult.error.details,
        hint: rollbackResult.error.hint,
      });
    }

    return {
      ok: false,
      message: buildWriteFailureMessage("관계 등록", relationshipError),
    };
  }

  revalidateFamilyPaths();

  return {
    ok: true,
    message: "자녀를 등록했습니다.",
    personId: insertedPerson.id,
  };
}

export async function addSpouseAction(
  targetPersonId: string,
  values: PersonFormValues,
): Promise<PersonWriteActionResult> {
  const validationMessage = validatePersonFormValues(values);

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage,
    };
  }

  const supabase = await createClient();
  const authResult = await supabase.auth.getUser();
  const user = authResult.data.user;

  if (authResult.error || !user) {
    console.error("[person write] spouse auth failed", authResult.error?.message ?? "no user");
    return {
      ok: false,
      message: "로그인 상태를 확인한 뒤 다시 시도해 주세요.",
    };
  }

  const { data: targetPerson, error: targetPersonError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", targetPersonId)
    .maybeSingle<Person>();

  if (targetPersonError || !targetPerson) {
    console.error("[person write] spouse target lookup failed", {
      targetPersonId,
      error: targetPersonError?.message ?? "target not found",
    });
    return {
      ok: false,
      message: "기준 배우자 대상 정보를 찾지 못했습니다.",
    };
  }

  const { data: existingPersons, error: existingPersonsError } = await supabase
    .from("persons")
    .select("*")
    .returns<Person[]>();
  const { data: existingRelationships, error: existingRelationshipsError } = await supabase
    .from("relationships")
    .select("*")
    .returns<Relationship[]>();

  if (existingPersonsError || existingRelationshipsError) {
    console.error("[person write] spouse context lookup failed", {
      targetPersonId,
      existingPersonsError: serializeSupabaseError(existingPersonsError),
      existingRelationshipsError: serializeSupabaseError(existingRelationshipsError),
    });
    return {
      ok: false,
      message:
        buildWriteFailureMessage("등록 기준 데이터 조회", existingPersonsError) ??
        buildWriteFailureMessage("관계 데이터 조회", existingRelationshipsError),
    };
  }

  if (hasSpouseRelationship(targetPerson.id, existingRelationships ?? [])) {
    return {
      ok: false,
      message: "이미 배우자 관계가 등록된 가구입니다.",
    };
  }

  let personDraft;

  try {
    personDraft = buildSpouseDraft({
      targetPerson,
      existingPersons: existingPersons ?? [],
      values,
      actorUserId: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "spouse draft build failed";
    console.error("[person write] spouse draft build failed", {
      targetPersonId,
      message,
    });

    return {
      ok: false,
      message: `배우자 등록 준비 실패: ${message}`,
    };
  }

  console.info("[person write] spouse draft", {
    targetPersonId,
    generation_depth: personDraft.generation_depth,
    branch_code: personDraft.branch_code,
    internal_code: personDraft.internal_code,
    family_role_type: personDraft.family_role_type,
    draft: personDraft,
  });

  const { data: insertedPerson, error: insertPersonError } = await supabase
    .from("persons")
    .insert(personDraft)
    .select("*")
    .maybeSingle<Person>();

  if (insertPersonError || !insertedPerson) {
    console.error("[person write] spouse person insert failed", {
      targetPersonId,
      code: insertPersonError?.code ?? null,
      message: insertPersonError?.message ?? "inserted person missing",
      details: insertPersonError?.details ?? null,
      hint: insertPersonError?.hint ?? null,
      generation_depth: personDraft.generation_depth,
      branch_code: personDraft.branch_code,
      internal_code: personDraft.internal_code,
      relation_type: "spouse",
      draft: personDraft,
    });

    return {
      ok: false,
      message: insertPersonError
        ? isDuplicateInternalCodeError(insertPersonError)
          ? "배우자 internal_code가 이미 존재합니다. 기존 배우자 등록 여부를 확인해 주세요."
          : buildWriteFailureMessage("사람 등록", insertPersonError)
        : "사람 등록 후 응답에서 새 person id를 받지 못했습니다.",
    };
  }

  const relationshipDraft = buildRelationshipDraft({
    personId: targetPerson.id,
    relatedPersonId: insertedPerson.id,
    relationType: "spouse",
    actorUserId: user.id,
  });

  console.info("[person write] spouse relationship draft", {
    targetPersonId,
    newPersonId: insertedPerson.id,
    relation_type: relationshipDraft.relation_type,
    draft: relationshipDraft,
  });

  const { error: relationshipError } = await supabase
    .from("relationships")
    .insert(relationshipDraft);

  if (relationshipError) {
    console.error("[person write] spouse relationship insert failed", {
      targetPersonId,
      newPersonId: insertedPerson.id,
      code: relationshipError.code,
      message: relationshipError.message,
      details: relationshipError.details,
      hint: relationshipError.hint,
      relation_type: relationshipDraft.relation_type,
      draft: relationshipDraft,
    });

    const rollbackResult = await supabase.from("persons").delete().eq("id", insertedPerson.id);

    if (rollbackResult.error) {
      console.error("[person write] spouse rollback failed", {
        insertedPersonId: insertedPerson.id,
        code: rollbackResult.error.code,
        message: rollbackResult.error.message,
        details: rollbackResult.error.details,
        hint: rollbackResult.error.hint,
      });
    }

    return {
      ok: false,
      message: buildWriteFailureMessage("관계 등록", relationshipError),
    };
  }

  revalidateFamilyPaths();

  return {
    ok: true,
    message: "배우자를 등록했습니다.",
    personId: insertedPerson.id,
  };
}

function buildRelationshipDraft(params: {
  personId: string;
  relatedPersonId: string;
  relationType: Relationship["relation_type"];
  actorUserId: string | null;
}) {
  return {
    person_id: params.personId,
    related_person_id: params.relatedPersonId,
    relation_type: params.relationType,
    is_primary: true,
    created_at: new Date().toISOString(),
    created_by: params.actorUserId,
  };
}

function hasSpouseRelationship(personId: string, relationships: Relationship[]) {
  return relationships.some(
    (relationship) =>
      relationship.relation_type === "spouse" &&
      (relationship.person_id === personId || relationship.related_person_id === personId),
  );
}

function revalidateFamilyPaths() {
  PATHS_TO_REVALIDATE.forEach((path) => {
    revalidatePath(path);
  });
}

type PersonInsertDraft = Omit<Person, "id">;

async function insertBloodPersonWithRetries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  initialDraft: PersonInsertDraft,
  options: {
    context: "child";
    referenceId: string;
  },
) {
  let currentDraft = {
    ...initialDraft,
  };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await supabase
      .from("persons")
      .insert(currentDraft)
      .select("*")
      .maybeSingle<Person>();

    if (!result.error && result.data) {
      if (attempt > 0) {
        console.info("[person write] blood internal_code retry succeeded", {
          context: options.context,
          referenceId: options.referenceId,
          internal_code: currentDraft.internal_code,
          attempt: attempt + 1,
        });
      }

      return {
        data: result.data,
        error: null,
        draft: currentDraft,
      };
    }

    if (!isDuplicateInternalCodeError(result.error)) {
      return {
        data: result.data ?? null,
        error: result.error,
        draft: currentDraft,
      };
    }

    console.warn("[person write] blood internal_code duplicate, retrying", {
      context: options.context,
      referenceId: options.referenceId,
      internal_code: currentDraft.internal_code,
      attempt: attempt + 1,
    });

    currentDraft = {
      ...currentDraft,
      internal_code: incrementBloodInternalCode(currentDraft.internal_code),
    };
  }

  return {
    data: null,
    error: {
      message: "internal_code 재시도 한도를 초과했습니다.",
      details: currentDraft.internal_code,
      hint: "persons_internal_code_key",
    },
    draft: currentDraft,
  };
}

function buildWriteFailureMessage(
  stage: string,
  error:
    | {
        code?: string | null;
        message: string;
        details?: string | null;
        hint?: string | null;
      }
    | null
    | undefined,
) {
  if (!error) {
    return `${stage} 중 알 수 없는 오류가 발생했습니다.`;
  }

  const reason = [error.message, error.details, error.hint].filter(Boolean).join(" / ");
  return `${stage} 실패: ${reason}`;
}

function serializeSupabaseError(
  error:
    | {
        code?: string | null;
        message: string;
        details?: string | null;
        hint?: string | null;
      }
    | null
    | undefined,
) {
  if (!error) {
    return null;
  }

  return {
    code: error.code ?? null,
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}

function isDuplicateInternalCodeError(
  error:
    | {
        code?: string | null;
        message: string;
        details?: string | null;
        hint?: string | null;
      }
    | null
    | undefined,
) {
  if (!error) {
    return false;
  }

  const joinedText = [error.code, error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ");

  return joinedText.includes("persons_internal_code_key");
}
