export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum Status {
  TODO = "todo",
  DOING = "doing", 
  IN_PROGRESS = "in-progress", // Add this to match backend expectation
  DONE = "done"
}

export interface Story {
  _id: string;
  id: string; // Always present for compatibility
  nazwa: string; // Name in Polish as per backend
  name: string; // Always present for compatibility
  opis?: string; // Description in Polish as per backend  
  description?: string; // For compatibility with frontend code
  priority: Priority;
  status: Status;
  state: Status; // Always present for compatibility
  projectId: string;
  project: string; // Always present for compatibility
  assignedUserId?: string;
  assignedTo?: string; // For compatibility with frontend code
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryInput {
  nazwa: string;
  name?: string; // For compatibility
  opis?: string;
  description?: string; // For compatibility
  priority: Priority;
  status: Status;
  state?: Status; // For compatibility
  projectId: string;
  assignedUserId?: string;
  assignedTo?: string; // For compatibility
}
