"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { PersonNode } from "./person-node";
import {
  FamilyTreeGraphLines,
  NODE_WIDTH,
  NODE_HEIGHT,
} from "./relationship-line";
import { computeTreeLayout } from "@/lib/graph-layout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TreeCanvasRef {
  fitToScreen: () => void;
  resetView: () => void;
  centerOnMember: (memberId: string) => void;
  autoArrange: () => void;
}

interface TreeCanvasProps {
  zoom: number;
  onZoomChange?: (zoom: number | ((prev: number) => number)) => void;
  searchQuery: string;
}

export const TreeCanvas = forwardRef<TreeCanvasRef, TreeCanvasProps>(
  function TreeCanvas({ zoom, onZoomChange, searchQuery }, ref) {
    const {
      currentTree,
      updateTree,
      updateMember,
      selectedMemberId,
      setSelectedMemberId,
    } = useFamilyTree();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const [draggingMemberId, setDraggingMemberId] = useState<string | null>(
      null
    );
    const [dragStart, setDragStart] = useState({
      x: 0,
      y: 0,
      memberX: 0,
      memberY: 0,
    });
    const [draggedPos, setDraggedPos] = useState<{
      id: string;
      x: number;
      y: number;
    } | null>(null);

    const fitToScreen = useCallback(() => {
      if (
        !canvasRef.current ||
        !currentTree ||
        currentTree.members.length === 0
      ) {
        setOffset({ x: 0, y: 0 });
        onZoomChange?.(1);
        return;
      }

      const PADDING = 80;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      currentTree.members.forEach((m) => {
        minX = Math.min(minX, m.x);
        minY = Math.min(minY, m.y);
        maxX = Math.max(maxX, m.x + NODE_WIDTH);
        maxY = Math.max(maxY, m.y + NODE_HEIGHT);
      });

      const boundsWidth = Math.max(maxX - minX, 100);
      const boundsHeight = Math.max(maxY - minY, 100);

      const containerWidth = canvasRef.current.clientWidth;
      const containerHeight = canvasRef.current.clientHeight;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const targetZoomX = (containerWidth - PADDING * 2) / boundsWidth;
      const targetZoomY = (containerHeight - PADDING * 2) / boundsHeight;
      const calculatedZoom = Math.min(
        Math.max(Math.min(targetZoomX, targetZoomY), 0.4),
        1.5
      );
      const newZoom = Number(calculatedZoom.toFixed(2));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const newOffsetX = containerWidth / 2 - centerX * newZoom;
      const newOffsetY = containerHeight / 2 - centerY * newZoom;

      setOffset({ x: Math.round(newOffsetX), y: Math.round(newOffsetY) });
      onZoomChange?.(newZoom);
    }, [currentTree, onZoomChange]);

    const resetView = useCallback(() => {
      setOffset({ x: 0, y: 0 });
      onZoomChange?.(1);
    }, [onZoomChange]);

    const centerOnMember = useCallback(
      (memberId: string) => {
        if (!canvasRef.current || !currentTree) return;
        const member = currentTree.members.find((m) => m.id === memberId);
        if (!member) return;

        const containerWidth = canvasRef.current.clientWidth;
        const containerHeight = canvasRef.current.clientHeight;

        const memberCenterX = member.x + NODE_WIDTH / 2;
        const memberCenterY = member.y + NODE_HEIGHT / 2;

        const newOffsetX = containerWidth / 2 - memberCenterX * zoom;
        const newOffsetY = containerHeight / 2 - memberCenterY * zoom;

        setOffset({ x: Math.round(newOffsetX), y: Math.round(newOffsetY) });
        setSelectedMemberId(memberId);
      },
      [currentTree, zoom, setSelectedMemberId]
    );

    const autoArrange = useCallback(() => {
      if (!currentTree || currentTree.members.length === 0) return;
      const tidiedMembers = computeTreeLayout(
        currentTree.members,
        currentTree.relationships
      );
      updateTree({
        ...currentTree,
        members: tidiedMembers,
      });
      setTimeout(() => {
        fitToScreen();
      }, 60);
      toast.success("Arranged tree into clean graph layout");
    }, [currentTree, updateTree, fitToScreen]);

    useImperativeHandle(
      ref,
      () => ({
        fitToScreen,
        resetView,
        centerOnMember,
        autoArrange,
      }),
      [fitToScreen, resetView, centerOnMember, autoArrange]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 0 && !draggingMemberId) {
          setIsPanning(true);
          setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
      },
      [offset, draggingMemberId]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isPanning && !draggingMemberId) {
          setOffset({
            x: e.clientX - startPan.x,
            y: e.clientY - startPan.y,
          });
        }

        if (draggingMemberId) {
          const deltaX = (e.clientX - dragStart.x) / zoom;
          const deltaY = (e.clientY - dragStart.y) / zoom;
          setDraggedPos({
            id: draggingMemberId,
            x: Math.round(dragStart.memberX + deltaX),
            y: Math.round(dragStart.memberY + deltaY),
          });
        }
      },
      [isPanning, startPan, draggingMemberId, dragStart, zoom]
    );

    const handleMouseUp = useCallback(() => {
      if (draggedPos && currentTree) {
        const member = currentTree.members.find((m) => m.id === draggedPos.id);
        if (
          member &&
          (member.x !== draggedPos.x || member.y !== draggedPos.y)
        ) {
          updateMember({
            ...member,
            x: draggedPos.x,
            y: draggedPos.y,
          });
        }
      }
      setIsPanning(false);
      setDraggingMemberId(null);
      setDraggedPos(null);
    }, [draggedPos, currentTree, updateMember]);

    const handleNodeDragStart = useCallback(
      (memberId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const member = currentTree?.members.find((m) => m.id === memberId);
        if (member) {
          setDraggingMemberId(memberId);
          setDragStart({
            x: e.clientX,
            y: e.clientY,
            memberX: member.x,
            memberY: member.y,
          });
          setDraggedPos({
            id: memberId,
            x: member.x,
            y: member.y,
          });
        }
      },
      [currentTree]
    );

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (
          e.target === canvasRef.current ||
          (e.target as HTMLElement).dataset.canvas === "true"
        ) {
          setSelectedMemberId(null);
        }
      },
      [setSelectedMemberId]
    );

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedMemberId(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setSelectedMemberId]);

    // Trackpad / wheel support for smooth panning and pinch zoom
    useEffect(() => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Pinch to zoom
          const zoomFactor = -e.deltaY * 0.005;
          onZoomChange?.((prev) => {
            const next = Math.min(Math.max(prev + zoomFactor, 0.4), 2);
            return Number(next.toFixed(2));
          });
        } else {
          // Pan canvas
          setOffset((prev) => ({
            x: Math.round(prev.x - e.deltaX),
            y: Math.round(prev.y - e.deltaY),
          }));
        }
      };

      canvasEl.addEventListener("wheel", handleWheel, { passive: false });
      return () => canvasEl.removeEventListener("wheel", handleWheel);
    }, [onZoomChange]);

    // Effective members with real-time drag position
    const effectiveMembers = useMemo(() => {
      if (!currentTree) return [];
      if (!draggedPos) return currentTree.members;
      return currentTree.members.map((m) =>
        m.id === draggedPos.id
          ? { ...m, x: draggedPos.x, y: draggedPos.y }
          : m
      );
    }, [currentTree, draggedPos]);

    const filteredMembers = effectiveMembers.filter((member) =>
      searchQuery
        ? member.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

    const highlightedMemberIds = searchQuery
      ? new Set(filteredMembers.map((m) => m.id))
      : null;

    if (!currentTree) return null;

    return (
      <div
        ref={canvasRef}
        className={cn(
          "w-full h-full overflow-hidden bg-muted/20 relative select-none",
          isPanning && !draggingMemberId ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        data-canvas="true"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1.2px, transparent 1.2px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
          }}
          data-canvas="true"
        />

        {/* Canvas content */}
        <div
          className="absolute"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          data-canvas="true"
        >
          {/* Hierarchical Graph Structure Lines */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: "8000px", height: "8000px", overflow: "visible" }}
          >
            <FamilyTreeGraphLines
              relationships={currentTree.relationships}
              members={effectiveMembers}
              selectedMemberId={selectedMemberId}
            />
          </svg>

          {/* Person nodes */}
          {effectiveMembers.map((member) => (
            <PersonNode
              key={member.id}
              member={member}
              onDragStart={handleNodeDragStart}
              isHighlighted={
                highlightedMemberIds === null ||
                highlightedMemberIds.has(member.id)
              }
              isDimmed={
                highlightedMemberIds !== null &&
                !highlightedMemberIds.has(member.id)
              }
            />
          ))}

          {/* Empty state indicator */}
          {currentTree.members.length === 0 && (
            <div
              className="absolute flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-card/60 border border-border/60 shadow-lg backdrop-blur-md"
              style={{ left: "300px", top: "200px", width: "360px" }}
              data-canvas="true"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                <span className="text-2xl">🌱</span>
              </div>
              <p className="font-semibold text-foreground text-base mb-1">
                Your tree is empty
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Add your first family member from the sidebar or click &ldquo;Add Member&rdquo; to begin mapping your lineage.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
