import { buildPersonRelationsById } from "@/lib/family/tree-adapter";
import type { Person, Relationship, UserProfile } from "@/lib/types";

export type PersonActionPermissions = {
  canEdit: boolean;
  canAddChild: boolean;
  canAddSpouse: boolean;
};

export function isSuperAdmin(profile: UserProfile | null | undefined) {
  return profile?.role === "super_admin";
}

export function isBranchRepresentative(profile: UserProfile | null | undefined) {
  return profile?.role === "branch_admin" && Boolean(profile.person_id);
}

export function isBranchAdmin(profile: UserProfile | null | undefined) {
  return profile?.role === "branch_admin";
}

export function isMember(profile: UserProfile | null | undefined) {
  return profile?.role === "member";
}

export function isSelfEditable(
  currentUserPersonId: string | null | undefined,
  targetPersonId: string,
) {
  return Boolean(currentUserPersonId) && currentUserPersonId === targetPersonId;
}

export function getBranchRepresentativeEditableScope(
  profile: UserProfile | null | undefined,
  persons: Person[],
  relationships: Relationship[],
) {
  const editableIds = new Set<string>();

  if (!profile?.person_id || profile.role !== "branch_admin") {
    return editableIds;
  }

  const personById = new Map(persons.map((person) => [person.id, person]));
  const representative = personById.get(profile.person_id);

  if (!representative) {
    return editableIds;
  }

  const relationsById = buildPersonRelationsById(persons, relationships);
  const branchCode = representative.branch_code;
  const representativeRelations = relationsById[representative.id];
  const parentIds = new Set(
    (representativeRelations?.parents ?? [])
      .filter((person) => isBranchBloodPerson(person, branchCode))
      .map((person) => person.id),
  );

  const siblingIds = new Set<string>([representative.id]);

  parentIds.forEach((parentId) => {
    const parentChildren = relationsById[parentId]?.children ?? [];

    parentChildren
      .filter((person) => isBranchBloodPerson(person, branchCode))
      .forEach((person) => siblingIds.add(person.id));
  });

  const childIds = new Set<string>();

  siblingIds.forEach((siblingId) => {
    const children = relationsById[siblingId]?.children ?? [];

    children
      .filter((person) => isBranchBloodPerson(person, branchCode))
      .forEach((person) => childIds.add(person.id));
  });

  const grandchildIds = new Set<string>();

  childIds.forEach((childId) => {
    const grandchildren = relationsById[childId]?.children ?? [];

    grandchildren
      .filter((person) => isBranchBloodPerson(person, branchCode))
      .forEach((person) => grandchildIds.add(person.id));
  });

  const allowedBloodIds = new Set<string>([
    ...parentIds,
    ...siblingIds,
    ...childIds,
    ...grandchildIds,
  ]);

  allowedBloodIds.forEach((personId) => editableIds.add(personId));

  allowedBloodIds.forEach((bloodPersonId) => {
    const spouses = relationsById[bloodPersonId]?.spouses ?? [];

    spouses.forEach((spouse) => {
      if (spouse.branch_code === branchCode || spouse.family_role_type === "spouse") {
        editableIds.add(spouse.id);
      }
    });
  });

  return editableIds;
}

export function canEditPerson(
  profile: UserProfile | null | undefined,
  targetPerson: Person,
  persons: Person[],
  relationships: Relationship[],
) {
  if (!profile) {
    return false;
  }

  if (isSuperAdmin(profile)) {
    return true;
  }

  if (isMember(profile)) {
    return isSelfEditable(profile.person_id, targetPerson.id);
  }

  if (isBranchRepresentative(profile)) {
    return getBranchRepresentativeEditableScope(profile, persons, relationships).has(
      targetPerson.id,
    );
  }

  return false;
}

export function canAddChild(
  profile: UserProfile | null | undefined,
  targetPerson: Person,
  persons: Person[],
  relationships: Relationship[],
) {
  if (!profile) {
    return false;
  }

  if (isSuperAdmin(profile)) {
    return true;
  }

  if (isMember(profile)) {
    return false;
  }

  if (isBranchAdmin(profile)) {
    return true;
  }

  if (isBranchRepresentative(profile)) {
    return getBranchRepresentativeEditableScope(profile, persons, relationships).has(
      targetPerson.id,
    );
  }

  return false;
}

export function canAddSpouse(
  profile: UserProfile | null | undefined,
  targetPerson: Person,
  persons: Person[],
  relationships: Relationship[],
) {
  if (!profile || targetPerson.family_role_type !== "blood") {
    return false;
  }

  if (isSuperAdmin(profile)) {
    return true;
  }

  if (isMember(profile)) {
    return false;
  }

  if (isBranchAdmin(profile)) {
    return true;
  }

  if (isBranchRepresentative(profile)) {
    return getBranchRepresentativeEditableScope(profile, persons, relationships).has(
      targetPerson.id,
    );
  }

  return false;
}

export function getPersonActionPermissions(
  profile: UserProfile | null | undefined,
  targetPerson: Person,
  persons: Person[],
  relationships: Relationship[],
): PersonActionPermissions {
  return {
    canEdit: canEditPerson(profile, targetPerson, persons, relationships),
    canAddChild: canAddChild(profile, targetPerson, persons, relationships),
    canAddSpouse: canAddSpouse(profile, targetPerson, persons, relationships),
  };
}

function isBranchBloodPerson(person: Person, branchCode: Person["branch_code"]) {
  return person.family_role_type === "blood" && person.branch_code === branchCode;
}
