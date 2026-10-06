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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Menu,
  UserPlus,
  Link2,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function TreeEditor() {
  const { currentTree, setCurrentTree, selectedMemberId } = useFamilyTree();
  const canvasRef = useRef<TreeCanvasRef>(null);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  if (!currentTree) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.1).toFixed(2)), 0.4));
  const handleFitToScreen = () => {
    canvasRef.current?.fitToScreen();
  };
  const handleResetZoom = () => {
    canvasRef.current?.resetView();
  };

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
      <header className="border-b border-border bg-card px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
            onClick={() => setCurrentTree(null)}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <TreePine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[110px] sm:max-w-[200px] md:max-w-none">
              {currentTree.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 sm:pl-9 pr-7 sm:pr-8 w-28 sm:w-48 md:w-64 text-xs sm:text-sm h-8 sm:h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search Dropdown Results */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden z-50 py-1 max-h-60 overflow-y-auto">
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

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
            title="Open tree tools"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <EditorSidebar
          className="hidden md:flex"
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

          {/* Desktop Zoom Controls & Layout Tools */}
          <div className="hidden md:flex absolute bottom-4 right-4 items-center gap-1 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-md p-1.5 z-10">
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

          {/* Mobile Floating Action Dock (Easy Thumb Navigation) */}
          <div className="md:hidden absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-1 pointer-events-auto">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-9 px-2.5 text-xs font-medium"
                onClick={() => setIsAddPersonOpen(true)}
              >
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                <span>+ Member</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-9 px-2 text-xs font-medium"
                onClick={() => setIsAddRelationshipOpen(true)}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>+ Link</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary"
                onClick={() => canvasRef.current?.autoArrange()}
                title="Auto-Arrange"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-0.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-1 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleFitToScreen}
                title="Fit to Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Member Drawer (Desktop panel / Mobile bottom sheet) */}
        {selectedMemberId && <MemberDrawer />}
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-left">
              <TreePine className="w-4 h-4 text-primary" />
              <span className="truncate">{currentTree.name}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <EditorSidebar
              className="w-full border-r-0 border-none bg-transparent"
              onAddPerson={() => setIsAddPersonOpen(true)}
              onAddRelationship={() => setIsAddRelationshipOpen(true)}
              onAutoArrange={() => canvasRef.current?.autoArrange()}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <AddPersonModal open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen} />
      <AddRelationshipModal
        open={isAddRelationshipOpen}
        onOpenChange={setIsAddRelationshipOpen}
      />
    </div>
  );
}
