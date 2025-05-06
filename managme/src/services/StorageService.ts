import type { Project, ProjectInput } from '@/models/Project';

export class StorageService {
  private storageKey = 'managme_projects';

  getProjects(): Project[] {
    try {
      const projects = localStorage.getItem(this.storageKey);
      if (!projects) return [];
      
      const parsedProjects = JSON.parse(projects, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value);
        }
        return value;
      });
      
      return parsedProjects;
    } catch (error) {
      console.error('Błąd podczas pobierania projektów:', error);
      return [];
    }
  }

  getProject(id: string): Project | undefined {
    const projects = this.getProjects();
    return projects.find(project => project.id === id);
  }

  createProject(projectInput: ProjectInput): Project {
    try {
      const projects = this.getProjects();
      const newProject: Project = {
        ...projectInput,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify([...projects, newProject]));
      return newProject;
    } catch (error) {
      console.error('Błąd podczas tworzenia projektu:', error);
      throw new Error('Nie udało się utworzyć projektu');
    }
  }

  updateProject(id: string, projectInput: ProjectInput): Project | null {
    try {
      const projects = this.getProjects();
      const index = projects.findIndex(project => project.id === id);
      
      if (index === -1) return null;
      
      const existingProject = projects[index];
      
      const updatedProject: Project = {
        ...projectInput,
        id,
        createdAt: existingProject.createdAt
      };
      
      projects[index] = updatedProject;
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
      
      return updatedProject;
    } catch (error) {
      console.error('Błąd podczas aktualizacji projektu:', error);
      return null;
    }
  }

  deleteProject(id: string): boolean {
    try {
      const projects = this.getProjects();
      const filteredProjects = projects.filter(project => project.id !== id);
      
      if (filteredProjects.length === projects.length) {
        return false;
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredProjects));
      return true;
    } catch (error) {
      console.error('Błąd podczas usuwania projektu:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();
