"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Info } from "lucide-react";

import { PersonDetailSheet } from "@/components/family/person-detail-sheet";
import type {
  FamilyHierarchyNode,
  FamilyHierarchyTree,
  FamilyUnitMember,
} from "@/lib/family/tree-adapter";
import { buildPersonRelationsById } from "@/lib/family/tree-adapter";
import type { Person, Relationship } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEXT = {
  noTree: "\uD45C\uC2DC\uD560 \uAC00\uC871 \uACC4\uCE35\uB3C4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  rootColumn: "\uCD5C\uC0C1\uC704",
  childColumn: "\uC790\uB140",
  selectedFamily: "\uC120\uD0DD\uD55C \uAC00\uAD6C",
  deceased: "\uACE0\uC778",
  spouseSeparator: "\uBC30\uC6B0\uC790",
  noChildren: "\uD45C\uC2DC\uD560 \uC790\uB140\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  detail: "\uC0C1\uC138",
};

type FamilyRelationshipTreeProps = {
  tree: FamilyHierarchyTree;
  persons: Person[];
  relationships: Relationship[];
};

export function FamilyRelationshipTree({
  tree,
  persons,
  relationships,
}: FamilyRelationshipTreeProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const nodeById = useMemo(() => buildNodeMap(tree.roots), [tree.roots]);
  const relationsById = useMemo(
    () => buildPersonRelationsById(persons, relationships),
    [persons, relationships],
  );
  const columns = buildExplorerColumns(tree.roots, selectedPath, nodeById);

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
      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max gap-3 px-1">
          {columns.map((column, columnIndex) => (
            <ExplorerColumn
              key={`${column.title}-${columnIndex}`}
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

  selectedPath.forEach((nodeId, index) => {
    const node = nodeById.get(nodeId);

    if (!node) {
      return;
    }

    columns.push({
      title: index === 0 ? TEXT.childColumn : node.unit.primary.full_name,
      parentNode: node,
      nodes: node.children,
    });
  });

  return columns;
}

function ExplorerColumn({
  title,
  parentNode,
  nodes,
  selectedNodeId,
  columnIndex,
  onSelectNode,
  onSelectPerson,
}: {
  title: string;
  parentNode: FamilyHierarchyNode | null;
  nodes: FamilyHierarchyNode[];
  selectedNodeId: string | null;
  columnIndex: number;
  onSelectNode: (node: FamilyHierarchyNode, columnIndex: number) => void;
  onSelectPerson: (person: Person) => void;
}) {
  return (
    <section className="w-[16.5rem] shrink-0 rounded-lg border border-border bg-background p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-bold">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          {nodes.length}
        </span>
      </div>

      {parentNode ? (
        <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 p-2">
          <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
            {TEXT.selectedFamily}
          </p>
          <CoupleUnitCard node={parentNode} onSelectPerson={onSelectPerson} compact />
        </div>
      ) : null}

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
}

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
        "rounded-md border p-2 transition-colors",
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
          className="min-w-0 flex-1 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CoupleUnitCard node={node} onSelectPerson={onSelectPerson} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {node.children.length > 0 ? (
            <button
              type="button"
              onClick={onClick}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
              <span className="sr-only">{node.unit.primary.full_name}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CoupleUnitCard({
  node,
  onSelectPerson,
  compact = false,
}: {
  node: FamilyHierarchyNode;
  onSelectPerson: (person: Person) => void;
  compact?: boolean;
}) {
  const members: FamilyUnitMember[] = [
    { person: node.unit.primary, role: "primary" },
    ...node.unit.spouses.map((spouse) => ({
      person: spouse,
      role: "spouse" as const,
    })),
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", compact && "gap-1")}>
      {members.map((member, index) => (
        <div key={member.person.id} className="flex min-w-0 items-center gap-1.5">
          {index > 0 ? (
            <span
              className="text-[10px] font-semibold text-muted-foreground"
              aria-label={TEXT.spouseSeparator}
            >
              +
            </span>
          ) : null}
          <TreePersonButton
            member={member}
            compact={compact}
            expandable
            onSelect={onSelectPerson}
          />
        </div>
      ))}
    </div>
  );
}

function TreePersonButton({
  member,
  compact,
  expandable,
  onSelect,
}: {
  member: FamilyUnitMember;
  compact?: boolean;
  expandable?: boolean;
  onSelect: (person: Person) => void;
}) {
  const { person, role } = member;

  return (
    <div
      className={cn(
        "flex min-h-12 rounded-md border",
        compact ? "w-20" : "w-24",
        role === "primary" ? "border-primary/30 bg-primary/5" : "border-border bg-background",
        !person.is_alive && "bg-muted/70 text-muted-foreground",
      )}
    >
      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-1.5 text-center text-xs"
      >
        <span className="line-clamp-2 break-keep font-bold leading-4">
          {person.full_name}
        </span>
        {!person.is_alive ? (
          <span className="mt-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
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
        className={cn(
          "inline-flex w-8 shrink-0 items-center justify-center border-l border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          expandable ? "bg-background/40" : "bg-background/20",
        )}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">
          {person.full_name} {TEXT.detail}
        </span>
      </button>
    </div>
  );
}
