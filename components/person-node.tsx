"use client";

import React from "react"

import { useFamilyTree } from "@/lib/family-tree-context";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface PersonNodeProps {
  member: Person;
  onDragStart: (memberId: string, e: React.MouseEvent) => void;
  isHighlighted: boolean;
  isDimmed: boolean;
}

export function PersonNode({
  member,
  onDragStart,
  isHighlighted,
  isDimmed,
}: PersonNodeProps) {
  const { selectedMemberId, setSelectedMemberId } = useFamilyTree();
  const isSelected = selectedMemberId === member.id;

  const genderColors = {
    male: "bg-pastel-blue border-pastel-blue",
    female: "bg-pastel-rose border-pastel-rose",
    other: "bg-pastel-lavender border-pastel-lavender",
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none",
        "w-44 rounded-xl border-2 bg-card shadow-sm transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDimmed && "opacity-40",
        !isDimmed && "hover:shadow-md",
        genderColors[member.gender]
      )}
      style={{
        left: member.x,
        top: member.y,
      }}
      onMouseDown={(e) => onDragStart(member.id, e)}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedMemberId(member.id);
      }}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {member.photo ? (
            <img
              src={member.photo || "/placeholder.svg"}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-background"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-background">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate text-sm">
              {member.name}
            </p>
            {member.dateOfBirth && (
              <p className="text-xs text-muted-foreground">
                {formatDate(member.dateOfBirth)}
                {member.dateOfDeath && ` - ${formatDate(member.dateOfDeath)}`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
