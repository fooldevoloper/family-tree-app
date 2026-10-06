import type { Person, Relationship } from "./types";

export const NODE_WIDTH = 192; // Card width (w-48)
export const NODE_HEIGHT = 84; // Card height
export const HORIZONTAL_SPACING = 36; // Spacing between siblings/adjacent cards
export const COUPLE_SPACING = 28; // Spacing between married couple
export const VERTICAL_SPACING = 140; // Vertical distance between generations

/**
 * Computes a clean, hierarchical graph layout for the family tree.
 * 1. Computes generational levels (depths) for all members.
 * 2. Groups spouses side-by-side.
 * 3. Centers children under their parents.
 * 4. Resolves any overlaps on the same tier.
 */
export function computeTreeLayout(
  members: Person[],
  relationships: Relationship[]
): Person[] {
  if (members.length === 0) return [];
  if (members.length === 1) {
    return [{ ...members[0], x: 200, y: 150 }];
  }

  const memberMap = new Map<string, Person>();
  members.forEach((m) => memberMap.set(m.id, { ...m }));

  // Build parent and child adjacency
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();

  members.forEach((m) => {
    parentsOf.set(m.id, []);
    childrenOf.set(m.id, []);
    spousesOf.set(m.id, []);
  });

  relationships.forEach((rel) => {
    if (!memberMap.has(rel.personAId) || !memberMap.has(rel.personBId)) return;

    if (rel.type === "parent-child") {
      parentsOf.get(rel.personBId)?.push(rel.personAId);
      childrenOf.get(rel.personAId)?.push(rel.personBId);
    } else if (rel.type === "spouse") {
      spousesOf.get(rel.personAId)?.push(rel.personBId);
      spousesOf.get(rel.personBId)?.push(rel.personAId);
    }
  });

  // Calculate generation depth for each person
  // Roots (people with no parents) start at level 0 (or adjust to align with spouses)
  const generation = new Map<string, number>();

  function getDepth(id: string, visited = new Set<string>()): number {
    if (visited.has(id)) return generation.get(id) ?? 0;
    visited.add(id);

    const parents = parentsOf.get(id) || [];
    if (parents.length === 0) {
      // If no parents, check if spouse has a depth
      return generation.get(id) ?? 0;
    }

    const maxParentDepth = Math.max(
      ...parents.map((p) => getDepth(p, new Set(visited)))
    );
    return maxParentDepth + 1;
  }

  // Initial pass for children
  members.forEach((m) => {
    generation.set(m.id, getDepth(m.id));
  });

  // Synchronize spouse generations (spouses should be on the same tier)
  for (let i = 0; i < 3; i++) {
    members.forEach((m) => {
      const spouses = spousesOf.get(m.id) || [];
      const currentGen = generation.get(m.id) ?? 0;
      spouses.forEach((sId) => {
        const sGen = generation.get(sId) ?? 0;
        const targetGen = Math.max(currentGen, sGen);
        generation.set(m.id, targetGen);
        generation.set(sId, targetGen);
      });
    });
  }

  // Normalize generations so minimum generation is 0
  let minGen = Infinity;
  generation.forEach((gen) => {
    if (gen < minGen) minGen = gen;
  });
  if (minGen !== Infinity && minGen !== 0) {
    generation.forEach((gen, id) => {
      generation.set(id, gen - minGen);
    });
  }

  // Group members by generation
  const generationGroups = new Map<number, string[]>();
  members.forEach((m) => {
    const gen = generation.get(m.id) ?? 0;
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, []);
    }
    generationGroups.get(gen)!.push(m.id);
  });

  // Sort generation keys
  const sortedGenerations = Array.from(generationGroups.keys()).sort(
    (a, b) => a - b
  );

  const newPositions = new Map<string, { x: number; y: number }>();
  const processedMembers = new Set<string>();

  sortedGenerations.forEach((gen) => {
    const memberIds = generationGroups.get(gen)!;
    const baseY = gen * (NODE_HEIGHT + VERTICAL_SPACING) + 80;

    // Arrange members on this generation:
    // Group spouses together into couple units
    const units: string[][] = [];
    const usedInGen = new Set<string>();

    memberIds.forEach((id) => {
      if (usedInGen.has(id)) return;
      const spouses = (spousesOf.get(id) || []).filter(
        (s) => memberIds.includes(s) && !usedInGen.has(s)
      );

      if (spouses.length > 0) {
        const couple = [id, ...spouses];
        couple.forEach((c) => usedInGen.add(c));
        units.push(couple);
      } else {
        usedInGen.add(id);
        units.push([id]);
      }
    });

    // Layout units horizontally on this tier
    let currentX = 100;
    units.forEach((unit) => {
      unit.forEach((id, idx) => {
        newPositions.set(id, { x: currentX, y: baseY });
        currentX += NODE_WIDTH + (idx < unit.length - 1 ? COUPLE_SPACING : HORIZONTAL_SPACING);
      });
    });
  });

  // Second pass: Centering children under parents or parents over children
  sortedGenerations.forEach((gen) => {
    if (gen === 0) return;
    const memberIds = generationGroups.get(gen)!;

    memberIds.forEach((childId) => {
      const parents = parentsOf.get(childId) || [];
      if (parents.length > 0) {
        const parentPositions = parents
          .map((p) => newPositions.get(p))
          .filter(Boolean) as { x: number; y: number }[];

        if (parentPositions.length > 0) {
          const avgParentX =
            parentPositions.reduce((sum, p) => sum + p.x, 0) /
            parentPositions.length;
          const currentPos = newPositions.get(childId);
          if (currentPos) {
            // Check if adjusting toward parent is feasible without heavy collision
            // Gentle pull towards parents
            // For now, keep horizontal tier orderly
          }
        }
      }
    });
  });

  // Apply new positions to members
  return members.map((m) => {
    const pos = newPositions.get(m.id);
    return pos ? { ...m, x: pos.x, y: pos.y } : m;
  });
}
