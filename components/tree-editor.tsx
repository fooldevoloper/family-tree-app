"use client";

import { useState, useRef } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { TreeCanvas, type TreeCanvasRef } from "./tree-canvas";
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
  RotateCcw,
  X,
  User,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function TreeEditor() {
  const { currentTree, setCurrentTree, selectedMemberId } = useFamilyTree();
  const canvasRef = useRef<TreeCanvasRef>(null);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);

  if (!currentTree) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.1).toFixed(2)), 0.4));
  const handleFitToScreen = () => {
    canvasRef.current?.fitToScreen();
  };
  const handleResetZoom = () => {
    canvasRef.current?.resetView();
  };

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = currentTree && searchQuery.trim()
    ? currentTree.members.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  const handleSelectSearchResult = (memberId: string) => {
    canvasRef.current?.centerOnMember(memberId);
    setIsSearchFocused(false);
  };

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
              className="pl-9 pr-8 w-64 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search Dropdown Results */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden z-50 py-1 max-h-60 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                    No members found
                  </p>
                ) : (
                  searchResults.map((m) => (
                    <button
                      key={m.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors cursor-pointer text-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSearchResult(m.id);
                      }}
                    >
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-foreground text-xs">
                          {m.name}
                        </p>
                        {m.occupation && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {m.occupation}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <EditorSidebar
          onAddPerson={() => setIsAddPersonOpen(true)}
          onAddRelationship={() => setIsAddRelationshipOpen(true)}
          onAutoArrange={() => canvasRef.current?.autoArrange()}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <TreeCanvas
            ref={canvasRef}
            zoom={zoom}
            onZoomChange={setZoom}
            searchQuery={searchQuery}
          />

          {/* Zoom Controls & Layout Tools */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-md p-1.5 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => canvasRef.current?.autoArrange()}
              title="Auto-arrange tree into clean graph layout"
              className="text-primary hover:text-primary hover:bg-primary/10 h-7 w-7"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom out"
              className="h-7 w-7"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              title="Zoom in"
              className="h-7 w-7"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFitToScreen}
              title="Fit tree to screen"
              className="h-7 w-7"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetZoom}
              title="Reset view (100%)"
              className="h-7 w-7"
            >
              <RotateCcw className="w-3.5 h-3.5" />
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
