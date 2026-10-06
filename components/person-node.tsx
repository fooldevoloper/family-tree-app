"use client";

import React from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User, Calendar, Briefcase, Plus } from "lucide-react";

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    // Just year or short date
    return d.toLocaleDateString("en-US", { year: "numeric" });
  };

  const getGenderStyles = () => {
    switch (member.gender) {
      case "male":
        return {
          borderAccent: "border-sky-500/40 hover:border-sky-500/80",
          topBar: "bg-sky-500",
          badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
          avatarGradient: "from-sky-500/20 to-blue-600/30 text-sky-600 dark:text-sky-300",
          label: "Male",
          symbol: "♂",
        };
      case "female":
        return {
          borderAccent: "border-rose-500/40 hover:border-rose-500/80",
          topBar: "bg-rose-500",
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          avatarGradient: "from-rose-500/20 to-pink-600/30 text-rose-600 dark:text-rose-300",
          label: "Female",
          symbol: "♀",
        };
      default:
        return {
          borderAccent: "border-purple-500/40 hover:border-purple-500/80",
          topBar: "bg-purple-500",
          badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          avatarGradient: "from-purple-500/20 to-indigo-600/30 text-purple-600 dark:text-purple-300",
          label: "Other",
          symbol: "✦",
        };
    }
  };

  const g = getGenderStyles();
  const birthYear = formatDate(member.dateOfBirth);
  const deathYear = formatDate(member.dateOfDeath);

  return (
    <div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none group",
        "w-48 rounded-2xl border bg-card/95 backdrop-blur-md shadow-sm transition-all duration-200",
        g.borderAccent,
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-[1.02] border-primary"
          : "hover:shadow-md hover:-translate-y-0.5",
        isDimmed && "opacity-35 grayscale-[20%]"
      )}
      style={{
        left: member.x,
        top: member.y,
        width: 192,
        minHeight: 84,
      }}
      onMouseDown={(e) => onDragStart(member.id, e)}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedMemberId(member.id);
      }}
    >
      {/* Top accent line */}
      <div className={cn("h-1 w-full rounded-t-2xl opacity-80", g.topBar)} />

      {/* Top anchor dot for parent connector */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-border border border-background opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Card Content */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-xs ring-1 ring-border"
              />
            ) : (
              <div
                className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-xs border border-background shadow-xs ring-1 ring-border",
                  g.avatarGradient
                )}
              >
                {getInitials(member.name)}
              </div>
            )}
            {member.isDeceased && (
              <span
                className="absolute -bottom-1 -right-1 bg-background text-[10px] text-muted-foreground rounded-full px-1 border border-border shadow-2xs leading-none py-0.5"
                title="Deceased"
              >
                ✝
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-semibold text-foreground text-xs leading-tight truncate" title={member.name}>
                {member.name}
              </h4>
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.2 rounded-full border leading-normal shrink-0",
                  g.badgeBg
                )}
              >
                {g.symbol}
              </span>
            </div>

            {member.maidenName && (
              <p className="text-[10px] text-muted-foreground truncate italic">
                née {member.maidenName}
              </p>
            )}

            {/* Dates */}
            {(birthYear || deathYear || member.isDeceased) ? (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span>
                  {birthYear || "?"}
                  {deathYear ? ` – ${deathYear}` : member.isDeceased ? " – ✝" : ""}
                </span>
              </p>
            ) : null}

            {member.occupation && (
              <p className="text-[10px] text-primary/90 font-medium truncate mt-0.5">
                {member.occupation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom anchor dot for child connector */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-border border border-background opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
