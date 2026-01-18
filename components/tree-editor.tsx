"use client";

import { useState } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { TreeCanvas } from "./tree-canvas";
import { EditorSidebar } from "./editor-sidebar";
import { MemberDrawer } from "./member-drawer";
import { AddPersonModal } from "./modals/add-person-modal";
import { AddRelationshipModal } from "./modals/add-relationship-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  TreePine,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function TreeEditor() {
  const { currentTree, setCurrentTree, selectedMemberId } = useFamilyTree();
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);

  if (!currentTree) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentTree(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TreePine className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-foreground">{currentTree.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <EditorSidebar
          onAddPerson={() => setIsAddPersonOpen(true)}
          onAddRelationship={() => setIsAddRelationshipOpen(true)}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <TreeCanvas zoom={zoom} searchQuery={searchQuery} />

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-card border border-border rounded-lg shadow-sm p-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={handleResetZoom}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Member Drawer */}
        {selectedMemberId && <MemberDrawer />}
      </div>

      {/* Modals */}
      <AddPersonModal open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen} />
      <AddRelationshipModal
        open={isAddRelationshipOpen}
        onOpenChange={setIsAddRelationshipOpen}
      />
    </div>
  );
}
