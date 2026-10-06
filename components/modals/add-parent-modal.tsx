"use client";

import React, { useState, useEffect } from "react";
import { useFamilyTree, type RelationshipInput } from "@/lib/family-tree-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UserCheck, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddParentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childMemberId: string | null;
}

export function AddParentModal({
  open,
  onOpenChange,
  childMemberId,
}: AddParentModalProps) {
  const { currentTree, addMemberWithRelationships, setSelectedMemberId } =
    useFamilyTree();

  const child = currentTree?.members.find((m) => m.id === childMemberId);

  // Check existing parents of child
  const existingParentRels = (currentTree?.relationships || []).filter(
    (r) => r.personBId === childMemberId && r.type === "parent-child"
  );
  const existingParents = (currentTree?.members || []).filter((m) =>
    existingParentRels.some((r) => r.personAId === m.id)
  );

  const existingFather = existingParents.find((p) => p.gender === "male");
  const existingMother = existingParents.find((p) => p.gender === "female");

  // Default selection based on what already exists
  const recommendedType: "mother" | "father" = existingFather
    ? "mother"
    : existingMother
    ? "father"
    : "mother";

  const [parentType, setParentType] = useState<"mother" | "father">("mother");
  const [name, setName] = useState("");
  const [maidenName, setMaidenName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [linkAsSpouse, setLinkAsSpouse] = useState(true);
  const [linkToSiblings, setLinkToSiblings] = useState(true);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      const type = recommendedType;
      setParentType(type);
      setName(type === "mother" ? "Mother" : "Father");
      setMaidenName("");
      setDateOfBirth("");
      setIsDeceased(false);
      setDateOfDeath("");
      setLinkAsSpouse(true);
      setLinkToSiblings(true);
    }
  }, [open, recommendedType]);

  const handleSelectType = (type: "mother" | "father") => {
    setParentType(type);
    if (!name || name === "Mother" || name === "Father") {
      setName(type === "mother" ? "Mother" : "Father");
    }
  };

  // Find siblings of child
  const siblingRels = (currentTree?.relationships || []).filter(
    (r) =>
      (r.personAId === childMemberId || r.personBId === childMemberId) &&
      r.type === "sibling"
  );
  const siblingIds = siblingRels.map((r) =>
    r.personAId === childMemberId ? r.personBId : r.personAId
  );
  const siblings = (currentTree?.members || []).filter((m) =>
    siblingIds.includes(m.id)
  );

  // Other children of the existing parent
  const existingOtherChildren =
    existingParents.length > 0
      ? (currentTree?.relationships || [])
          .filter(
            (r) =>
              existingParents.some((p) => p.id === r.personAId) &&
              r.type === "parent-child" &&
              r.personBId !== childMemberId
          )
          .map((r) => r.personBId)
      : [];

  const allCoChildrenIds = Array.from(
    new Set([...siblingIds, ...existingOtherChildren])
  );

  if (!child || !currentTree) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    const gender: "female" | "male" =
      parentType === "mother" ? "female" : "male";

    // Calculate positioning
    let posX = child.x - 110;
    let posY = child.y - 150;

    if (existingParents.length === 1) {
      const firstParent = existingParents[0];
      if (parentType === "father") {
        // Position Father to the left or right of Mother
        posX = firstParent.x - 220;
        posY = firstParent.y;
      } else {
        // Position Mother to the right of Father
        posX = firstParent.x + 220;
        posY = firstParent.y;
      }
    } else if (existingParents.length >= 2) {
      const lastParent = existingParents[existingParents.length - 1];
      posX = lastParent.x + 220;
      posY = lastParent.y;
    }

    // Build relationships to establish
    const relsToAdd: RelationshipInput[] = [
      {
        personAId: "$NEW_MEMBER",
        personBId: child.id,
        type: "parent-child",
      },
    ];

    // Link as spouse to existing parent
    if (linkAsSpouse && existingParents.length > 0) {
      const partner =
        parentType === "mother"
          ? existingFather || existingParents[0]
          : existingMother || existingParents[0];
      if (partner) {
        relsToAdd.push({
          personAId: partner.id,
          personBId: "$NEW_MEMBER",
          type: "spouse",
        });
      }
    }

    // Link as parent to siblings / co-children
    if (linkToSiblings && allCoChildrenIds.length > 0) {
      allCoChildrenIds.forEach((sibId) => {
        relsToAdd.push({
          personAId: "$NEW_MEMBER",
          personBId: sibId,
          type: "parent-child",
        });
      });
    }

    const newMember = addMemberWithRelationships(
      {
        name: name.trim(),
        maidenName:
          parentType === "mother" && maidenName.trim()
            ? maidenName.trim()
            : undefined,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        isDeceased,
        dateOfDeath: isDeceased && dateOfDeath ? dateOfDeath : undefined,
        x: posX,
        y: posY,
      },
      relsToAdd
    );

    toast.success(
      `Added ${parentType === "mother" ? "Mother" : "Father"} (${name.trim()}) for ${child.name}`
    );
    setSelectedMemberId(newMember.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Add Parent
          </DialogTitle>
          <DialogDescription>
            Choose whether to add a Mother or Father for{" "}
            <span className="font-semibold text-foreground">{child.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Parent Type Selection Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mother Card */}
            <button
              type="button"
              onClick={() => handleSelectType("mother")}
              className={cn(
                "p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between",
                parentType === "mother"
                  ? "border-rose-500 bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                  : "border-border hover:border-rose-500/50 hover:bg-muted/50"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl" role="img" aria-label="Mother">
                    👩
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    Female
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-foreground">Mother</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Maternal lineage
                </p>
              </div>

              {existingMother && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  Current: {existingMother.name}
                </p>
              )}
              {!existingMother && existingFather && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-2">
                  ★ Recommended
                </span>
              )}
            </button>

            {/* Father Card */}
            <button
              type="button"
              onClick={() => handleSelectType("father")}
              className={cn(
                "p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between",
                parentType === "father"
                  ? "border-sky-500 bg-sky-500/10 shadow-sm ring-1 ring-sky-500/30"
                  : "border-border hover:border-sky-500/50 hover:bg-muted/50"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl" role="img" aria-label="Father">
                    👨
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    Male
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-foreground">Father</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Paternal lineage
                </p>
              </div>

              {existingFather && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  Current: {existingFather.name}
                </p>
              )}
              {!existingFather && existingMother && (
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-2">
                  ★ Recommended
                </span>
              )}
            </button>
          </div>

          {/* Name Field */}
          <div className="grid gap-1.5">
            <Label htmlFor="parent-name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="parent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={parentType === "mother" ? "e.g. Jane Smith" : "e.g. John Doe"}
              autoFocus
            />
          </div>

          {/* Maiden Name (Mother only) */}
          {parentType === "mother" && (
            <div className="grid gap-1.5">
              <Label htmlFor="maiden-name">
                Maiden Name <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="maiden-name"
                value={maidenName}
                onChange={(e) => setMaidenName(e.target.value)}
                placeholder="Birth surname"
              />
            </div>
          )}

          {/* Date of Birth */}
          <div className="grid gap-1.5">
            <Label htmlFor="parent-dob">Date of Birth</Label>
            <Input
              id="parent-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          {/* Deceased Toggle */}
          <div className="flex items-center justify-between py-1">
            <Label htmlFor="parent-deceased" className="cursor-pointer">
              Is Deceased
            </Label>
            <Switch
              id="parent-deceased"
              checked={isDeceased}
              onCheckedChange={setIsDeceased}
            />
          </div>

          {isDeceased && (
            <div className="grid gap-1.5">
              <Label htmlFor="parent-dod">Date of Death</Label>
              <Input
                id="parent-dod"
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
              />
            </div>
          )}

          {/* Relationship Connection Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-border text-xs">
            {existingParents.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={linkAsSpouse}
                  onChange={(e) => setLinkAsSpouse(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  Link as spouse to{" "}
                  <strong className="text-foreground">
                    {existingParents[0].name}
                  </strong>
                </span>
              </label>
            )}

            {allCoChildrenIds.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={linkToSiblings}
                  onChange={(e) => setLinkToSiblings(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>
                  Link as parent to {allCoChildrenIds.length} sibling(s)
                </span>
              </label>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Add {parentType === "mother" ? "Mother" : "Father"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
