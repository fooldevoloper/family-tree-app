"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FamilyTree, Person, Relationship } from "./types";

interface FamilyTreeContextType {
  trees: FamilyTree[];
  currentTree: FamilyTree | null;
  setCurrentTree: (tree: FamilyTree | null) => void;
  createTree: (name: string) => FamilyTree;
  deleteTree: (id: string) => void;
  updateTree: (tree: FamilyTree) => void;
  addMember: (member: Omit<Person, "id">) => Person;
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

function loadTrees(): FamilyTree[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveTrees(trees: FamilyTree[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trees));
}

export function FamilyTreeProvider({ children }: { children: ReactNode }) {
  const [trees, setTrees] = useState<FamilyTree[]>(() => loadTrees());
  const [currentTree, setCurrentTreeState] = useState<FamilyTree | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [history, setHistory] = useState<FamilyTree[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((tree: FamilyTree) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, JSON.parse(JSON.stringify(tree))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const setCurrentTree = useCallback((tree: FamilyTree | null) => {
    setCurrentTreeState(tree);
    if (tree) {
      setHistory([JSON.parse(JSON.stringify(tree))]);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(-1);
    }
    setSelectedMemberId(null);
  }, []);

  const updateTrees = useCallback((updatedTrees: FamilyTree[]) => {
    setTrees(updatedTrees);
    saveTrees(updatedTrees);
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
    const updatedTrees = [...trees, newTree];
    updateTrees(updatedTrees);
    return newTree;
  }, [trees, updateTrees]);

  const deleteTree = useCallback((id: string) => {
    const updatedTrees = trees.filter((t) => t.id !== id);
    updateTrees(updatedTrees);
    if (currentTree?.id === id) {
      setCurrentTree(null);
    }
  }, [trees, currentTree, updateTrees, setCurrentTree]);

  const updateTree = useCallback((tree: FamilyTree) => {
    const updated = { ...tree, updatedAt: new Date().toISOString() };
    const updatedTrees = trees.map((t) => (t.id === tree.id ? updated : t));
    updateTrees(updatedTrees);
    setCurrentTreeState(updated);
    pushHistory(updated);
  }, [trees, updateTrees, pushHistory]);

  const addMember = useCallback((member: Omit<Person, "id">): Person => {
    if (!currentTree) throw new Error("No tree selected");
    const newMember: Person = { ...member, id: generateId() };
    const updated = {
      ...currentTree,
      members: [...currentTree.members, newMember],
    };
    updateTree(updated);
    return newMember;
  }, [currentTree, updateTree]);

  const updateMember = useCallback((member: Person) => {
    if (!currentTree) return;
    const updated = {
      ...currentTree,
      members: currentTree.members.map((m) =>
        m.id === member.id ? member : m
      ),
    };
    updateTree(updated);
  }, [currentTree, updateTree]);

  const deleteMember = useCallback((id: string) => {
    if (!currentTree) return;
    const updated = {
      ...currentTree,
      members: currentTree.members.filter((m) => m.id !== id),
      relationships: currentTree.relationships.filter(
        (r) => r.personAId !== id && r.personBId !== id
      ),
    };
    updateTree(updated);
    if (selectedMemberId === id) {
      setSelectedMemberId(null);
    }
  }, [currentTree, updateTree, selectedMemberId]);

  const addRelationship = useCallback(
    (relationship: Omit<Relationship, "id">): Relationship => {
      if (!currentTree) throw new Error("No tree selected");
      const newRelationship: Relationship = {
        ...relationship,
        id: generateId(),
      };
      const updated = {
        ...currentTree,
        relationships: [...currentTree.relationships, newRelationship],
      };
      updateTree(updated);
      return newRelationship;
    },
    [currentTree, updateTree]
  );

  const deleteRelationship = useCallback((id: string) => {
    if (!currentTree) return;
    const updated = {
      ...currentTree,
      relationships: currentTree.relationships.filter((r) => r.id !== id),
    };
    updateTree(updated);
  }, [currentTree, updateTree]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentTreeState(prevState);
      const updatedTrees = trees.map((t) =>
        t.id === prevState.id ? prevState : t
      );
      updateTrees(updatedTrees);
    }
  }, [history, historyIndex, trees, updateTrees]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentTreeState(nextState);
      const updatedTrees = trees.map((t) =>
        t.id === nextState.id ? nextState : t
      );
      updateTrees(updatedTrees);
    }
  }, [history, historyIndex, trees, updateTrees]);

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
