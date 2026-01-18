export interface Person {
  id: string;
  name: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;
  dateOfDeath?: string;
  photo?: string;
  notes?: string;
  x: number;
  y: number;
}

export interface Relationship {
  id: string;
  personAId: string;
  personBId: string;
  type: "parent-child" | "spouse" | "sibling";
}

export interface FamilyTree {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: Person[];
  relationships: Relationship[];
}
