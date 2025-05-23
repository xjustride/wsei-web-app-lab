import { User, UserRole } from '@/models/User';

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
    { id: '1', firstName: 'Jan', lastName: 'Kowalski', role: UserRole.ADMIN },
    { id: '2', firstName: 'Anna', lastName: 'Nowak', role: UserRole.DEVELOPER },
    { id: '3', firstName: 'Piotr', lastName: 'Wiśniewski', role: UserRole.VIEWER },
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
}

export const userService = new UserService();
