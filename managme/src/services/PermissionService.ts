import { UserRole } from '@/models/User';
import { authService } from './AuthService';

export class PermissionService {
  /**
   * Sprawdza czy użytkownik ma uprawnienia do modyfikacji zasobów systemu
   * Użytkownicy z rolą GUEST mogą tylko przeglądać zasoby, nie mogą ich modyfikować
   */
  canModify(): boolean {
    const user = authService.getCurrentUser();
    // Brak zalogowanego użytkownika oznacza brak uprawnień
    if (!user) return false;
    
    // Użytkownicy z rolą GUEST nie mogą modyfikować zasobów
    return user.role !== UserRole.GUEST;
  }

  /**
   * Sprawdza czy użytkownik ma uprawnienia administracyjne
   */
  isAdmin(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    return user.role === UserRole.ADMIN;
  }

  /**
   * Sprawdza czy użytkownik ma uprawnienia do przeglądania zasobów
   * Wszyscy zalogowani użytkownicy mają takie uprawnienie
   */
  canView(): boolean {
    return !!authService.getCurrentUser();
  }
}

export const permissionService = new PermissionService();
