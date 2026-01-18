"use client";

import { useState } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddPersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    name?: string;
    gender?: "male" | "female" | "other";
  };
}

export function AddPersonModal({
  open,
  onOpenChange,
  initialData,
}: AddPersonModalProps) {
  const { addMember, currentTree } = useFamilyTree();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    gender: initialData?.gender || ("other" as "male" | "female" | "other"),
    dateOfBirth: "",
    dateOfDeath: "",
    photo: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    // Calculate position for new member
    const existingMembers = currentTree?.members || [];
    const baseX = 100;
    const baseY = 100;
    const spacing = 200;
    
    // Position new member to the right of the last one, or in a grid
    const row = Math.floor(existingMembers.length / 4);
    const col = existingMembers.length % 4;
    
    addMember({
      name: formData.name.trim(),
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth || undefined,
      dateOfDeath: formData.dateOfDeath || undefined,
      photo: formData.photo || undefined,
      notes: formData.notes || undefined,
      x: baseX + col * spacing,
      y: baseY + row * 150,
    });

    // Reset form and close
    setFormData({
      name: "",
      gender: "other",
      dateOfBirth: "",
      dateOfDeath: "",
      photo: "",
      notes: "",
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({
      name: "",
      gender: "other",
      dateOfBirth: "",
      dateOfDeath: "",
      photo: "",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value: "male" | "female" | "other") =>
                setFormData((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dod">Date of Death</Label>
              <Input
                id="dod"
                type="date"
                value={formData.dateOfDeath}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dateOfDeath: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photo">Photo URL</Label>
            <Input
              id="photo"
              placeholder="https://..."
              value={formData.photo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, photo: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
