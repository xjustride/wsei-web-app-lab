export interface ProjectMember {
  userId: string;
  assignedAt: Date;
}

export interface ProjectViewer {
  userId: string;
  assignedAt: Date;
}

export interface Project {
  _id: string;
  id: string; // Always present for compatibility
  nazwa: string; // Name in Polish as per backend
  name: string; // Always present for compatibility
  opis?: string; // Description in Polish as per backend
  description?: string; // For compatibility with frontend code
  ownerId: string;
  owner?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members: ProjectMember[];
  viewers: ProjectViewer[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectInput {
  nazwa: string;
  name?: string; // For compatibility
  opis?: string;
  description?: string; // For compatibility
  members?: string[];
  viewers?: string[];
}
