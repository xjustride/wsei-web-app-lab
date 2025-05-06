import { Priority } from './Story';

export enum TaskStatus {
  TODO = "Do zrobienia",
  DOING = "W trakcie",
  DONE = "Ukończone"
}

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  storyId: string;
  estimatedHours: number;
  loggedHours?: number;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assigneeId?: string;
}

export interface TaskInput {
  name: string;
  description: string;
  priority: Priority;
  storyId: string;
  estimatedHours: number;
  loggedHours?: number;
}

export interface TaskUpdateInput {
  name?: string;
  description?: string;
  priority?: Priority;
  estimatedHours?: number;
  loggedHours?: number;
  status?: TaskStatus;
  assigneeId?: string;
}
