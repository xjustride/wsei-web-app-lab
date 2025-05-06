export enum UserRole {
  ADMIN = "Administrator",
  DEVOPS = "DevOps",
  DEVELOPER = "Developer"
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
