"use client";

import { FamilyTreeProvider, useFamilyTree } from "@/lib/family-tree-context";
import { Dashboard } from "@/components/dashboard";
import { TreeEditor } from "@/components/tree-editor";

function FamilyTreeApp() {
  const { currentTree } = useFamilyTree();

  if (currentTree) {
    return <TreeEditor />;
  }

  return <Dashboard />;
}

export default function Home() {
  return (
    <FamilyTreeProvider>
      <FamilyTreeApp />
    </FamilyTreeProvider>
  );
}
