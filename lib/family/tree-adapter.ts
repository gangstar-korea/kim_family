import type { Person, Relationship } from "@/lib/types";

export type FamilyTreeNode = {
  person: Person;
  spouse: Person | null;
  children: FamilyTreeNode[];
};

export type FamilyTree = {
  roots: FamilyTreeNode[];
};

function byBranchThenCode(a: Person, b: Person) {
  const depthA = a.generation_depth ?? 999;
  const depthB = b.generation_depth ?? 999;

  if (depthA !== depthB) {
    return depthA - depthB;
  }

  const orderA = a.birth_order ?? 999;
  const orderB = b.birth_order ?? 999;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  const dateCompare = (a.birth_date ?? "").localeCompare(b.birth_date ?? "");

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return a.full_name.localeCompare(b.full_name);
}

export function buildFamilyTree(persons: Person[], relationships: Relationship[]): FamilyTree {
  const personById = new Map(persons.map((person) => [person.id, person]));
  const spouseByPersonId = new Map<string, string>();
  const childrenByParentId = new Map<string, string[]>();
  const childIds = new Set<string>();

  relationships.forEach((relationship) => {
    if (relationship.relation_type === "spouse") {
      spouseByPersonId.set(relationship.person_id, relationship.related_person_id);
      spouseByPersonId.set(relationship.related_person_id, relationship.person_id);
      return;
    }

    const parentId =
      relationship.relation_type === "parent"
        ? relationship.person_id
        : relationship.related_person_id;
    const childId =
      relationship.relation_type === "parent"
        ? relationship.related_person_id
        : relationship.person_id;

    childIds.add(childId);
    const siblings = childrenByParentId.get(parentId) ?? [];
    childrenByParentId.set(parentId, [...siblings, childId]);
  });

  const visited = new Set<string>();

  function createNode(person: Person): FamilyTreeNode {
    visited.add(person.id);

    const spouseId = spouseByPersonId.get(person.id);
    const spouse = spouseId ? personById.get(spouseId) ?? null : null;

    if (spouse) {
      visited.add(spouse.id);
    }

    const childSourceIds = [person.id, spouse?.id].filter(
      (value): value is string => Boolean(value),
    );
    const childIdSet = new Set(
      childSourceIds.flatMap((parentId) => childrenByParentId.get(parentId) ?? []),
    );

    const children = [...childIdSet]
      .map((childId) => personById.get(childId))
      .filter((child): child is Person => Boolean(child))
      .sort(byBranchThenCode)
      .map(createNode);

    return {
      person,
      spouse,
      children,
    };
  }

  const roots = persons
    .filter((person) => !childIds.has(person.id) && person.family_role_type !== "spouse")
    .sort(byBranchThenCode)
    .map(createNode);

  const orphanRoots = persons
    .filter((person) => !visited.has(person.id) && person.family_role_type !== "spouse")
    .sort(byBranchThenCode)
    .map(createNode);

  return {
    roots: [...roots, ...orphanRoots],
  };
}
