import type { Project } from '@/models/Project';

export class ActiveProjectService {
  private storageKey = 'managme_active_project';

  getActiveProject(): Project | null {
    try {
      const project = localStorage.getItem(this.storageKey);
      if (!project) return null;
      
      const parsedProject = JSON.parse(project, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value);
        }
        return value;
      });
      
      return parsedProject;
    } catch (error) {
      console.error('Błąd podczas pobierania aktywnego projektu:', error);
      return null;
    }
  }

  setActiveProject(project: Project): void {
    localStorage.setItem(this.storageKey, JSON.stringify(project));
  }

  clearActiveProject(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const activeProjectService = new ActiveProjectService();
