"use client";

import { useState } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import type { FamilyTree } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, TreePine, Calendar, Pencil, Trash2, FolderOpen } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Dashboard() {
  const { trees, createTree, deleteTree, updateTree, setCurrentTree } = useFamilyTree();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTreeName, setNewTreeName] = useState("");
  const [editingTree, setEditingTree] = useState<FamilyTree | null>(null);
  const [editTreeName, setEditTreeName] = useState("");
  const [deletingTree, setDeletingTree] = useState<FamilyTree | null>(null);

  const handleCreate = () => {
    if (newTreeName.trim()) {
      const tree = createTree(newTreeName.trim());
      setCurrentTree(tree);
      setNewTreeName("");
      setIsCreateOpen(false);
    }
  };

  const handleStartRename = (tree: FamilyTree) => {
    setEditingTree(tree);
    setEditTreeName(tree.name);
  };

  const handleSaveRename = () => {
    if (editingTree && editTreeName.trim()) {
      updateTree({
        ...editingTree,
        name: editTreeName.trim(),
      });
      setEditingTree(null);
      setEditTreeName("");
    }
  };

  const handleConfirmDelete = () => {
    if (deletingTree) {
      deleteTree(deletingTree.id);
      setDeletingTree(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <TreePine className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Family Tree</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Tree
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your Family Trees</h2>
          <p className="text-muted-foreground">
            Create and manage your family trees. Click on a tree to view and edit.
          </p>
        </div>

        {trees.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TreePine className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No trees yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                Get started by creating your first family tree to document and visualize your heritage.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Tree
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <Card
                key={tree.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => setCurrentTree(tree)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-pastel-green flex items-center justify-center">
                      <TreePine className="w-6 h-6 text-foreground/70" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTree(tree);
                          }}
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(tree);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTree(tree);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{tree.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tree.members.length} member{tree.members.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated {formatDate(tree.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Tree Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Family Tree</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tree name..."
              value={newTreeName}
              onChange={(e) => setNewTreeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTreeName.trim()}>
              Create Tree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Tree Dialog */}
      <Dialog open={!!editingTree} onOpenChange={(open) => !open && setEditingTree(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Family Tree</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tree name..."
              value={editTreeName}
              onChange={(e) => setEditTreeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTree(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename} disabled={!editTreeName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingTree} onOpenChange={(open) => !open && setDeletingTree(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Tree</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingTree?.name}&rdquo;? This will permanently remove the tree, all its members, and relationships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTree(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete Tree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
