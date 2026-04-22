import type { Person, Relationship } from "@/lib/types";

export type FamilyGenerationPerson = {
  person: Person;
  spouseNames: string[];
  parentNames: string[];
  childCount: number;
};

export type FamilyGenerationGroup = {
  generationDepth: number | null;
  label: string;
  persons: FamilyGenerationPerson[];
};

export type FamilyTree = {
  generations: FamilyGenerationGroup[];
};

function sortPeople(a: Person, b: Person) {
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

  const birthDateCompare = (a.birth_date ?? "").localeCompare(b.birth_date ?? "");

  if (birthDateCompare !== 0) {
    return birthDateCompare;
  }

  return a.full_name.localeCompare(b.full_name);
}

function uniqueNames(names: string[]) {
  return [...new Set(names)].filter(Boolean);
}

export function buildFamilyTree(persons: Person[], relationships: Relationship[]): FamilyTree {
  const personById = new Map(persons.map((person) => [person.id, person]));
  const dedupedPersons = [...personById.values()].sort(sortPeople);
  const spouseNamesByPersonId = new Map<string, string[]>();
  const parentNamesByPersonId = new Map<string, string[]>();
  const childCountByPersonId = new Map<string, number>();

  relationships.forEach((relationship) => {
    const person = personById.get(relationship.person_id);
    const relatedPerson = personById.get(relationship.related_person_id);

    if (!person || !relatedPerson) {
      return;
    }

    if (relationship.relation_type === "spouse") {
      spouseNamesByPersonId.set(relationship.person_id, [
        ...(spouseNamesByPersonId.get(relationship.person_id) ?? []),
        relatedPerson.full_name,
      ]);
      spouseNamesByPersonId.set(relationship.related_person_id, [
        ...(spouseNamesByPersonId.get(relationship.related_person_id) ?? []),
        person.full_name,
      ]);
      return;
    }

    const parent =
      relationship.relation_type === "parent" ? person : relatedPerson;
    const child =
      relationship.relation_type === "parent" ? relatedPerson : person;

    parentNamesByPersonId.set(child.id, [
      ...(parentNamesByPersonId.get(child.id) ?? []),
      parent.full_name,
    ]);
    childCountByPersonId.set(parent.id, (childCountByPersonId.get(parent.id) ?? 0) + 1);
  });

  const groupsByDepth = new Map<number | null, FamilyGenerationPerson[]>();

  dedupedPersons.forEach((person) => {
    const depth = person.generation_depth;
    const groupPersons = groupsByDepth.get(depth) ?? [];

    groupsByDepth.set(depth, [
      ...groupPersons,
      {
        person,
        spouseNames: uniqueNames(spouseNamesByPersonId.get(person.id) ?? []),
        parentNames: uniqueNames(parentNamesByPersonId.get(person.id) ?? []),
        childCount: childCountByPersonId.get(person.id) ?? 0,
      },
    ]);
  });

  const generations = [...groupsByDepth.entries()]
    .sort(([depthA], [depthB]) => (depthA ?? 999) - (depthB ?? 999))
    .map(([generationDepth, groupPersons]) => ({
      generationDepth,
      label: generationDepth === null ? "세대 미지정" : `${generationDepth}세대`,
      persons: groupPersons.sort((a, b) => sortPeople(a.person, b.person)),
    }));

  return {
    generations,
  };
}

export function countFamilyTreeNodes(tree: FamilyTree) {
  return tree.generations.reduce(
    (total, generation) => total + generation.persons.length,
    0,
  );
}
