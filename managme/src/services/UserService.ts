import { User, UserRole, AuthProvider } from '@/models/User';
import { logger } from '@/utils/logger';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface GoogleUserProfile {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  sub: string;
  token?: string; // Google token for backend verification
}

export class UserService {
  private storageKey = 'managme_current_user';

  // Helper function to normalize user data for frontend compatibility
  private normalizeUser(user: any): User {
    return {
      ...user,
      id: user._id || user.id
    };
  }

  getCurrentUser(): User | null {
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        logger.info('Current user loaded from localStorage', 'UserService', 'getCurrentUser', { userId: user.id });
        return user;
      }
      
      logger.warn('No user in localStorage', 'UserService', 'getCurrentUser');
      return null;
    } catch (error) {
      logger.error('Error fetching current user', error instanceof Error ? error : new Error(String(error)), 'UserService', 'getCurrentUser');
      return null;
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

  async getAllUsers(): Promise<User[]> {
    try {
      logger.info('Fetching all users from API', 'UserService', 'getAllUsers');
      const response = await axios.get(`${API_BASE_URL}/users`);
      return (response.data as any[]).map(user => this.normalizeUser(user));
    } catch (error) {
      logger.error('Error fetching users', error instanceof Error ? error : new Error(String(error)), 'UserService', 'getAllUsers');
      return [];
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      logger.info(`Fetching users by role: ${role}`, 'UserService', 'getUsersByRole');
      const response = await axios.get(`${API_BASE_URL}/users/role/${role}`);
      return (response.data as any[]).map(user => this.normalizeUser(user));
    } catch (error) {
      logger.error('Error fetching users by role', error instanceof Error ? error : new Error(String(error)), 'UserService', 'getUsersByRole');
      return [];
    }
  }

  async getAssignableUsers(): Promise<User[]> {
    try {
      logger.info('Fetching assignable users (Developers & DevOps)', 'UserService', 'getAssignableUsers');
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => 
        user.role === UserRole.DEVELOPER || user.role === UserRole.DEVOPS
      );
    } catch (error) {
      logger.error('Error fetching assignable users', error instanceof Error ? error : new Error(String(error)), 'UserService', 'getAssignableUsers');
      return [];
    }
  }

  createUserFromGoogleProfile(profile: GoogleUserProfile): User {
    // This method is kept for compatibility but actual user creation 
    // is handled by the backend during Google authentication
    const normalizedUser: User = {
      _id: `google-${profile.sub}`,
      id: `google-${profile.sub}`,
      firstName: profile.given_name,
      lastName: profile.family_name,
      email: profile.email,
      role: UserRole.GUEST,
      avatar: profile.picture,
      authProvider: AuthProvider.GOOGLE,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return normalizedUser;
  }

  async fetchUserById(userId: string): Promise<User | null> {
    try {
      logger.info(`Attempting to fetch user by ID: ${userId}`, 'UserService', 'fetchUserById');
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
      const user = this.normalizeUser(response.data);
      logger.info(`User found: ${userId}`, 'UserService', 'fetchUserById', { userId });
      return user;
    } catch (error) {
      logger.warn(`User not found: ${userId}`, 'UserService', 'fetchUserById', { userId });
      return null;
    }
  }
  
  async createUser(userData: { firstName: string; lastName: string; email: string; role: UserRole; password?: string }): Promise<User | null> {
    try {
      logger.info('Creating new user', 'UserService', 'createUser', { email: userData.email });
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      const user = this.normalizeUser(response.data);
      logger.info(`User created: ${user.id}`, 'UserService', 'createUser', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Error creating user', error instanceof Error ? error : new Error(String(error)), 'UserService', 'createUser');
      return null;
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    try {
      logger.info(`Attempting to update user role: ${userId}`, 'UserService', 'updateUserRole', { userId, role });
      const response = await axios.put(`${API_BASE_URL}/users/${userId}/role`, { role });
      const user = this.normalizeUser(response.data);
      logger.info(`User role updated: ${userId}`, 'UserService', 'updateUserRole', { userId });
      
      // If the updated user is the current user, update it in localStorage as well
      const currentUser = this.getCurrentUser();
      if (currentUser && (currentUser.id === userId || currentUser._id === userId)) {
        this.setCurrentUser(user);
      }
      return user;
    } catch (error) {
      logger.error('Error updating user role', error instanceof Error ? error : new Error(String(error)), 'UserService', 'updateUserRole', { userId });
      return null;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      logger.info(`Attempting to delete user: ${userId}`, 'UserService', 'deleteUser', { userId });
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      logger.info(`User deleted: ${userId}`, 'UserService', 'deleteUser', { userId });
      return true;
    } catch (error) {
      logger.error('Error deleting user', error instanceof Error ? error : new Error(String(error)), 'UserService', 'deleteUser', { userId });
      return false;
    }
  }

  clearCurrentUser(): void {
    try {
      localStorage.removeItem(this.storageKey);
      logger.info('Current user cleared from localStorage', 'UserService', 'clearCurrentUser');
    } catch (error) {
      logger.error('Error clearing current user', error instanceof Error ? error : new Error(String(error)), 'UserService', 'clearCurrentUser');
    }
  }
}

export const userService = new UserService();
