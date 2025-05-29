import type { Project, ProjectInput } from '@/models/Project';
import { apiService } from './ApiService';

export class StorageService {
  async getProjects(): Promise<Project[]> {
    try {
      return await apiService.getProjects();
    } catch (error) {
      console.error('Błąd podczas pobierania projektów:', error);
      return [];
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    try {
      return await apiService.getProject(id);
    } catch (error) {
      console.error('Błąd podczas pobierania projektu:', error);
      return undefined;
    }
  }

  async createProject(projectInput: ProjectInput): Promise<Project> {
    try {
      return await apiService.createProject(projectInput);
    } catch (error) {
      console.error('Błąd podczas tworzenia projektu:', error);
      throw new Error('Nie udało się utworzyć projektu');
    }
  }

  async updateProject(id: string, projectInput: ProjectInput): Promise<Project | null> {
    try {
      return await apiService.updateProject(id, projectInput);
    } catch (error) {
      console.error('Błąd podczas aktualizacji projektu:', error);
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      await apiService.deleteProject(id);
      return true;
    } catch (error) {
      console.error('Błąd podczas usuwania projektu:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();
