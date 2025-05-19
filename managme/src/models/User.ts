export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
  GUEST = 'guest' // New role
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  role: UserRole;
}
