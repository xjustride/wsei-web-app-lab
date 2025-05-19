import { User, UserInput, UserRole } from '@/models/User';
import { storageService } from './StorageService'; // Assuming StorageService handles user storage

export interface GoogleUserProfile {
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sub: string; // Google's unique ID for the user
}

export class UserService {
  private storageKey = 'managme_users';

  constructor() {
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    const existingUsers = this.getAllUsers();
    if (existingUsers.length === 0) {
      // If no users exist, create a default admin user
      const defaultAdmin: User = {
        id: '1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        password: 'admin123', // Default password, should be changed on first login
      };
      localStorage.setItem(this.storageKey, JSON.stringify([defaultAdmin]));
    }
  }

  getCurrentUser(): User {
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      const defaultUser = this.getAllUsers().find(u => u.role === UserRole.ADMIN) || this.getAllUsers()[0];
      this.setCurrentUser(defaultUser);
      return defaultUser;
    } catch (error) {
      console.error('Błąd podczas pobierania użytkownika:', error);
      return this.getAllUsers()[0];
    }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  getAllUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  getUserById(id: string): User | undefined {
    const users = this.getAllUsers();
    return users.find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const users = this.getAllUsers();
    return users.find(user => user.email === email);
  }

  createUser(userInput: UserInput): User | null {
    try {
      const users = this.getAllUsers();
      if (users.find(user => user.email === userInput.email)) {
        console.warn('Użytkownik o tym adresie email już istnieje.');
        return null; // Or throw new Error('User with this email already exists');
      }
      const newUser: User = {
        ...userInput,
        id: crypto.randomUUID(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify([...users, newUser]));
      return newUser;
    } catch (error) {
      console.error('Błąd podczas tworzenia użytkownika:', error);
      return null;
    }
  }

  findOrCreateUserForGoogle(profile: GoogleUserProfile): User | null {
    try {
      let user = this.getUserByEmail(profile.email);
      if (user) {
        // Optionally update user details if they logged in via Google before with a different provider
        // For now, just return the existing user. If they were not a guest, their role remains.
        // If they were a guest, their role remains guest.
        // If a user with this email exists but was created manually with a different role,
        // we might need a strategy here. For now, we assume email is unique identifier.
        // If their existing role is not GUEST, we might want to keep it or handle merging.
        // For simplicity, if user exists, return them. If their role is not GUEST, it's preserved.
        return user;
      }

      // If user does not exist, create a new one with GUEST role
      const users = this.getAllUsers();
      const newUser: User = {
        id: crypto.randomUUID(),
        email: profile.email,
        firstName: profile.given_name || profile.name?.split(' ')[0] || 'Google',
        lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User',
        role: UserRole.GUEST,
        // password field is not needed for OAuth users if they only log in via Google
        // If they can also log in with password, this needs more thought.
        // For now, we assume Google-only login for these users, so no password.
      };
      localStorage.setItem(this.storageKey, JSON.stringify([...users, newUser]));
      return newUser;
    } catch (error) {
      console.error('Błąd podczas znajdowania lub tworzenia użytkownika Google:', error);
      return null;
    }
  }

  getAssignableUsers(): User[] {
    return this.getAllUsers().filter(user => 
      user.role === UserRole.DEVELOPER || user.role === UserRole.DEVOPS
    );
  }
}

export const userService = new UserService();
