import type { Person, Relationship } from "@/lib/types";

export type FamilyTreeNode = {
  person: Person;
  spouse: Person | null;
  children: FamilyTreeNode[];
};

export type FamilyTree = {
  roots: FamilyTreeNode[];
};

function byGenerationThenCode(a: Person, b: Person) {
  const generationA = a.generation ?? 999;
  const generationB = b.generation ?? 999;

  if (generationA !== generationB) {
    return generationA - generationB;
  }

  return a.internal_code.localeCompare(b.internal_code);
}

export function buildFamilyTree(persons: Person[], relationships: Relationship[]): FamilyTree {
  const personById = new Map(persons.map((person) => [person.id, person]));
  const spouseByPersonId = new Map<string, string>();
  const childrenByParentId = new Map<string, string[]>();
  const childIds = new Set<string>();

  relationships.forEach((relationship) => {
    if (relationship.relationship_type === "spouse") {
      spouseByPersonId.set(relationship.from_person_id, relationship.to_person_id);
      spouseByPersonId.set(relationship.to_person_id, relationship.from_person_id);
      return;
    }

    const parentId =
      relationship.relationship_type === "parent"
        ? relationship.from_person_id
        : relationship.to_person_id;
    const childId =
      relationship.relationship_type === "parent"
        ? relationship.to_person_id
        : relationship.from_person_id;

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
      .sort(byGenerationThenCode)
      .map(createNode);

    return {
      person,
      spouse,
      children,
    };
  }

  const roots = persons
    .filter((person) => !childIds.has(person.id) && person.family_role_type !== "spouse")
    .sort(byGenerationThenCode)
    .map(createNode);

  const orphanRoots = persons
    .filter((person) => !visited.has(person.id) && person.family_role_type !== "spouse")
    .sort(byGenerationThenCode)
    .map(createNode);

  return {
    roots: [...roots, ...orphanRoots],
  };
}
