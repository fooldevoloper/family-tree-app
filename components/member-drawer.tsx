"use client";

import { useState } from "react";
import { useFamilyTree } from "@/lib/family-tree-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  User,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Heart,
  Link2,
  Save,
} from "lucide-react";

export function MemberDrawer() {
  const {
    currentTree,
    selectedMemberId,
    setSelectedMemberId,
    updateMember,
    deleteMember,
    addMember,
    addRelationship,
  } = useFamilyTree();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    name: string;
    gender: "male" | "female" | "other";
    dateOfBirth: string;
    dateOfDeath: string;
    photo: string;
    notes: string;
  } | null>(null);

  const member = currentTree?.members.find((m) => m.id === selectedMemberId);

  if (!member || !currentTree) return null;

  const relationships = currentTree.relationships.filter(
    (r) => r.personAId === member.id || r.personBId === member.id
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
      month: "long",
      day: "numeric",
    });
  };

  const startEditing = () => {
    setEditData({
      name: member.name,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth || "",
      dateOfDeath: member.dateOfDeath || "",
      photo: member.photo || "",
      notes: member.notes || "",
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editData || !editData.name.trim()) return;
    updateMember({
      ...member,
      name: editData.name.trim(),
      gender: editData.gender,
      dateOfBirth: editData.dateOfBirth || undefined,
      dateOfDeath: editData.dateOfDeath || undefined,
      photo: editData.photo || undefined,
      notes: editData.notes || undefined,
    });
    setIsEditing(false);
    setEditData(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleAddChild = () => {
    const newMember = addMember({
      name: "New Child",
      gender: "other",
      x: member.x,
      y: member.y + 150,
    });
    addRelationship({
      personAId: member.id,
      personBId: newMember.id,
      type: "parent-child",
    });
    setSelectedMemberId(newMember.id);
  };

  const handleAddSpouse = () => {
    const newMember = addMember({
      name: "Spouse",
      gender: member.gender === "male" ? "female" : "male",
      x: member.x + 200,
      y: member.y,
    });
    addRelationship({
      personAId: member.id,
      personBId: newMember.id,
      type: "spouse",
    });
    setSelectedMemberId(newMember.id);
  };

  const handleAddSibling = () => {
    const newMember = addMember({
      name: "Sibling",
      gender: "other",
      x: member.x + 200,
      y: member.y,
    });
    addRelationship({
      personAId: member.id,
      personBId: newMember.id,
      type: "sibling",
    });
    setSelectedMemberId(newMember.id);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      deleteMember(member.id);
    }
  };

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Member Profile</h2>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) =>
                  setEditData((prev) => prev && { ...prev, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <Select
                value={editData.gender}
                onValueChange={(value: "male" | "female" | "other") =>
                  setEditData((prev) => prev && { ...prev, gender: value })
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
            <div className="grid gap-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editData.dateOfBirth}
                onChange={(e) =>
                  setEditData((prev) =>
                    prev && { ...prev, dateOfBirth: e.target.value }
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-dod">Date of Death</Label>
              <Input
                id="edit-dod"
                type="date"
                value={editData.dateOfDeath}
                onChange={(e) =>
                  setEditData((prev) =>
                    prev && { ...prev, dateOfDeath: e.target.value }
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-photo">Photo URL</Label>
              <Input
                id="edit-photo"
                value={editData.photo}
                onChange={(e) =>
                  setEditData((prev) => prev && { ...prev, photo: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={editData.notes}
                onChange={(e) =>
                  setEditData((prev) => prev && { ...prev, notes: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
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
            {/* Profile Section */}
            <div className="p-4 flex flex-col items-center text-center">
              {member.photo ? (
                <img
                  src={member.photo || "/placeholder.svg"}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-md mb-3">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{member.gender}</p>
            </div>

            {/* Info Section */}
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Born</span>
                  <span className="text-foreground">{formatDate(member.dateOfBirth)}</span>
                </div>
                {member.dateOfDeath && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Died</span>
                    <span className="text-foreground">{formatDate(member.dateOfDeath)}</span>
                  </div>
                )}
              </div>
              {member.notes && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">{member.notes}</p>
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
                <p className="text-sm text-muted-foreground">No relationships yet</p>
              ) : (
                <div className="space-y-2">
                  {relationships.map((rel) => {
                    const related = getRelatedMember(rel);
                    if (!related) return null;
                    return (
                      <button
                        key={rel.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setSelectedMemberId(related.id)}
                      >
                        {related.photo ? (
                          <img
                            src={related.photo || "/placeholder.svg"}
                            alt={related.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {related.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getRelationshipLabel(rel)}
                          </p>
                        </div>
                      </button>
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
                  className="gap-1.5 bg-transparent"
                  onClick={handleAddChild}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Child
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                  onClick={handleAddSpouse}
                >
                  <Heart className="w-3.5 h-3.5" />
                  Add Spouse
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                  onClick={handleAddSibling}
                >
                  <Users className="w-3.5 h-3.5" />
                  Add Sibling
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                  onClick={startEditing}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      {!isEditing && (
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Member
          </Button>
        </div>
      )}
    </aside>
  );
}
