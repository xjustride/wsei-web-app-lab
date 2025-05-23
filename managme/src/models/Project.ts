export interface Project {
  id?: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectInput {
  name: string;
  description: string;
}