export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  DEVOPS = 'devops',
  GUEST = 'guest'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github'
}

export interface User {
  _id: string;
  id: string; // Always present for compatibility
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  authProvider: AuthProvider;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password?: string;
  authProvider?: AuthProvider;
}
