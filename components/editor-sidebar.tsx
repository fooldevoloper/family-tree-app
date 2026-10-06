"use client";

import { useFamilyTree } from "@/lib/family-tree-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  Link2,
  Download,
  Upload,
  Undo2,
  Redo2,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface EditorSidebarProps {
  onAddPerson: () => void;
  onAddRelationship: () => void;
  onAutoArrange?: () => void;
  onClose?: () => void;
  className?: string;
}

export function EditorSidebar({
  onAddPerson,
  onAddRelationship,
  onAutoArrange,
  onClose,
  className,
}: EditorSidebarProps) {
  const { currentTree, undo, redo, canUndo, canRedo, updateTree } = useFamilyTree();

  const handleAddPerson = () => {
    onAddPerson();
    onClose?.();
  };

  const handleAddRelationship = () => {
    onAddRelationship();
    onClose?.();
  };

  const handleAutoArrange = () => {
    onAutoArrange?.();
    onClose?.();
  };

  const handleExport = () => {
    if (!currentTree) return;
    const dataStr = JSON.stringify(currentTree, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTree.name.replace(/\s+/g, "-").toLowerCase()}-family-tree.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Family tree exported");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.members && data.relationships && currentTree) {
          updateTree({
            ...currentTree,
            members: data.members,
            relationships: data.relationships,
          });
          toast.success("Family tree imported successfully");
        } else {
          toast.error("JSON file is missing members or relationships");
        }
      } catch (error) {
        console.error("Failed to import tree:", error);
        toast.error("Failed to parse JSON file");
      }
    };
    input.click();
  };

  return (
    <aside
      className={cn(
        "w-56 border-r border-border bg-sidebar p-4 flex flex-col gap-2 shrink-0",
        className
      )}
    >
      <div className="mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Add
        </p>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleAddPerson}
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleAddRelationship}
          >
            <Link2 className="w-4 h-4" />
            Add Relationship
          </Button>
        </div>
      </div>

      <Separator />

      {onAutoArrange && (
        <>
          <div className="my-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Layout
            </p>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent text-xs hover:border-primary/50"
              onClick={handleAutoArrange}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Auto-Arrange Tree
            </Button>
          </div>
          <Separator />
        </>
      )}

      <div className="mt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Data
        </p>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleImport}
          >
            <Upload className="w-4 h-4" />
            Import JSON
          </Button>
        </div>
      </div>

      <Separator />

      <div className="mt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          History
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 bg-transparent"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 bg-transparent"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo2 className="w-4 h-4" />
            Redo
          </Button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>{currentTree?.members.length || 0} members</p>
          <p>{currentTree?.relationships.length || 0} relationships</p>
        </div>
      </div>
    </aside>
  );
}
