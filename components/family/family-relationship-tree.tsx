"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

import { PersonDetailSheet } from "@/components/family/person-detail-sheet";
import { getPersonActionPermissions } from "@/lib/family/permissions";
import type {
  FamilyHierarchyNode,
  FamilyHierarchyTree,
  FamilyUnitMember,
} from "@/lib/family/tree-adapter";
import { buildPersonRelationsById } from "@/lib/family/tree-adapter";
import type { Person, Relationship, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEXT = {
  noTree: "표시할 가족 계층도가 없습니다.",
  rootColumn: "최상위",
  noChildren: "표시할 자녀가 없습니다.",
  detail: "상세",
  childOf: "의 자녀",
  topPath: "최상위",
  deceased: "고인",
};

type FamilyRelationshipTreeProps = {
  tree: FamilyHierarchyTree;
  persons: Person[];
  relationships: Relationship[];
  currentUserProfile?: UserProfile | null;
};

export function FamilyRelationshipTree({
  tree,
  persons,
  relationships,
  currentUserProfile,
}: FamilyRelationshipTreeProps) {
  const defaultSelectedPath = useMemo(() => buildDefaultSelectedPath(tree.roots), [tree.roots]);
  const [selectedPath, setSelectedPath] = useState<string[]>(defaultSelectedPath);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const lastColumnRef = useRef<HTMLElement | null>(null);
  const nodeById = useMemo(() => buildNodeMap(tree.roots), [tree.roots]);
  const relationsById = useMemo(
    () => buildPersonRelationsById(persons, relationships),
    [persons, relationships],
  );
  const selectedPersonPermissions = useMemo(() => {
    if (!selectedPerson) {
      return null;
    }

    return getPersonActionPermissions(
      currentUserProfile ?? null,
      selectedPerson,
      persons,
      relationships,
    );
  }, [currentUserProfile, persons, relationships, selectedPerson]);
  const columns = buildExplorerColumns(tree.roots, selectedPath, nodeById);

  useEffect(() => {
    if (!lastColumnRef.current) {
      return;
    }

    lastColumnRef.current.scrollIntoView({
      behavior: "smooth",
      inline: "end",
      block: "nearest",
    });
  }, [selectedPath, columns.length]);

  useEffect(() => {
    setSelectedPath(defaultSelectedPath);
  }, [defaultSelectedPath]);

  if (tree.roots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {TEXT.noTree}
      </div>
    );
  }

  function handleSelectNode(node: FamilyHierarchyNode, columnIndex: number) {
    setSelectedPath((currentPath) => {
      const nextPath = currentPath.slice(0, columnIndex);
      nextPath[columnIndex] = node.unit.id;
      return nextPath;
    });
  }

  return (
    <>
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-3">
        <div className="inline-flex min-w-max gap-3 px-1">
          {columns.map((column, columnIndex) => (
            <ExplorerColumn
              key={`${column.title}-${columnIndex}`}
              ref={columnIndex === columns.length - 1 ? lastColumnRef : undefined}
              title={column.title}
              parentNode={column.parentNode}
              nodes={column.nodes}
              selectedNodeId={selectedPath[columnIndex] ?? null}
              columnIndex={columnIndex}
              onSelectNode={handleSelectNode}
              onSelectPerson={setSelectedPerson}
            />
          ))}
        </div>
      </div>

      <PersonDetailSheet
        open={Boolean(selectedPerson)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPerson(null);
          }
        }}
        person={selectedPerson}
        relations={selectedPerson ? relationsById[selectedPerson.id] ?? null : null}
        currentUserProfile={currentUserProfile ?? null}
        permissions={selectedPersonPermissions}
      />
    </>
  );
}

function buildNodeMap(nodes: FamilyHierarchyNode[]) {
  const nodeById = new Map<string, FamilyHierarchyNode>();

  function visit(node: FamilyHierarchyNode) {
    nodeById.set(node.unit.id, node);
    node.children.forEach(visit);
  }

  nodes.forEach(visit);
  return nodeById;
}

function buildDefaultSelectedPath(roots: FamilyHierarchyNode[]) {
  if (roots.length === 0) {
    return [];
  }

  const rootNode = roots.find((node) => node.unit.primary.branch_code === "ROOT") ?? roots[0];
  return [rootNode.unit.id];
}

function formatFamilyUnitLabel(node: FamilyHierarchyNode) {
  const spouseName = node.unit.spouses[0]?.full_name;

  return spouseName
    ? `${node.unit.primary.full_name} · ${spouseName}`
    : node.unit.primary.full_name;
}

function buildExplorerColumns(
  roots: FamilyHierarchyNode[],
  selectedPath: string[],
  nodeById: Map<string, FamilyHierarchyNode>,
) {
  const columns: Array<{
    title: string;
    parentNode: FamilyHierarchyNode | null;
    nodes: FamilyHierarchyNode[];
  }> = [
    {
      title: TEXT.rootColumn,
      parentNode: null,
      nodes: roots,
    },
  ];

  selectedPath.forEach((nodeId) => {
    const node = nodeById.get(nodeId);

    if (!node) {
      return;
    }

    columns.push({
      title: `${formatFamilyUnitLabel(node)}${TEXT.childOf}`,
      parentNode: node,
      nodes: node.children,
    });
  });

  return columns;
}

const ExplorerColumn = forwardRef<
  HTMLElement,
  {
    title: string;
    parentNode: FamilyHierarchyNode | null;
    nodes: FamilyHierarchyNode[];
    selectedNodeId: string | null;
    columnIndex: number;
    onSelectNode: (node: FamilyHierarchyNode, columnIndex: number) => void;
    onSelectPerson: (person: Person) => void;
  }
>(function ExplorerColumn(
  { title, parentNode, nodes, selectedNodeId, columnIndex, onSelectNode, onSelectPerson },
  ref,
) {
  return (
    <section
      ref={ref}
      className="w-[min(21rem,calc(100vw-2rem))] min-w-[min(21rem,calc(100vw-2rem))] shrink-0 rounded-lg border border-border bg-background p-3 shadow-sm"
    >
      <div className="mb-3 space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground">
          {parentNode ? `${TEXT.topPath} > ${formatFamilyUnitLabel(parentNode)}` : TEXT.topPath}
        </p>
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold">{title}</h3>
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
            {nodes.length}
          </span>
        </div>
      </div>

      {nodes.length > 0 ? (
        <div className="space-y-2">
          {nodes.map((node) => (
            <ExplorerNodeButton
              key={node.unit.id}
              node={node}
              selected={selectedNodeId === node.unit.id}
              onClick={() => onSelectNode(node, columnIndex)}
              onSelectPerson={onSelectPerson}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-muted/50 px-3 py-4 text-center text-xs leading-5 text-muted-foreground">
          {TEXT.noChildren}
        </p>
      )}
    </section>
  );
});

function ExplorerNodeButton({
  node,
  selected,
  onClick,
  onSelectPerson,
}: {
  node: FamilyHierarchyNode;
  selected: boolean;
  onClick: () => void;
  onSelectPerson: (person: Person) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 transition-colors",
        selected ? "border-primary/50 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick();
            }
          }}
          className="min-w-0 flex-1 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CoupleUnitCard node={node} onSelectPerson={onSelectPerson} />
        </div>
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={onClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">{node.unit.primary.full_name}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CoupleUnitCard({
  node,
  onSelectPerson,
}: {
  node: FamilyHierarchyNode;
  onSelectPerson: (person: Person) => void;
}) {
  const members: FamilyUnitMember[] = [
    { person: node.unit.primary, role: "primary" },
    ...node.unit.spouses.map((spouse) => ({
      person: spouse,
      role: "spouse" as const,
    })),
  ];

  return (
    <div className={cn("grid min-w-0 gap-1.5", members.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
      {members.map((member) => (
        <div key={member.person.id} className="min-w-0">
          <TreePersonButton member={member} onSelect={onSelectPerson} />
        </div>
      ))}
    </div>
  );
}

function TreePersonButton({
  member,
  onSelect,
}: {
  member: FamilyUnitMember;
  onSelect: (person: Person) => void;
}) {
  const { person, role } = member;

  return (
    <div
      className={cn(
        "relative flex min-h-[84px] rounded-lg border",
        role === "primary" ? "border-primary/20 bg-primary/5" : "border-border/80 bg-background",
        !person.is_alive && "bg-muted/50 text-muted-foreground",
      )}
    >
      <div className="relative flex min-w-0 flex-1 px-3.5 py-2.5 text-left">
        <div className="flex min-h-[40px] w-full items-center">
          <span className="break-keep text-base font-bold leading-6">{person.full_name}</span>
        </div>
        {!person.is_alive ? (
          <span className="absolute left-1/2 top-2 inline-flex min-w-10 -translate-x-1/2 justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {TEXT.deceased}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(person);
        }}
        className="inline-flex w-11 shrink-0 items-center justify-center rounded-r-lg border-l border-border/70 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {TEXT.detail}
      </button>
    </div>
  );
}
