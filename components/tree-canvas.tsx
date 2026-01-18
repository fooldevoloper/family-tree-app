"use client";

import React from "react"

import { useRef, useState, useCallback, useEffect } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { PersonNode } from "./person-node";
import { RelationshipLine } from "./relationship-line";
import { cn } from "@/lib/utils";

interface TreeCanvasProps {
  zoom: number;
  searchQuery: string;
}

export function TreeCanvas({ zoom, searchQuery }: TreeCanvasProps) {
  const { currentTree, updateMember, setSelectedMemberId } = useFamilyTree();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, memberX: 0, memberY: 0 });

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

      if (draggingMemberId && currentTree) {
        const member = currentTree.members.find((m) => m.id === draggingMemberId);
        if (member) {
          const deltaX = (e.clientX - dragStart.x) / zoom;
          const deltaY = (e.clientY - dragStart.y) / zoom;
          updateMember({
            ...member,
            x: dragStart.memberX + deltaX,
            y: dragStart.memberY + deltaY,
          });
        }
      }
    },
    [isPanning, startPan, draggingMemberId, currentTree, dragStart, zoom, updateMember]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingMemberId(null);
  }, []);

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
      }
    },
    [currentTree]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === "true") {
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

  const filteredMembers = currentTree?.members.filter((member) =>
    searchQuery
      ? member.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const highlightedMemberIds = searchQuery
    ? new Set(filteredMembers?.map((m) => m.id))
    : null;

  if (!currentTree) return null;

  return (
    <div
      ref={canvasRef}
      className={cn(
        "w-full h-full overflow-hidden bg-muted/30 relative",
        isPanning && !draggingMemberId ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      data-canvas="true"
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
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
        {/* Relationship lines */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: "5000px", height: "5000px", overflow: "visible" }}
        >
          {currentTree.relationships.map((relationship) => (
            <RelationshipLine
              key={relationship.id}
              relationship={relationship}
              members={currentTree.members}
            />
          ))}
        </svg>

        {/* Person nodes */}
        {currentTree.members.map((member) => (
          <PersonNode
            key={member.id}
            member={member}
            onDragStart={handleNodeDragStart}
            isHighlighted={highlightedMemberIds === null || highlightedMemberIds.has(member.id)}
            isDimmed={highlightedMemberIds !== null && !highlightedMemberIds.has(member.id)}
          />
        ))}

        {/* Empty state indicator */}
        {currentTree.members.length === 0 && (
          <div
            className="absolute flex flex-col items-center justify-center text-center"
            style={{ left: "300px", top: "200px" }}
            data-canvas="true"
          >
            <p className="text-muted-foreground text-lg mb-2">No members yet</p>
            <p className="text-muted-foreground/70 text-sm">
              Click "Add Member" in the sidebar to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
