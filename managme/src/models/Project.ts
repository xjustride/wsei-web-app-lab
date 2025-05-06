export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
}

export interface ProjectInput {
  name: string;
  description: string;
}
