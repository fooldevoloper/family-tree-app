"use client";

import { useState, useRef } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  X,
  User,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Heart,
  Link2,
  Unlink,
  Save,
  Upload,
  UserCheck,
  Briefcase,
  MapPin,
} from "lucide-react";
import { AddParentModal } from "./modals/add-parent-modal";
import { useIsMobile } from "@/components/ui/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function MemberDrawer() {
  const {
    currentTree,
    selectedMemberId,
    setSelectedMemberId,
    updateMember,
    deleteMember,
    addMemberWithRelationships,
    deleteRelationship,
  } = useFamilyTree();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isAddParentOpen, setIsAddParentOpen] = useState(false);
  const [editData, setEditData] = useState<{
    name: string;
    maidenName: string;
    gender: "male" | "female" | "other";
    dateOfBirth: string;
    placeOfBirth: string;
    isDeceased: boolean;
    dateOfDeath: string;
    placeOfDeath: string;
    occupation: string;
    photo: string;
    notes: string;
  } | null>(null);

  const member = currentTree?.members.find((m) => m.id === selectedMemberId);

  if (!member || !currentTree) return null;

  // Filter out any orphan relationships where the other person does not exist
  const relationships = currentTree.relationships.filter(
    (r) =>
      (r.personAId === member.id || r.personBId === member.id) &&
      currentTree.members.some(
        (m) => m.id === (r.personAId === member.id ? r.personBId : r.personAId)
      )
  );

  const getRelatedMember = (relationship: typeof relationships[0]) => {
    const relatedId =
      relationship.personAId === member.id
        ? relationship.personBId
        : relationship.personAId;
    return currentTree.members.find((m) => m.id === relatedId);
  };

  const getRelationshipLabel = (relationship: typeof relationships[0]) => {
    const isPersonA = relationship.personAId === member.id;
    switch (relationship.type) {
      case "parent-child":
        return isPersonA ? "Child" : "Parent";
      case "spouse":
        return "Spouse";
      case "sibling":
        return "Sibling";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const startEditing = () => {
    setEditData({
      name: member.name,
      maidenName: member.maidenName || "",
      gender: member.gender,
      dateOfBirth: member.dateOfBirth || "",
      placeOfBirth: member.placeOfBirth || "",
      isDeceased: Boolean(member.isDeceased || member.dateOfDeath),
      dateOfDeath: member.dateOfDeath || "",
      placeOfDeath: member.placeOfDeath || "",
      occupation: member.occupation || "",
      photo: member.photo || "",
      notes: member.notes || "",
    });
    setIsEditing(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setEditData((prev) => (prev ? { ...prev, photo: event.target?.result as string } : null));
      }
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = () => {
    if (!editData || !editData.name.trim()) return;
    updateMember({
      ...member,
      name: editData.name.trim(),
      maidenName: editData.maidenName.trim() || undefined,
      gender: editData.gender,
      dateOfBirth: editData.dateOfBirth || undefined,
      placeOfBirth: editData.placeOfBirth.trim() || undefined,
      isDeceased: editData.isDeceased || Boolean(editData.dateOfDeath),
      dateOfDeath: editData.dateOfDeath || undefined,
      placeOfDeath: editData.placeOfDeath.trim() || undefined,
      occupation: editData.occupation.trim() || undefined,
      photo: editData.photo || undefined,
      notes: editData.notes || undefined,
    });
    setIsEditing(false);
    setEditData(null);
    toast.success("Profile updated");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleAddParent = () => {
    setIsAddParentOpen(true);
  };

  const handleAddChild = () => {
    if (!currentTree || !member) return;

    // Find spouse(s) of member
    const spouseRels = currentTree.relationships.filter(
      (r) => (r.personAId === member.id || r.personBId === member.id) && r.type === "spouse"
    );
    const spouses = currentTree.members.filter((m) =>
      spouseRels.some((r) => r.personAId === m.id || r.personBId === m.id)
    );

    // Find existing children
    const existingChildRels = currentTree.relationships.filter(
      (r) => r.personAId === member.id && r.type === "parent-child"
    );
    const existingChildren = currentTree.members.filter((m) =>
      existingChildRels.some((r) => r.personBId === m.id)
    );

    let posX = member.x;
    const posY = member.y + 150;

    if (existingChildren.length === 0) {
      if (spouses.length > 0) {
        posX = Math.round((member.x + spouses[0].x) / 2);
      } else {
        posX = member.x;
      }
    } else {
      const maxChildX = Math.max(...existingChildren.map((c) => c.x));
      posX = maxChildX + 220;
    }

    const relsToAdd: Array<{
      personAId?: string;
      personBId?: string;
      type: "parent-child" | "spouse" | "sibling";
    }> = [
      {
        personAId: member.id,
        personBId: "$NEW_MEMBER",
        type: "parent-child",
      },
    ];

    // If spouse exists, link spouse as parent too
    spouses.forEach((sp) => {
      relsToAdd.push({
        personAId: sp.id,
        personBId: "$NEW_MEMBER",
        type: "parent-child",
      });
    });

    const newMember = addMemberWithRelationships(
      {
        name: "Child",
        gender: "other",
        x: posX,
        y: posY,
      },
      relsToAdd
    );

    toast.success(`Added Child for ${member.name}`);
    setSelectedMemberId(newMember.id);
  };

  const handleAddSpouse = () => {
    if (!currentTree || !member) return;

    const spouseRels = currentTree.relationships.filter(
      (r) => (r.personAId === member.id || r.personBId === member.id) && r.type === "spouse"
    );
    const existingSpouses = currentTree.members.filter((m) =>
      spouseRels.some((r) => r.personAId === m.id || r.personBId === m.id)
    );

    const defaultGender: "male" | "female" | "other" =
      member.gender === "male" ? "female" : member.gender === "female" ? "male" : "female";
    const defaultName = defaultGender === "female" ? "Wife" : "Husband";

    let posX = member.x + 220;
    if (existingSpouses.length > 0) {
      const maxX = Math.max(member.x, ...existingSpouses.map((s) => s.x));
      posX = maxX + 220;
    }

    const relsToAdd: Array<{
      personAId?: string;
      personBId?: string;
      type: "parent-child" | "spouse" | "sibling";
    }> = [
      {
        personAId: member.id,
        personBId: "$NEW_MEMBER",
        type: "spouse",
      },
    ];

    const newMember = addMemberWithRelationships(
      {
        name: defaultName,
        gender: defaultGender,
        x: posX,
        y: member.y,
      },
      relsToAdd
    );

    toast.success(`Added ${defaultName} for ${member.name}`);
    setSelectedMemberId(newMember.id);
  };

  const handleAddSibling = () => {
    if (!currentTree || !member) return;

    // Find member's parents
    const parentRels = currentTree.relationships.filter(
      (r) => r.personBId === member.id && r.type === "parent-child"
    );
    const parents = currentTree.members.filter((m) =>
      parentRels.some((r) => r.personAId === m.id)
    );

    // Find other siblings
    const siblingRels = currentTree.relationships.filter(
      (r) => (r.personAId === member.id || r.personBId === member.id) && r.type === "sibling"
    );
    const existingSiblings = currentTree.members.filter((m) =>
      siblingRels.some((r) => r.personAId === m.id || r.personBId === m.id)
    );

    const parentChildren = parents.length > 0
      ? currentTree.members.filter((m) =>
          currentTree.relationships.some(
            (r) => parents.some((p) => p.id === r.personAId) && r.personBId === m.id && m.id !== member.id
          )
        )
      : [];

    const allSiblings = Array.from(new Set([...existingSiblings, ...parentChildren]));
    const maxX = Math.max(member.x, ...allSiblings.map((s) => s.x));
    const posX = maxX + 220;

    const relsToAdd: Array<{
      personAId?: string;
      personBId?: string;
      type: "parent-child" | "spouse" | "sibling";
    }> = [
      {
        personAId: member.id,
        personBId: "$NEW_MEMBER",
        type: "sibling",
      },
    ];

    parents.forEach((p) => {
      relsToAdd.push({
        personAId: p.id,
        personBId: "$NEW_MEMBER",
        type: "parent-child",
      });
    });

    allSiblings.forEach((sib) => {
      relsToAdd.push({
        personAId: sib.id,
        personBId: "$NEW_MEMBER",
        type: "sibling",
      });
    });

    const newMember = addMemberWithRelationships(
      {
        name: "Sibling",
        gender: "other",
        x: posX,
        y: member.y,
      },
      relsToAdd
    );

    toast.success(`Added Sibling for ${member.name}`);
    setSelectedMemberId(newMember.id);
  };

  const handleDelete = () => {
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMember(member.id);
    setIsDeleteAlertOpen(false);
    toast.success(`Deleted ${member.name}`);
  };

  const isMobile = useIsMobile();

  const drawerContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-foreground">
          {isEditing ? "Edit Profile" : "Member Profile"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedMemberId(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEditing && editData ? (
          /* Edit Mode */
          <div className="p-4 space-y-4">
            {/* Photo upload section */}
            <div className="flex items-center gap-3">
              {editData.photo ? (
                <div className="relative group">
                  <img
                    src={editData.photo}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full shadow hover:bg-destructive/90"
                    onClick={() => setEditData((prev) => (prev ? { ...prev, photo: "" } : null))}
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-1">
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
                  className="gap-1.5 text-xs h-7"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo
                </Button>
                <Input
                  placeholder="Or image URL..."
                  value={editData.photo}
                  onChange={(e) =>
                    setEditData((prev) => (prev ? { ...prev, photo: e.target.value } : null))
                  }
                  className="text-xs h-7"
                />
              </div>
            </div>

            {/* Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) =>
                  setEditData((prev) => (prev ? { ...prev, name: e.target.value } : null))
                }
              />
            </div>

            {/* Maiden Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-maiden">Maiden Name</Label>
              <Input
                id="edit-maiden"
                placeholder="e.g. Miller"
                value={editData.maidenName}
                onChange={(e) =>
                  setEditData((prev) => (prev ? { ...prev, maidenName: e.target.value } : null))
                }
              />
            </div>

            {/* Gender & Occupation */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select
                  value={editData.gender}
                  onValueChange={(value: "male" | "female" | "other") =>
                    setEditData((prev) => (prev ? { ...prev, gender: value } : null))
                  }
                >
                  <SelectTrigger id="edit-gender">
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
                <Label htmlFor="edit-occupation">Occupation</Label>
                <Input
                  id="edit-occupation"
                  placeholder="e.g. Architect"
                  value={editData.occupation}
                  onChange={(e) =>
                    setEditData((prev) => (prev ? { ...prev, occupation: e.target.value } : null))
                  }
                />
              </div>
            </div>

            {/* Birth Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-dob">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editData.dateOfBirth}
                  onChange={(e) =>
                    setEditData((prev) => (prev ? { ...prev, dateOfBirth: e.target.value } : null))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-pob">Birthplace</Label>
                <Input
                  id="edit-pob"
                  placeholder="e.g. Paris, France"
                  value={editData.placeOfBirth}
                  onChange={(e) =>
                    setEditData((prev) => (prev ? { ...prev, placeOfBirth: e.target.value } : null))
                  }
                />
              </div>
            </div>

            {/* Deceased toggle */}
            <div className="rounded-lg border border-border p-2.5 space-y-2.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="edit-deceased" className="cursor-pointer text-xs font-medium">
                    Deceased
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Mark as deceased</p>
                </div>
                <Switch
                  id="edit-deceased"
                  checked={editData.isDeceased}
                  onCheckedChange={(checked) =>
                    setEditData((prev) => (prev ? { ...prev, isDeceased: checked } : null))
                  }
                />
              </div>

              {editData.isDeceased && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="grid gap-1">
                    <Label htmlFor="edit-dod" className="text-xs">Death Date</Label>
                    <Input
                      id="edit-dod"
                      type="date"
                      value={editData.dateOfDeath}
                      onChange={(e) =>
                        setEditData((prev) => (prev ? { ...prev, dateOfDeath: e.target.value } : null))
                      }
                      className="text-xs"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="edit-pod" className="text-xs">Death Place</Label>
                    <Input
                      id="edit-pod"
                      placeholder="e.g. Rome"
                      value={editData.placeOfDeath}
                      onChange={(e) =>
                        setEditData((prev) => (prev ? { ...prev, placeOfDeath: e.target.value } : null))
                      }
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-notes">Notes & Biography</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={editData.notes}
                onChange={(e) =>
                  setEditData((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={saveEdit}>
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            {/* Profile Header */}
            <div className="p-4 flex flex-col items-center text-center">
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md mb-2.5"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-md mb-2.5">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
              {member.maidenName && (
                <p className="text-xs text-muted-foreground italic">
                  née {member.maidenName}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {member.gender}
                </span>
                {(member.isDeceased || member.dateOfDeath) && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">
                    Deceased (✝)
                  </span>
                )}
              </div>
              {member.occupation && (
                <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {member.occupation}
                </p>
              )}
            </div>

            {/* Vital Info Section */}
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Birth</span>
                  <span className="text-foreground font-medium">
                    {formatDate(member.dateOfBirth)}
                  </span>
                  {member.placeOfBirth && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {member.placeOfBirth}
                    </span>
                  )}
                </div>

                {(member.isDeceased || member.dateOfDeath) && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-xs text-muted-foreground block">Death</span>
                    <span className="text-foreground font-medium">
                      {member.dateOfDeath ? formatDate(member.dateOfDeath) : "Deceased"}
                    </span>
                    {member.placeOfDeath && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {member.placeOfDeath}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {member.notes && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <h5 className="text-xs font-medium text-foreground mb-1">Biography & Notes</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {member.notes}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Relationships Section */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Relationships ({relationships.length})
              </h4>
              {relationships.length === 0 ? (
                <p className="text-xs text-muted-foreground">No relationships linked yet</p>
              ) : (
                <div className="space-y-1.5">
                  {relationships.map((rel) => {
                    const related = getRelatedMember(rel);
                    if (!related) return null;
                    return (
                      <div
                        key={rel.id}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60"
                      >
                        <button
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                          onClick={() => setSelectedMemberId(related.id)}
                        >
                          {related.photo ? (
                            <img
                              src={related.photo}
                              alt={related.name}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {related.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {getRelationshipLabel(rel)}
                            </p>
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRelationship(rel.id);
                            toast.success("Relationship unlinked");
                          }}
                          title="Unlink connection"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent text-xs"
                  onClick={handleAddParent}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Add Parent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent text-xs"
                  onClick={handleAddChild}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Child
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent text-xs"
                  onClick={handleAddSpouse}
                >
                  <Heart className="w-3.5 h-3.5" />
                  Add Spouse
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent text-xs"
                  onClick={handleAddSibling}
                >
                  <Users className="w-3.5 h-3.5" />
                  Add Sibling
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="col-span-2 gap-1.5 bg-transparent text-xs mt-1"
                  onClick={startEditing}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      {!isEditing && (
        <div className="p-4 border-t border-border shrink-0 bg-card">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent text-xs"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete Member
          </Button>
        </div>
      )}
    </>
  );

  const modals = (
    <>
      {/* Delete Member Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{member.name}&rdquo;? This will remove them from the tree and disconnect all their relationships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Parent Modal (Option to select Mother or Father) */}
      <AddParentModal
        open={isAddParentOpen}
        onOpenChange={setIsAddParentOpen}
        childMemberId={member.id}
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        <Drawer
          open={Boolean(selectedMemberId)}
          onOpenChange={(open) => {
            if (!open) setSelectedMemberId(null);
          }}
        >
          <DrawerContent className="max-h-[85vh] flex flex-col p-0">
            {drawerContent}
          </DrawerContent>
        </Drawer>
        {modals}
      </>
    );
  }

  return (
    <>
      <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
        {drawerContent}
      </aside>
      {modals}
    </>
  );
}
