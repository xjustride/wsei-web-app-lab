export enum Priority {
  LOW = "Niski",
  MEDIUM = "Średni",
  HIGH = "Wysoki"
}

export enum Status {
  TODO = "Do zrobienia",
  DOING = "W realizacji",
  DONE = "Ukończone"
}

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  projectId: string;
  createdAt: Date;
  status: Status;
  ownerId: string;
}

export interface StoryInput {
  name: string;
  description: string;
  priority: Priority;
  status: Status;
  ownerId: string;
}
