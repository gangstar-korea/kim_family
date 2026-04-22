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
  childNames: string[];
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

export type FamilyHierarchyNode = {
  unit: FamilyUnit;
  children: FamilyHierarchyNode[];
};

export type FamilyHierarchyTree = {
  roots: FamilyHierarchyNode[];
};

const UNKNOWN_DEPTH = 999;
const UNKNOWN_ORDER = 999;
const UNKNOWN_DATE = "9999-99-99";
const GENERATION_LABEL = "\uC138\uB300";
const UNKNOWN_GENERATION_LABEL = "\uC138\uB300 \uBBF8\uC9C0\uC815";
const BRANCH_ORDER = new Map<string, number>(
  ["ROOT", "BR01", "BR02", "BR03", "BR04", "BR05", "BR06", "BR07", "BR08"].map(
    (branchCode, index) => [branchCode, index],
  ),
);

function baseSortValue(person: Person) {
  const branch = String(BRANCH_ORDER.get(person.branch_code) ?? UNKNOWN_ORDER).padStart(
    4,
    "0",
  );
  const order = String(person.birth_order ?? UNKNOWN_ORDER).padStart(4, "0");
  const birthDate = person.birth_date ?? UNKNOWN_DATE;

  return `${branch}:${order}:${birthDate}:${person.full_name}`;
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

function uniquePeopleByIds(ids: string[], personById: Map<string, Person>) {
  return uniquePeople(
    ids
      .map((id) => personById.get(id))
      .filter((person): person is Person => Boolean(person))
      .sort(sortPeople),
  );
}

function relationToParentChild(
  relationship: Relationship,
  person: Person,
  relatedPerson: Person,
) {
  const personDepth = person.generation_depth;
  const relatedPersonDepth = relatedPerson.generation_depth;

  if (
    typeof personDepth === "number" &&
    typeof relatedPersonDepth === "number" &&
    personDepth !== relatedPersonDepth
  ) {
    return personDepth < relatedPersonDepth
      ? {
          parentId: person.id,
          childId: relatedPerson.id,
        }
      : {
          parentId: relatedPerson.id,
          childId: person.id,
        };
  }

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

    const parentChild = relationToParentChild(relationship, person, relatedPerson);

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
      uniquePeopleByIds(parentIdsByChildId.get(primary.id) ?? [], personById).map(
        (parent) => parent.full_name,
      ),
    );
    const childNames = uniqueNames(
      uniquePeopleByIds(childIdsByParentId.get(primary.id) ?? [], personById).map(
        (child) => child.full_name,
      ),
    );

    unitMemberIds.add(primary.id);
    spouses.forEach((spouse) => unitMemberIds.add(spouse.id));

    return {
      id: primary.id,
      primary,
      spouses,
      parentNames,
      childNames,
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
      childNames: [],
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

export function buildFamilyHierarchyTree(
  persons: Person[],
  relationships: Relationship[],
  maxDepth = 3,
): FamilyHierarchyTree {
  const generationTree = buildFamilyTree(persons, relationships);
  const units = generationTree.generations.flatMap((generation) => generation.units);
  const personById = new Map(persons.map((person) => [person.id, person]));
  const unitByPrimaryId = new Map(units.map((unit) => [unit.primary.id, unit]));
  const spouseToBloodPrimaryId = new Map<string, string>();
  const bloodParentIdsByChildId = new Map<string, Set<string>>();
  const childIdsByBloodParentId = new Map<string, Set<string>>();

  units.forEach((unit) => {
    unit.spouses.forEach((spouse) => {
      spouseToBloodPrimaryId.set(spouse.id, unit.primary.id);
    });
  });

  relationships.forEach((relationship) => {
    const person = personById.get(relationship.person_id);
    const relatedPerson = personById.get(relationship.related_person_id);

    if (!person || !relatedPerson || relationship.relation_type === "spouse") {
      return;
    }

    const parentChild = relationToParentChild(relationship, person, relatedPerson);

    if (!parentChild) {
      return;
    }

    const parent = personById.get(parentChild.parentId);
    const child = personById.get(parentChild.childId);

    if (!parent || !child || child.family_role_type !== "blood") {
      return;
    }

    const bloodParentId =
      parent.family_role_type === "blood"
        ? parent.id
        : spouseToBloodPrimaryId.get(parent.id);

    if (!bloodParentId || !unitByPrimaryId.has(bloodParentId)) {
      return;
    }

    const parentSet = bloodParentIdsByChildId.get(child.id) ?? new Set<string>();
    parentSet.add(bloodParentId);
    bloodParentIdsByChildId.set(child.id, parentSet);

    const childSet = childIdsByBloodParentId.get(bloodParentId) ?? new Set<string>();
    childSet.add(child.id);
    childIdsByBloodParentId.set(bloodParentId, childSet);
  });

  const knownGenerationDepths = units
    .map((unit) => unit.primary.generation_depth)
    .filter((depth): depth is number => typeof depth === "number");
  const minGenerationDepth =
    knownGenerationDepths.length > 0 ? Math.min(...knownGenerationDepths) : null;
  const rootUnits = units
    .filter((unit) => {
      if (minGenerationDepth !== null) {
        return unit.primary.generation_depth === minGenerationDepth;
      }

      return (bloodParentIdsByChildId.get(unit.primary.id)?.size ?? 0) === 0;
    })
    .sort((a, b) => a.lineageSortKey.localeCompare(b.lineageSortKey, "ko"));

  function buildNode(
    unit: FamilyUnit,
    depth: number,
    visiting = new Set<string>(),
  ): FamilyHierarchyNode {
    if (depth >= maxDepth || visiting.has(unit.primary.id)) {
      return {
        unit,
        children: [],
      };
    }

    const nextVisiting = new Set(visiting);
    nextVisiting.add(unit.primary.id);

    const children = [...(childIdsByBloodParentId.get(unit.primary.id) ?? [])]
      .map((childId) => unitByPrimaryId.get(childId))
      .filter((childUnit): childUnit is FamilyUnit => Boolean(childUnit))
      .sort((a, b) => a.lineageSortKey.localeCompare(b.lineageSortKey, "ko"))
      .map((childUnit) => buildNode(childUnit, depth + 1, nextVisiting));

    return {
      unit,
      children,
    };
  }

  return {
    roots: rootUnits.map((unit) => buildNode(unit, 1)),
  };
}
