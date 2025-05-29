import { Priority } from './Story';

export enum TaskStatus {
  TODO = "todo",
  DOING = "doing",
  DONE = "done"
}

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  project: string;
  story: string;
  estimatedTime: number;
  state: TaskStatus;
  assignedTo?: string;
  createdBy: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskInput {
  name: string;
  description: string;
  priority: Priority;
  story: string;
  estimatedTime: number;
  assignedTo?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TaskUpdateInput {
  name?: string;
  description?: string;
  priority?: Priority;
  estimatedTime?: number;
  state?: TaskStatus;
  assignedTo?: string;
  startDate?: Date;
  endDate?: Date;
}
