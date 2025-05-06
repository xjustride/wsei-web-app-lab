import { User, UserRole } from '@/models/User';

export class UserService {
  private storageKey = 'managme_current_user';
  
  private mockUsers: User[] = [
    { id: '1', firstName: 'Jan', lastName: 'Kowalski', role: UserRole.ADMIN },
    { id: '2', firstName: 'Anna', lastName: 'Nowak', role: UserRole.DEVELOPER },
    { id: '3', firstName: 'Piotr', lastName: 'Wiśniewski', role: UserRole.DEVOPS },
    { id: '4', firstName: 'Marta', lastName: 'Kowalczyk', role: UserRole.DEVELOPER },
  ];

  getCurrentUser(): User {
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      const defaultUser = this.mockUsers.find(u => u.role === UserRole.ADMIN) || this.mockUsers[0];
      this.setCurrentUser(defaultUser);
      return defaultUser;
    } catch (error) {
      console.error('Błąd podczas pobierania użytkownika:', error);
      return this.mockUsers[0];
    }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  getAllUsers(): User[] {
    return this.mockUsers;
  }

  getAssignableUsers(): User[] {
    return this.mockUsers.filter(user => 
      user.role === UserRole.DEVELOPER || user.role === UserRole.DEVOPS
    );
  }
}

export const userService = new UserService();
