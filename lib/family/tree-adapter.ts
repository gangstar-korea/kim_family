import type { Person, Relationship } from "@/lib/types";

export type FamilyUnitMember = {
  person: Person;
  role: "primary" | "spouse";
};

export type FamilyUnit = {
  id: string;
  primary: Person;
  spouses: Person[];
  parentNames: string[];
  childCount: number;
  lineageSortKey: string;
};

export type FamilyGenerationGroup = {
  generationDepth: number | null;
  label: string;
  units: FamilyUnit[];
};

export type FamilyTree = {
  generations: FamilyGenerationGroup[];
};

const UNKNOWN_DEPTH = 999;
const UNKNOWN_ORDER = 999;
const UNKNOWN_DATE = "9999-99-99";
const GENERATION_LABEL = "\uC138\uB300";
const UNKNOWN_GENERATION_LABEL = "\uC138\uB300 \uBBF8\uC9C0\uC815";

function baseSortValue(person: Person) {
  const order = String(person.birth_order ?? UNKNOWN_ORDER).padStart(4, "0");
  const birthDate = person.birth_date ?? UNKNOWN_DATE;

  return `${order}:${birthDate}:${person.full_name}`;
}

function sortPeople(a: Person, b: Person) {
  const depthA = a.generation_depth ?? UNKNOWN_DEPTH;
  const depthB = b.generation_depth ?? UNKNOWN_DEPTH;

  if (depthA !== depthB) {
    return depthA - depthB;
  }

  return baseSortValue(a).localeCompare(baseSortValue(b), "ko");
}

function uniquePeople(people: Person[]) {
  const seen = new Set<string>();

  return people.filter((person) => {
    if (seen.has(person.id)) {
      return false;
    }

    seen.add(person.id);
    return true;
  });
}

function uniqueNames(names: string[]) {
  return [...new Set(names)].filter(Boolean);
}

function relationToParentChild(relationship: Relationship) {
  if (relationship.relation_type === "parent") {
    return {
      parentId: relationship.person_id,
      childId: relationship.related_person_id,
    };
  }

  if (relationship.relation_type === "child") {
    return {
      parentId: relationship.related_person_id,
      childId: relationship.person_id,
    };
  }

  return null;
}

export function buildFamilyTree(persons: Person[], relationships: Relationship[]): FamilyTree {
  const personById = new Map(persons.map((person) => [person.id, person]));
  const spouseIdsByPersonId = new Map<string, string[]>();
  const parentIdsByChildId = new Map<string, string[]>();
  const childIdsByParentId = new Map<string, string[]>();

  relationships.forEach((relationship) => {
    const person = personById.get(relationship.person_id);
    const relatedPerson = personById.get(relationship.related_person_id);

    if (!person || !relatedPerson) {
      return;
    }

    if (relationship.relation_type === "spouse") {
      spouseIdsByPersonId.set(relationship.person_id, [
        ...(spouseIdsByPersonId.get(relationship.person_id) ?? []),
        relationship.related_person_id,
      ]);
      spouseIdsByPersonId.set(relationship.related_person_id, [
        ...(spouseIdsByPersonId.get(relationship.related_person_id) ?? []),
        relationship.person_id,
      ]);
      return;
    }

    const parentChild = relationToParentChild(relationship);

    if (!parentChild) {
      return;
    }

    parentIdsByChildId.set(parentChild.childId, [
      ...(parentIdsByChildId.get(parentChild.childId) ?? []),
      parentChild.parentId,
    ]);
    childIdsByParentId.set(parentChild.parentId, [
      ...(childIdsByParentId.get(parentChild.parentId) ?? []),
      parentChild.childId,
    ]);
  });

  const bloodPeople = [...personById.values()]
    .filter((person) => person.family_role_type === "blood")
    .sort(sortPeople);
  const unitMemberIds = new Set<string>();
  const lineageKeyByPersonId = new Map<string, string>();

  function computeLineageKey(person: Person, visiting = new Set<string>()): string {
    const cached = lineageKeyByPersonId.get(person.id);

    if (cached) {
      return cached;
    }

    const ownKey = `${String(person.generation_depth ?? UNKNOWN_DEPTH).padStart(3, "0")}:${baseSortValue(person)}`;

    if (visiting.has(person.id)) {
      return ownKey;
    }

    visiting.add(person.id);

    const parentKeys = (parentIdsByChildId.get(person.id) ?? [])
      .map((parentId) => personById.get(parentId))
      .filter((parent): parent is Person => Boolean(parent))
      .filter((parent) => parent.family_role_type === "blood")
      .sort(sortPeople)
      .map((parent) => computeLineageKey(parent, new Set(visiting)))
      .sort((a, b) => a.localeCompare(b, "ko"));
    const lineageKey = parentKeys.length > 0 ? `${parentKeys[0]}/${ownKey}` : ownKey;

    lineageKeyByPersonId.set(person.id, lineageKey);
    return lineageKey;
  }

  const bloodUnits: FamilyUnit[] = bloodPeople.map((primary) => {
    const spouses = uniquePeople(
      (spouseIdsByPersonId.get(primary.id) ?? [])
        .map((spouseId) => personById.get(spouseId))
        .filter((spouse): spouse is Person => Boolean(spouse))
        .filter((spouse) => spouse.family_role_type === "spouse")
        .sort(sortPeople),
    );
    const parentNames = uniqueNames(
      (parentIdsByChildId.get(primary.id) ?? [])
        .map((parentId) => personById.get(parentId)?.full_name ?? "")
        .filter(Boolean),
    );
    const childCount = (childIdsByParentId.get(primary.id) ?? []).length;

    unitMemberIds.add(primary.id);
    spouses.forEach((spouse) => unitMemberIds.add(spouse.id));

    return {
      id: primary.id,
      primary,
      spouses,
      parentNames,
      childCount,
      lineageSortKey: computeLineageKey(primary),
    };
  });

  const standaloneSpouseUnits: FamilyUnit[] = [...personById.values()]
    .filter((person) => person.family_role_type === "spouse")
    .filter((person) => !unitMemberIds.has(person.id))
    .sort(sortPeople)
    .map((primary) => ({
      id: primary.id,
      primary,
      spouses: [],
      parentNames: [],
      childCount: 0,
      lineageSortKey: `${String(primary.generation_depth ?? UNKNOWN_DEPTH).padStart(3, "0")}:${baseSortValue(primary)}`,
    }));
  const groupsByDepth = new Map<number | null, FamilyUnit[]>();

  [...bloodUnits, ...standaloneSpouseUnits].forEach((unit) => {
    const depth = unit.primary.generation_depth;
    const groupUnits = groupsByDepth.get(depth) ?? [];

    groupsByDepth.set(depth, [...groupUnits, unit]);
  });

  const generations = [...groupsByDepth.entries()]
    .sort(([depthA], [depthB]) => (depthA ?? UNKNOWN_DEPTH) - (depthB ?? UNKNOWN_DEPTH))
    .map(([generationDepth, groupUnits]) => ({
      generationDepth,
      label:
        generationDepth === null
          ? UNKNOWN_GENERATION_LABEL
          : `${generationDepth}${GENERATION_LABEL}`,
      units: groupUnits.sort((a, b) =>
        a.lineageSortKey.localeCompare(b.lineageSortKey, "ko"),
      ),
    }));

  return {
    generations,
  };
}

export function countFamilyTreeNodes(tree: FamilyTree) {
  return tree.generations.reduce(
    (total, generation) =>
      total +
      generation.units.reduce(
        (unitTotal, unit) => unitTotal + 1 + unit.spouses.length,
        0,
      ),
    0,
  );
}
