"use client";

import type { Person, Relationship } from "@/lib/types";

interface RelationshipLineProps {
  relationship: Relationship;
  members: Person[];
}

const NODE_WIDTH = 176; // w-44 = 11rem = 176px
const NODE_HEIGHT = 64; // approximate height

export function RelationshipLine({ relationship, members }: RelationshipLineProps) {
  const personA = members.find((m) => m.id === relationship.personAId);
  const personB = members.find((m) => m.id === relationship.personBId);

  if (!personA || !personB) return null;

  // Calculate center points of nodes
  const ax = personA.x + NODE_WIDTH / 2;
  const ay = personA.y + NODE_HEIGHT / 2;
  const bx = personB.x + NODE_WIDTH / 2;
  const by = personB.y + NODE_HEIGHT / 2;

  // Calculate control points for curved line
  const midY = (ay + by) / 2;
  const curvature = Math.abs(ay - by) * 0.3;

  // Different line styles for different relationship types
  const getLineStyle = () => {
    switch (relationship.type) {
      case "spouse":
        return {
          stroke: "oklch(0.75 0.12 350)", // pastel-rose
          strokeWidth: 2,
          strokeDasharray: "none",
        };
      case "parent-child":
        return {
          stroke: "oklch(0.65 0.15 160)", // primary green
          strokeWidth: 2,
          strokeDasharray: "none",
        };
      case "sibling":
        return {
          stroke: "oklch(0.75 0.12 200)", // accent blue
          strokeWidth: 2,
          strokeDasharray: "6 4",
        };
      default:
        return {
          stroke: "oklch(0.7 0 0)",
          strokeWidth: 2,
          strokeDasharray: "none",
        };
    }
  };

  const lineStyle = getLineStyle();

  // Create curved path
  const path =
    relationship.type === "spouse"
      ? // Horizontal curved line for spouses
        `M ${ax} ${ay} C ${ax + (bx - ax) * 0.5} ${ay - 30}, ${bx - (bx - ax) * 0.5} ${by - 30}, ${bx} ${by}`
      : // Vertical curved line for parent-child
        `M ${ax} ${ay} C ${ax} ${midY + curvature}, ${bx} ${midY - curvature}, ${bx} ${by}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        {...lineStyle}
        className="transition-all"
      />
      {/* Connection dots */}
      <circle cx={ax} cy={ay} r={4} fill={lineStyle.stroke} />
      <circle cx={bx} cy={by} r={4} fill={lineStyle.stroke} />
    </g>
  );
}
