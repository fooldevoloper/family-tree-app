"use client";

import { useState } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddRelationshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRelationshipModal({
  open,
  onOpenChange,
}: AddRelationshipModalProps) {
  const { currentTree, addRelationship } = useFamilyTree();
  const [personAId, setPersonAId] = useState("");
  const [personBId, setPersonBId] = useState("");
  const [relationshipType, setRelationshipType] = useState<
    "parent-child" | "spouse" | "sibling"
  >("parent-child");
  const [error, setError] = useState<string | null>(null);

  const members = currentTree?.members || [];

  const handleSubmit = () => {
    setError(null);
    if (!personAId || !personBId || personAId === personBId) {
      setError("Please select two different family members.");
      return;
    }

    // Check if relationship already exists
    const exists = currentTree?.relationships.some(
      (r) =>
        (r.personAId === personAId && r.personBId === personBId) ||
        (r.personAId === personBId && r.personBId === personAId)
    );

    if (exists) {
      setError("This relationship connection already exists.");
      return;
    }

    addRelationship({
      personAId,
      personBId,
      type: relationshipType,
    });

    toast.success("Relationship connection created");

    // Reset and close
    setPersonAId("");
    setPersonBId("");
    setError(null);
    setRelationshipType("parent-child");
    onOpenChange(false);
  };

  const handleClose = () => {
    setPersonAId("");
    setPersonBId("");
    setError(null);
    setRelationshipType("parent-child");
    onOpenChange(false);
  };

  const getRelationshipLabel = () => {
    switch (relationshipType) {
      case "parent-child":
        return "is the parent of";
      case "spouse":
        return "is married to";
      case "sibling":
        return "is a sibling of";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Create a connection between two family members.
          </DialogDescription>
        </DialogHeader>
        {members.length < 2 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              You need at least 2 family members to create a relationship.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Person A</Label>
              <Select value={personAId} onValueChange={setPersonAId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.id !== personBId)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Relationship Type</Label>
              <Select
                value={relationshipType}
                onValueChange={(value: "parent-child" | "spouse" | "sibling") =>
                  setRelationshipType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent-child">Parent → Child</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Person B</Label>
              <Select value={personBId} onValueChange={setPersonBId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.id !== personAId)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium text-center">
                {error}
              </div>
            )}

            {personAId && personBId && !error && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-center">
                <span className="font-medium">
                  {members.find((m) => m.id === personAId)?.name}
                </span>{" "}
                <span className="text-muted-foreground">{getRelationshipLabel()}</span>{" "}
                <span className="font-medium">
                  {members.find((m) => m.id === personBId)?.name}
                </span>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!personAId || !personBId || personAId === personBId}
          >
            Add Relationship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
