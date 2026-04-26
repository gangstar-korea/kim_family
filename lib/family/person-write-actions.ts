"use server";

import { revalidatePath } from "next/cache";

import {
  buildChildDraft,
  buildPersonUpdatePayload,
  buildSpouseDraft,
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "\uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    };
  }

  const { data: existingPerson, error: personError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", personId)
    .maybeSingle<Person>();

  if (personError || !existingPerson) {
    return {
      ok: false,
      message: "\uC218\uC815\uD560 \uAC00\uC871 \uC815\uBCF4\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  const payload = buildPersonUpdatePayload(existingPerson, values, user.id);
  const { error } = await supabase.from("persons").update(payload).eq("id", personId);

  if (error) {
    console.error("[person write] update failed", error.message);
    return {
      ok: false,
      message: "\uC218\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  revalidateFamilyPaths();

  return {
    ok: true,
    message: "\uAC00\uC871 \uC815\uBCF4\uB97C \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4.",
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "\uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    };
  }

  const { data: parentPerson, error: parentError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", parentId)
    .maybeSingle<Person>();

  if (parentError || !parentPerson) {
    return {
      ok: false,
      message: "\uAE30\uC900 \uBD80\uBAA8 \uC815\uBCF4\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  const { data: existingPersons, error: existingPersonsError } = await supabase
    .from("persons")
    .select("*")
    .eq("branch_code", parentPerson.branch_code)
    .returns<Person[]>();

  if (existingPersonsError) {
    console.error("[person write] child existing persons lookup failed", existingPersonsError.message);
    return {
      ok: false,
      message: "\uB4F1\uB85D \uAE30\uC900 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  const personDraft = buildChildDraft({
    parent: parentPerson,
    existingPersons: existingPersons ?? [],
    values,
    actorUserId: user.id,
  });

  const { data: insertedPerson, error: insertPersonError } = await supabase
    .from("persons")
    .insert(personDraft)
    .select("*")
    .maybeSingle<Person>();

  if (insertPersonError || !insertedPerson) {
    console.error("[person write] child insert failed", insertPersonError?.message);
    return {
      ok: false,
      message: "\uC790\uB140 \uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  const relationshipDraft = buildRelationshipDraft({
    personId: parentPerson.id,
    relatedPersonId: insertedPerson.id,
    relationType: "parent",
    actorUserId: user.id,
  });
  const { error: relationshipError } = await supabase
    .from("relationships")
    .insert(relationshipDraft);

  if (relationshipError) {
    console.error("[person write] child relationship insert failed", relationshipError.message);
    await supabase.from("persons").delete().eq("id", insertedPerson.id);

    return {
      ok: false,
      message: "\uC790\uB140 \uAD00\uACC4 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  revalidateFamilyPaths();

  return {
    ok: true,
    message: "\uC790\uB140\uB97C \uB4F1\uB85D\uD588\uC2B5\uB2C8\uB2E4.",
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "\uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    };
  }

  const { data: targetPerson, error: targetPersonError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", targetPersonId)
    .maybeSingle<Person>();

  if (targetPersonError || !targetPerson) {
    return {
      ok: false,
      message: "\uAE30\uC900 \uBC30\uC6B0\uC790 \uB300\uC0C1 \uC815\uBCF4\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  const { data: existingPersons, error: existingPersonsError } = await supabase
    .from("persons")
    .select("*")
    .eq("branch_code", targetPerson.branch_code)
    .returns<Person[]>();
  const { data: existingRelationships, error: existingRelationshipsError } = await supabase
    .from("relationships")
    .select("*")
    .returns<Relationship[]>();

  if (existingPersonsError || existingRelationshipsError) {
    console.error("[person write] spouse context lookup failed", {
      existingPersonsError: existingPersonsError?.message,
      existingRelationshipsError: existingRelationshipsError?.message,
    });
    return {
      ok: false,
      message: "\uB4F1\uB85D \uAE30\uC900 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  if (hasSpouseRelationship(targetPerson.id, existingRelationships ?? [])) {
    return {
      ok: false,
      message: "\uC774\uBBF8 \uBC30\uC6B0\uC790 \uAD00\uACC4\uAC00 \uB4F1\uB85D\uB41C \uAC00\uAD6C\uC785\uB2C8\uB2E4.",
    };
  }

  const personDraft = buildSpouseDraft({
    targetPerson,
    existingPersons: existingPersons ?? [],
    values,
    actorUserId: user.id,
  });
  const { data: insertedPerson, error: insertPersonError } = await supabase
    .from("persons")
    .insert(personDraft)
    .select("*")
    .maybeSingle<Person>();

  if (insertPersonError || !insertedPerson) {
    console.error("[person write] spouse insert failed", insertPersonError?.message);
    return {
      ok: false,
      message: "\uBC30\uC6B0\uC790 \uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  const relationshipDraft = buildRelationshipDraft({
    personId: targetPerson.id,
    relatedPersonId: insertedPerson.id,
    relationType: "spouse",
    actorUserId: user.id,
  });
  const { error: relationshipError } = await supabase
    .from("relationships")
    .insert(relationshipDraft);

  if (relationshipError) {
    console.error("[person write] spouse relationship insert failed", relationshipError.message);
    await supabase.from("persons").delete().eq("id", insertedPerson.id);

    return {
      ok: false,
      message: "\uBC30\uC6B0\uC790 \uAD00\uACC4 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
    };
  }

  revalidateFamilyPaths();

  return {
    ok: true,
    message: "\uBC30\uC6B0\uC790\uB97C \uB4F1\uB85D\uD588\uC2B5\uB2C8\uB2E4.",
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
