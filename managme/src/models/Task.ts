import { Priority } from './Story';

export enum TaskStatus {
  TODO = "todo",
  DOING = "doing",
  DONE = "done"
}

export interface TimeLog {
  _id: string;
  userId: string;
  timeSpent: number; // in minutes
  description?: string;
  loggedAt: Date;
}

export interface Task {
  _id: string;
  id: string; // Always present for compatibility
  nazwa: string; // Name in Polish as per backend
  name: string; // Always present for compatibility
  opis?: string; // Description in Polish as per backend
  description?: string; // For compatibility with frontend code
  priority: Priority;
  projectId: string;
  project: string; // Always present for compatibility
  storyId: string;
  story: string; // Always present for compatibility
  estimatedTime: number;
  status: TaskStatus;
  state: TaskStatus; // Always present for compatibility
  assignedUserId?: string;
  assignedTo?: string; // For compatibility with frontend code
  createdBy: string;
  timeLogs: TimeLog[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskInput {
  nazwa: string;
  name?: string; // For compatibility
  opis?: string;
  description?: string; // For compatibility
  priority: Priority;
  projectId: string;
  storyId: string;
  story?: string; // For compatibility
  estimatedTime: number;
  assignedUserId?: string;
  assignedTo?: string; // For compatibility
  startDate?: Date;
  endDate?: Date;
}

export interface TaskUpdateInput {
  nazwa?: string;
  name?: string; // For compatibility
  opis?: string;
  description?: string; // For compatibility
  priority?: Priority;
  estimatedTime?: number;
  status?: TaskStatus;
  state?: TaskStatus; // For compatibility
  assignedUserId?: string;
  assignedTo?: string; // For compatibility
  startDate?: Date;
  endDate?: Date;
}
