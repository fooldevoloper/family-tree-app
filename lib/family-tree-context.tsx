"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { FamilyTree, Person, Relationship } from "./types";

export interface RelationshipInput {
  personAId?: string;
  personBId?: string;
  type: Relationship["type"];
}

interface FamilyTreeContextType {
  trees: FamilyTree[];
  currentTree: FamilyTree | null;
  setCurrentTree: (tree: FamilyTree | null) => void;
  createTree: (name: string) => FamilyTree;
  deleteTree: (id: string) => void;
  updateTree: (tree: FamilyTree) => void;
  addMember: (member: Omit<Person, "id">) => Person;
  addMemberWithRelationships: (
    member: Omit<Person, "id">,
    relationships?: RelationshipInput[]
  ) => Person;
  updateMember: (member: Person) => void;
  deleteMember: (id: string) => void;
  addRelationship: (relationship: Omit<Relationship, "id">) => Relationship;
  deleteRelationship: (id: string) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  history: FamilyTree[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const FamilyTreeContext = createContext<FamilyTreeContextType | null>(null);

const STORAGE_KEY = "family-trees";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function sanitizeTree(tree: FamilyTree): FamilyTree {
  const memberIdSet = new Set(tree.members.map((m) => m.id));
  const validRelationships = tree.relationships.filter(
    (r) => memberIdSet.has(r.personAId) && memberIdSet.has(r.personBId)
  );
  return {
    ...tree,
    relationships: validRelationships,
  };
}

function loadTrees(): FamilyTree[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: FamilyTree[] = JSON.parse(stored);
    return parsed.map(sanitizeTree);
  } catch (e) {
    console.error("Failed to load family trees from localStorage:", e);
    return [];
  }
}

function saveTrees(trees: FamilyTree[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trees));
  } catch (e) {
    console.error("Failed to save family trees to localStorage:", e);
  }
}

export function FamilyTreeProvider({ children }: { children: ReactNode }) {
  const [trees, setTrees] = useState<FamilyTree[]>(() => loadTrees());
  const [currentTree, setCurrentTreeState] = useState<FamilyTree | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [history, setHistory] = useState<FamilyTree[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const treesRef = useRef<FamilyTree[]>(trees);
  treesRef.current = trees;

  const currentTreeRef = useRef<FamilyTree | null>(currentTree);
  currentTreeRef.current = currentTree;

  const historyIndexRef = useRef<number>(historyIndex);
  historyIndexRef.current = historyIndex;

  const setCurrentTree = useCallback((tree: FamilyTree | null) => {
    const sanitized = tree ? sanitizeTree(tree) : null;
    currentTreeRef.current = sanitized;
    setCurrentTreeState(sanitized);
    if (sanitized) {
      const clone = JSON.parse(JSON.stringify(sanitized));
      setHistory([clone]);
      historyIndexRef.current = 0;
      setHistoryIndex(0);
    } else {
      setHistory([]);
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
    }
    setSelectedMemberId(null);
  }, []);

  const createTree = useCallback((name: string): FamilyTree => {
    const newTree: FamilyTree = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [],
      relationships: [],
    };
    setTrees((prev) => {
      const updated = [...prev, newTree];
      treesRef.current = updated;
      saveTrees(updated);
      return updated;
    });
    return newTree;
  }, []);

  const deleteTree = useCallback(
    (id: string) => {
      setTrees((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        treesRef.current = updated;
        saveTrees(updated);
        return updated;
      });
      if (currentTreeRef.current?.id === id) {
        setCurrentTree(null);
      }
    },
    [setCurrentTree]
  );

  const updateTree = useCallback((tree: FamilyTree) => {
    const sanitized = sanitizeTree(tree);
    const updated: FamilyTree = { ...sanitized, updatedAt: new Date().toISOString() };

    // Only update active currentTree and history if this tree is currently open
    if (currentTreeRef.current && currentTreeRef.current.id === updated.id) {
      currentTreeRef.current = updated;
      setCurrentTreeState(updated);

      setHistory((prev) => {
        const currentIdx = historyIndexRef.current;
        const sliced = prev.slice(0, currentIdx + 1);
        const nextHistory = [...sliced, JSON.parse(JSON.stringify(updated))];
        historyIndexRef.current = nextHistory.length - 1;
        setHistoryIndex(nextHistory.length - 1);
        return nextHistory;
      });
    }

    setTrees((prev) => {
      const updatedTrees = prev.map((t) => (t.id === updated.id ? updated : t));
      treesRef.current = updatedTrees;
      saveTrees(updatedTrees);
      return updatedTrees;
    });
  }, []);

  const addMemberWithRelationships = useCallback(
    (
      member: Omit<Person, "id">,
      relationships: RelationshipInput[] = []
    ): Person => {
      const tree = currentTreeRef.current;
      if (!tree) throw new Error("No tree selected");

      const newMemberId = generateId();
      const newMember: Person = { ...member, id: newMemberId };

      const existingRels = tree.relationships;
      const createdRels: Relationship[] = [];

      for (const rel of relationships) {
        const personAId =
          !rel.personAId || rel.personAId === "$NEW_MEMBER"
            ? newMemberId
            : rel.personAId;
        const personBId =
          !rel.personBId || rel.personBId === "$NEW_MEMBER"
            ? newMemberId
            : rel.personBId;

        // Skip self-relationship
        if (personAId === personBId) continue;

        // Check duplicate
        const isDuplicate =
          existingRels.some((ex) => {
            if (ex.type !== rel.type) return false;
            if (rel.type === "spouse" || rel.type === "sibling") {
              return (
                (ex.personAId === personAId && ex.personBId === personBId) ||
                (ex.personAId === personBId && ex.personBId === personAId)
              );
            }
            return ex.personAId === personAId && ex.personBId === personBId;
          }) ||
          createdRels.some((cr) => {
            if (cr.type !== rel.type) return false;
            if (rel.type === "spouse" || rel.type === "sibling") {
              return (
                (cr.personAId === personAId && cr.personBId === personBId) ||
                (cr.personAId === personBId && cr.personBId === personAId)
              );
            }
            return cr.personAId === personAId && cr.personBId === personBId;
          });

        if (!isDuplicate) {
          createdRels.push({
            id: generateId(),
            personAId,
            personBId,
            type: rel.type,
          });
        }
      }

      const updated: FamilyTree = {
        ...tree,
        members: [...tree.members, newMember],
        relationships: [...tree.relationships, ...createdRels],
      };

      updateTree(updated);
      return newMember;
    },
    [updateTree]
  );

  const addMember = useCallback(
    (member: Omit<Person, "id">): Person => {
      return addMemberWithRelationships(member, []);
    },
    [addMemberWithRelationships]
  );

  const updateMember = useCallback(
    (member: Person) => {
      const tree = currentTreeRef.current;
      if (!tree) return;
      const updated = {
        ...tree,
        members: tree.members.map((m) => (m.id === member.id ? member : m)),
      };
      updateTree(updated);
    },
    [updateTree]
  );

  const deleteMember = useCallback(
    (id: string) => {
      const tree = currentTreeRef.current;
      if (!tree) return;
      const updated = {
        ...tree,
        members: tree.members.filter((m) => m.id !== id),
        relationships: tree.relationships.filter(
          (r) => r.personAId !== id && r.personBId !== id
        ),
      };
      updateTree(updated);
      setSelectedMemberId((prev) => (prev === id ? null : prev));
    },
    [updateTree]
  );

  const addRelationship = useCallback(
    (relationship: Omit<Relationship, "id">): Relationship => {
      const tree = currentTreeRef.current;
      if (!tree) throw new Error("No tree selected");

      // Check if relationship already exists
      const existing = tree.relationships.find((ex) => {
        if (ex.type !== relationship.type) return false;
        if (relationship.type === "spouse" || relationship.type === "sibling") {
          return (
            (ex.personAId === relationship.personAId &&
              ex.personBId === relationship.personBId) ||
            (ex.personAId === relationship.personBId &&
              ex.personBId === relationship.personAId)
          );
        }
        return (
          ex.personAId === relationship.personAId &&
          ex.personBId === relationship.personBId
        );
      });

      if (existing) {
        return existing;
      }

      const newRelationship: Relationship = {
        ...relationship,
        id: generateId(),
      };
      const updated = {
        ...tree,
        relationships: [...tree.relationships, newRelationship],
      };
      updateTree(updated);
      return newRelationship;
    },
    [updateTree]
  );

  const deleteRelationship = useCallback(
    (id: string) => {
      const tree = currentTreeRef.current;
      if (!tree) return;
      const updated = {
        ...tree,
        relationships: tree.relationships.filter((r) => r.id !== id),
      };
      updateTree(updated);
    },
    [updateTree]
  );

  const undo = useCallback(() => {
    const currentIdx = historyIndexRef.current;
    if (currentIdx > 0) {
      const nextIdx = currentIdx - 1;
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);

      setHistory((prevHistory) => {
        const prevState = prevHistory[nextIdx];
        if (prevState) {
          currentTreeRef.current = prevState;
          setCurrentTreeState(prevState);
          setTrees((prevTrees) => {
            const nextTrees = prevTrees.map((t) =>
              t.id === prevState.id ? prevState : t
            );
            treesRef.current = nextTrees;
            saveTrees(nextTrees);
            return nextTrees;
          });
        }
        return prevHistory;
      });
    }
  }, []);

  const redo = useCallback(() => {
    const currentIdx = historyIndexRef.current;
    setHistory((prevHistory) => {
      if (currentIdx < prevHistory.length - 1) {
        const nextIdx = currentIdx + 1;
        historyIndexRef.current = nextIdx;
        setHistoryIndex(nextIdx);

        const nextState = prevHistory[nextIdx];
        if (nextState) {
          currentTreeRef.current = nextState;
          setCurrentTreeState(nextState);
          setTrees((prevTrees) => {
            const nextTrees = prevTrees.map((t) =>
              t.id === nextState.id ? nextState : t
            );
            treesRef.current = nextTrees;
            saveTrees(nextTrees);
            return nextTrees;
          });
        }
      }
      return prevHistory;
    });
  }, []);

  return (
    <FamilyTreeContext.Provider
      value={{
        trees,
        currentTree,
        setCurrentTree,
        createTree,
        deleteTree,
        updateTree,
        addMember,
        addMemberWithRelationships,
        updateMember,
        deleteMember,
        addRelationship,
        deleteRelationship,
        selectedMemberId,
        setSelectedMemberId,
        history,
        historyIndex,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
      }}
    >
      {children}
    </FamilyTreeContext.Provider>
  );
}

export function useFamilyTree() {
  const context = useContext(FamilyTreeContext);
  if (!context) {
    throw new Error("useFamilyTree must be used within a FamilyTreeProvider");
  }
  return context;
}
