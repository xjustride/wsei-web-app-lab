import { User, UserRole } from '@/models/User';
import { logger } from '@/utils/logger';

export interface GoogleUserProfile {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  sub: string;
}

export class UserService {
  private storageKey = 'managme_current_user';
  
  private mockUsers: User[] = [
    { id: '1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan.kowalski@example.com', role: UserRole.ADMIN },
    { id: '2', firstName: 'Anna', lastName: 'Nowak', email: 'anna.nowak@example.com', role: UserRole.DEVELOPER },
    { id: '3', firstName: 'Piotr', lastName: 'Wiśniewski', email: 'piotr.wisniewski@example.com', role: UserRole.VIEWER },
    { id: '4', firstName: 'Marta', lastName: 'Kowalczyk', email: 'marta.kowalczyk@example.com', role: UserRole.DEVELOPER },
  ];

  getCurrentUser(): User | null {
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        logger.info('Current user loaded from localStorage', 'UserService', 'getCurrentUser', { userId: user.id });
        return user;
      }
      
      // Fallback to a default user if nothing in localStorage - this might be an initial setup or demo case
      // In a real app, this would likely redirect to login or handle unauthenticated state
      logger.warn('No user in localStorage, returning default admin user for mock purposes', 'UserService', 'getCurrentUser');
      const defaultUser = this.mockUsers.find(u => u.role === UserRole.ADMIN) || this.mockUsers[0];
      if (defaultUser) {
        this.setCurrentUser(defaultUser); // Optionally store this default user
      }
      return defaultUser || null;
    } catch (error) {
      logger.error('Error fetching current user', error instanceof Error ? error : new Error(String(error)), 'UserService', 'getCurrentUser');
      return null; // Return null on error to avoid app crash
    }
  }

  setCurrentUser(user: User): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
      logger.info(`Current user set in localStorage: ${user.id}`, 'UserService', 'setCurrentUser', { userId: user.id });
    } catch (error) {
      logger.error('Error setting current user in localStorage', error instanceof Error ? error : new Error(String(error)), 'UserService', 'setCurrentUser', { userId: user.id });
    }
  }

  getAllUsers(): User[] {
    logger.info('Fetching all mock users', 'UserService', 'getAllUsers');
    return this.mockUsers;
  }

  getAssignableUsers(): User[] {
    logger.info('Fetching assignable mock users (Developers & Viewers)', 'UserService', 'getAssignableUsers');
    return this.mockUsers.filter(user => 
      user.role === UserRole.DEVELOPER || user.role === UserRole.VIEWER
    );
  }

  createUserFromGoogleProfile(profile: GoogleUserProfile): User {
    // Generowanie unikalnego ID dla użytkownika Google
    const id = `google-${profile.sub}`;
    
    // Sprawdzamy czy użytkownik Google już istnieje w systemie
    const existingUser = this.mockUsers.find(user => user.id === id);
    if (existingUser) {
      return existingUser;
    }
    
    // Tworzenie nowego użytkownika z rolą 'guest' zgodnie z wymaganiami
    const newUser: User = {
      id: id,
      firstName: profile.given_name,
      lastName: profile.family_name,
      role: UserRole.GUEST // Nadajemy rolę GUEST zgodnie z wymaganiami
    };
    
    // Dodajemy użytkownika do mockUsers (w prawdziwej aplikacji zapisalibyśmy do bazy danych)
    this.mockUsers.push(newUser);
    
    return newUser;
  }

  // Example of a method that might interact with an API in a real scenario
  async fetchUserById(userId: string): Promise<User | null> {
    logger.info(`Attempting to fetch user by ID: ${userId}`, 'UserService', 'fetchUserById');
    // This is a mock implementation. In a real app, this would call an API.
    const user = this.mockUsers.find(u => u.id === userId);
    if (user) {
      logger.info(`User found: ${userId}`, 'UserService', 'fetchUserById', { userId });
      return user;
    }
    logger.warn(`User not found: ${userId}`, 'UserService', 'fetchUserById', { userId });
    return null;
  }
  
  // Example of updating a user (mock)
  async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
    logger.info(`Attempting to update user: ${userId}`, 'UserService', 'updateUser', { userId, userData });
    const userIndex = this.mockUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], ...userData };
      logger.info(`User updated: ${userId}`, 'UserService', 'updateUser', { userId });
      // If the updated user is the current user, update it in localStorage as well
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.setCurrentUser(this.mockUsers[userIndex]);
      }
      return this.mockUsers[userIndex];
    }
    logger.warn(`User not found for update: ${userId}`, 'UserService', 'updateUser', { userId });
    return null;
  }
}

export const userService = new UserService();
