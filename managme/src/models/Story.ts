export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum Status {
  TODO = "todo",
  DOING = "doing", 
  DONE = "done"
}

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  state: Status;
  project: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryInput {
  name: string;
  description: string;
  priority: Priority;
  state: Status;
  assignedTo?: string;
}
