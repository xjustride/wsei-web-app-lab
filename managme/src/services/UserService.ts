import { User } from '@/models/User';

export class UserService {
  private storageKey = 'managme_current_user';
  
  // Mock użytkownika (bez opcji logowania)
  private mockUsers: User[] = [
    { id: '1', firstName: 'Jan', lastName: 'Kowalski' },
    { id: '2', firstName: 'Anna', lastName: 'Nowak' },
    { id: '3', firstName: 'Piotr', lastName: 'Wiśniewski' },
  ];

  getCurrentUser(): User {
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      // Jeśli nie ma zapisanego użytkownika, użyj pierwszego mockowego
      const defaultUser = this.mockUsers[0];
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
}

export const userService = new UserService();
