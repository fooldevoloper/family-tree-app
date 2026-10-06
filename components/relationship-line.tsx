"use client";

import React, { useMemo } from "react";
import type { Person, Relationship } from "@/lib/types";

export const NODE_WIDTH = 192; // 192px (w-48)
export const NODE_HEIGHT = 84; // 84px card height

interface FamilyTreeGraphLinesProps {
  relationships: Relationship[];
  members: Person[];
  selectedMemberId?: string | null;
}

/**
 * High-performance, clean genealogical graph rendering.
 * Instead of drawing chaotic diagonal splines through card centers,
 * this groups parent-child connections into proper family forks (bus structure),
 * draws horizontal marriage bridges between couples, and connects cleanly
 * to card perimeter anchor points (top-center for children, bottom-center for parents).
 */
export const FamilyTreeGraphLines = React.memo(function FamilyTreeGraphLines({
  relationships,
  members,
  selectedMemberId,
}: FamilyTreeGraphLinesProps) {
  const memberMap = useMemo(() => {
    const map = new Map<string, Person>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // Group parent-child relationships by family units:
  // For each child, find their parents
  const { familyUnits, standaloneSpouses, standaloneSiblings, otherRels } =
    useMemo(() => {
      const childToParents = new Map<string, string[]>();
      const spousePairs = new Set<string>();
      const parentChildRelIds = new Set<string>();

      relationships.forEach((rel) => {
        if (!memberMap.has(rel.personAId) || !memberMap.has(rel.personBId))
          return;

        if (rel.type === "parent-child") {
          parentChildRelIds.add(rel.id);
          const childId = rel.personBId;
          const parentId = rel.personAId;
          if (!childToParents.has(childId)) {
            childToParents.set(childId, []);
          }
          childToParents.get(childId)!.push(parentId);
        } else if (rel.type === "spouse") {
          const key = [rel.personAId, rel.personBId].sort().join("-");
          spousePairs.add(key);
        }
      });

      // Group children that share the exact same parents
      // Map parentKey -> { parents: string[], children: string[] }
      const groupMap = new Map<
        string,
        { parents: string[]; children: string[] }
      >();

      childToParents.forEach((parents, childId) => {
        // Sort parent IDs for consistent key
        const sortedParents = [...parents].sort();
        const key = sortedParents.join("&");

        if (!groupMap.has(key)) {
          groupMap.set(key, { parents: sortedParents, children: [] });
        }
        groupMap.get(key)!.children.push(childId);
      });

      const familyUnits = Array.from(groupMap.values());

      // Find spouse pairs that don't already have children in a family unit
      const coveredSpouseKeys = new Set<string>();
      familyUnits.forEach((unit) => {
        if (unit.parents.length === 2) {
          coveredSpouseKeys.add(unit.parents.join("-"));
        }
      });

      const standaloneSpouses: Relationship[] = [];
      const standaloneSiblings: Relationship[] = [];
      const otherRels: Relationship[] = [];

      relationships.forEach((rel) => {
        if (!memberMap.has(rel.personAId) || !memberMap.has(rel.personBId))
          return;

        if (rel.type === "spouse") {
          const key = [rel.personAId, rel.personBId].sort().join("-");
          if (!coveredSpouseKeys.has(key)) {
            standaloneSpouses.push(rel);
            coveredSpouseKeys.add(key); // prevent duplicates
          }
        } else if (rel.type === "sibling") {
          // Check if both siblings are already part of the same family unit
          const pA = childToParents.get(rel.personAId);
          const pB = childToParents.get(rel.personBId);
          const shareParents =
            pA && pB && pA.length > 0 && pA.some((p) => pB.includes(p));

          if (!shareParents) {
            standaloneSiblings.push(rel);
          }
        } else if (rel.type !== "parent-child") {
          otherRels.push(rel);
        }
      });

      return { familyUnits, standaloneSpouses, standaloneSiblings, otherRels };
    }, [relationships, memberMap]);

  return (
    <g className="transition-all duration-300">
      {/* 1. Family Units (Couples & Single Parents -> Children) */}
      {familyUnits.map((unit, idx) => {
        const parents = unit.parents
          .map((id) => memberMap.get(id)!)
          .filter(Boolean);
        const children = unit.children
          .map((id) => memberMap.get(id)!)
          .filter(Boolean);

        if (parents.length === 0 || children.length === 0) return null;

        const isUnitSelected =
          selectedMemberId &&
          (unit.parents.includes(selectedMemberId) ||
            unit.children.includes(selectedMemberId));

        const lineColor = isUnitSelected
          ? "oklch(0.65 0.18 160)"
          : "oklch(0.55 0.08 160 / 0.85)";
        const strokeWidth = isUnitSelected ? 2.5 : 2;

        if (parents.length === 2) {
          // Couple with Children
          const [p1, p2] = parents;
          const leftParent = p1.x <= p2.x ? p1 : p2;
          const rightParent = p1.x <= p2.x ? p2 : p1;

          // Marriage connection between left and right parent
          const p1RightX = leftParent.x + NODE_WIDTH;
          const p1MidY = leftParent.y + NODE_HEIGHT / 2;
          const p2LeftX = rightParent.x;
          const p2MidY = rightParent.y + NODE_HEIGHT / 2;

          // Marriage junction point (where the lineage stem drops)
          const marriageX = (p1RightX + p2LeftX) / 2;
          const marriageY = (p1MidY + p2MidY) / 2;

          // Compute fork Y: midway between parents bottom and children top
          const parentsBottom =
            Math.max(leftParent.y, rightParent.y) + NODE_HEIGHT;
          const minChildTop = Math.min(...children.map((c) => c.y));
          const forkY =
            minChildTop > parentsBottom + 20
              ? (parentsBottom + minChildTop) / 2
              : parentsBottom + 35;

          // Children X entry points (top-center of each child)
          const childAnchors = children.map((c) => ({
            x: c.x + NODE_WIDTH / 2,
            y: c.y,
            id: c.id,
          }));

          const minChildX = Math.min(...childAnchors.map((a) => a.x));
          const maxChildX = Math.max(...childAnchors.map((a) => a.x));
          const busStartX = Math.min(minChildX, marriageX);
          const busEndX = Math.max(maxChildX, marriageX);

          return (
            <g key={`family-unit-${idx}`}>
              {/* Marriage bridge line */}
              <path
                d={`M ${p1RightX} ${p1MidY} L ${p2LeftX} ${p2MidY}`}
                fill="none"
                stroke="oklch(0.7 0.15 350)"
                strokeWidth={2}
                strokeDasharray="none"
              />

              {/* Marriage junction dot / heart badge */}
              <circle
                cx={marriageX}
                cy={marriageY}
                r={4}
                fill="oklch(0.7 0.15 350)"
              />

              {/* Lineage stem dropping down from marriage junction to forkY */}
              <path
                d={`M ${marriageX} ${marriageY} L ${marriageX} ${forkY}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth}
              />

              {/* Horizontal generation crossbar (bus) */}
              {children.length > 1 && (
                <path
                  d={`M ${busStartX} ${forkY} L ${busEndX} ${forkY}`}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={strokeWidth}
                />
              )}

              {/* Vertical drops into each child's top-center */}
              {childAnchors.map((anchor) => {
                const path =
                  children.length === 1
                    ? // Single child: clean stepped or direct line
                      `M ${marriageX} ${forkY} L ${anchor.x} ${forkY} L ${anchor.x} ${anchor.y}`
                    : // Multiple children: drop from crossbar
                      `M ${anchor.x} ${forkY} L ${anchor.x} ${anchor.y}`;

                return (
                  <g key={`child-drop-${anchor.id}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={strokeWidth}
                    />
                    {/* Top entry dot on child card */}
                    <circle
                      cx={anchor.x}
                      cy={anchor.y}
                      r={3.5}
                      fill={lineColor}
                    />
                  </g>
                );
              })}
            </g>
          );
        } else {
          // Single Parent with Children
          const parent = parents[0];
          const stemStartX = parent.x + NODE_WIDTH / 2;
          const stemStartY = parent.y + NODE_HEIGHT;

          const minChildTop = Math.min(...children.map((c) => c.y));
          const forkY =
            minChildTop > stemStartY + 20
              ? (stemStartY + minChildTop) / 2
              : stemStartY + 35;

          const childAnchors = children.map((c) => ({
            x: c.x + NODE_WIDTH / 2,
            y: c.y,
            id: c.id,
          }));

          const minChildX = Math.min(...childAnchors.map((a) => a.x));
          const maxChildX = Math.max(...childAnchors.map((a) => a.x));
          const busStartX = Math.min(minChildX, stemStartX);
          const busEndX = Math.max(maxChildX, stemStartX);

          return (
            <g key={`single-parent-unit-${idx}`}>
              {/* Stem from parent bottom-center down to forkY */}
              <path
                d={`M ${stemStartX} ${stemStartY} L ${stemStartX} ${forkY}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth}
              />
              <circle
                cx={stemStartX}
                cy={stemStartY}
                r={3.5}
                fill={lineColor}
              />

              {/* Horizontal crossbar */}
              {children.length > 1 && (
                <path
                  d={`M ${busStartX} ${forkY} L ${busEndX} ${forkY}`}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={strokeWidth}
                />
              )}

              {/* Vertical drops into each child */}
              {childAnchors.map((anchor) => {
                const path =
                  children.length === 1
                    ? `M ${stemStartX} ${forkY} L ${anchor.x} ${forkY} L ${anchor.x} ${anchor.y}`
                    : `M ${anchor.x} ${forkY} L ${anchor.x} ${anchor.y}`;

                return (
                  <g key={`single-child-drop-${anchor.id}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx={anchor.x}
                      cy={anchor.y}
                      r={3.5}
                      fill={lineColor}
                    />
                  </g>
                );
              })}
            </g>
          );
        }
      })}

      {/* 2. Standalone Spouses (no children in tree yet) */}
      {standaloneSpouses.map((rel) => {
        const p1 = memberMap.get(rel.personAId);
        const p2 = memberMap.get(rel.personBId);
        if (!p1 || !p2) return null;

        const left = p1.x <= p2.x ? p1 : p2;
        const right = p1.x <= p2.x ? p2 : p1;

        const startX = left.x + NODE_WIDTH;
        const startY = left.y + NODE_HEIGHT / 2;
        const endX = right.x;
        const endY = right.y + NODE_HEIGHT / 2;

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        return (
          <g key={`spouse-${rel.id}`}>
            <path
              d={`M ${startX} ${startY} C ${midX} ${startY - 15}, ${midX} ${endY - 15}, ${endX} ${endY}`}
              fill="none"
              stroke="oklch(0.7 0.15 350)"
              strokeWidth={2}
            />
            <circle cx={midX} cy={midY - 10} r={4} fill="oklch(0.7 0.15 350)" />
          </g>
        );
      })}

      {/* 3. Standalone Siblings (no recorded common parents) */}
      {standaloneSiblings.map((rel) => {
        const p1 = memberMap.get(rel.personAId);
        const p2 = memberMap.get(rel.personBId);
        if (!p1 || !p2) return null;

        const left = p1.x <= p2.x ? p1 : p2;
        const right = p1.x <= p2.x ? p2 : p1;

        const startX = left.x + NODE_WIDTH / 2;
        const startY = left.y;
        const endX = right.x + NODE_WIDTH / 2;
        const endY = right.y;

        const overheadY = Math.min(startY, endY) - 25;

        return (
          <g key={`sibling-${rel.id}`}>
            <path
              d={`M ${startX} ${startY} L ${startX} ${overheadY} L ${endX} ${overheadY} L ${endX} ${endY}`}
              fill="none"
              stroke="oklch(0.7 0.12 230)"
              strokeWidth={1.8}
              strokeDasharray="6 4"
            />
            <circle cx={startX} cy={startY} r={3} fill="oklch(0.7 0.12 230)" />
            <circle cx={endX} cy={endY} r={3} fill="oklch(0.7 0.12 230)" />
          </g>
        );
      })}

      {/* 4. Any other custom relationships */}
      {otherRels.map((rel) => {
        const p1 = memberMap.get(rel.personAId);
        const p2 = memberMap.get(rel.personBId);
        if (!p1 || !p2) return null;

        const ax = p1.x + NODE_WIDTH / 2;
        const ay = p1.y + NODE_HEIGHT;
        const bx = p2.x + NODE_WIDTH / 2;
        const by = p2.y;

        const midY = (ay + by) / 2;

        return (
          <g key={`other-${rel.id}`}>
            <path
              d={`M ${ax} ${ay} C ${ax} ${midY}, ${bx} ${midY}, ${bx} ${by}`}
              fill="none"
              stroke="oklch(0.6 0.05 200)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </g>
        );
      })}
    </g>
  );
});

// Backward-compatible individual line component
export function RelationshipLine({
  relationship,
  members,
}: {
  relationship: Relationship;
  members: Person[];
}) {
  return (
    <FamilyTreeGraphLines
      relationships={[relationship]}
      members={members}
    />
  );
}
