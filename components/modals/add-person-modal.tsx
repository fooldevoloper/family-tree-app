"use client";

import { useState, useRef } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, User } from "lucide-react";

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
  const { addMember, currentTree, setSelectedMemberId } = useFamilyTree();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    maidenName: "",
    gender: initialData?.gender || ("other" as "male" | "female" | "other"),
    dateOfBirth: "",
    placeOfBirth: "",
    isDeceased: false,
    dateOfDeath: "",
    placeOfDeath: "",
    occupation: "",
    photo: "",
    notes: "",
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setFormData((prev) => ({ ...prev, photo: event.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      maidenName: "",
      gender: "other",
      dateOfBirth: "",
      placeOfBirth: "",
      isDeceased: false,
      dateOfDeath: "",
      placeOfDeath: "",
      occupation: "",
      photo: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    // Calculate position for new member
    const existingMembers = currentTree?.members || [];
    const baseX = 100;
    const baseY = 100;
    const spacing = 200;

    const row = Math.floor(existingMembers.length / 4);
    const col = existingMembers.length % 4;

    const created = addMember({
      name: formData.name.trim(),
      maidenName: formData.maidenName.trim() || undefined,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth || undefined,
      placeOfBirth: formData.placeOfBirth.trim() || undefined,
      isDeceased: formData.isDeceased || Boolean(formData.dateOfDeath),
      dateOfDeath: formData.dateOfDeath || undefined,
      placeOfDeath: formData.placeOfDeath.trim() || undefined,
      occupation: formData.occupation.trim() || undefined,
      photo: formData.photo || undefined,
      notes: formData.notes || undefined,
      x: baseX + col * spacing,
      y: baseY + row * 150,
    });

    toast.success(`Added ${formData.name.trim()}`);
    setSelectedMemberId(created.id);
    handleResetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    handleResetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Photo upload section */}
          <div className="flex items-center gap-4">
            {formData.photo ? (
              <div className="relative group">
                <img
                  src={formData.photo}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                />
                <button
                  type="button"
                  className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow hover:bg-destructive/90"
                  onClick={() => setFormData((prev) => ({ ...prev, photo: "" }))}
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo
                </Button>
                {formData.photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setFormData((prev) => ({ ...prev, photo: "" }))}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Input
                placeholder="Or paste image URL..."
                value={formData.photo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, photo: e.target.value }))
                }
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Name & Maiden Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maidenName">Maiden Name</Label>
              <Input
                id="maidenName"
                placeholder="e.g. Smith"
                value={formData.maidenName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maidenName: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Gender & Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "male" | "female" | "other") =>
                  setFormData((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="e.g. Teacher, Engineer"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, occupation: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Birth details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
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
            <div className="grid gap-1.5">
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                placeholder="e.g. London, UK"
                value={formData.placeOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, placeOfBirth: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Deceased toggle */}
          <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDeceased" className="cursor-pointer font-medium">
                  Deceased
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark member as deceased
                </p>
              </div>
              <Switch
                id="isDeceased"
                checked={formData.isDeceased}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDeceased: checked }))
                }
              />
            </div>

            {formData.isDeceased && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="grid gap-1.5">
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
                <div className="grid gap-1.5">
                  <Label htmlFor="placeOfDeath">Place of Death</Label>
                  <Input
                    id="placeOfDeath"
                    placeholder="e.g. New York, USA"
                    value={formData.placeOfDeath}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, placeOfDeath: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes & Biography</Label>
            <Textarea
              id="notes"
              placeholder="Add historical records, stories, or achievements..."
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
