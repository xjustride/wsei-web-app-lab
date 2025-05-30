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
   * Sprawdza czy użytkownik ma uprawnienia developera (może modyfikować kod i zadania)
   */
  isDeveloper(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    return user.role === UserRole.DEVELOPER || user.role === UserRole.ADMIN;
  }

  /**
   * Sprawdza czy użytkownik ma uprawnienia DevOps (może zarządzać infrastrukturą)
   */
  isDevOps(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    return user.role === UserRole.DEVOPS || user.role === UserRole.ADMIN;
  }

  /**
   * Sprawdza czy użytkownik może zarządzać projektami (tworzyć, modyfikować, usuwać)
   */
  canManageProjects(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    return user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER;
  }

  /**
   * Sprawdza czy użytkownik może zarządzać użytkownikami
   */
  canManageUsers(): boolean {
    return this.isAdmin();
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
