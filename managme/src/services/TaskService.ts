import { Task, TaskInput, TaskStatus, TaskUpdateInput } from '@/models/Task';
import { activeProjectService } from './ActiveProjectService';
import { storyService } from './StoryService';
import { apiService } from './ApiService';
import { logger } from '@/utils/logger';

export class TaskService {
  async getAllTasks(): Promise<Task[]> {
    try {
      logger.logTaskAction('getAllTasks');
      const tasks = await apiService.getTasks();
      logger.logTaskAction('getAllTasks', undefined, { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.logTaskError('getAllTasks', error as Error);
      return [];
    }
  }

  async getTasksForStory(storyId: string): Promise<Task[]> {
    try {
      logger.logTaskAction('getTasksForStory', undefined, { storyId });
      const tasks = await apiService.getTasks({ storyId });
      logger.logTaskAction('getTasksForStory', undefined, { storyId, count: tasks.length });
      return tasks;
    } catch (error) {
      logger.logTaskError('getTasksForStory', error as Error, storyId);
      return [];
    }
  }

  async getTasksForProject(projectId: string): Promise<Task[]> {
    try {
      logger.logTaskAction('getTasksForProject', undefined, { projectId });
      const tasks = await apiService.getTasks({ projectId });
      logger.logTaskAction('getTasksForProject', undefined, { projectId, count: tasks.length });
      return tasks;
    } catch (error) {
      logger.logTaskError('getTasksForProject', error as Error, undefined);
      return [];
    }
  }

  async getTasksForActiveProject(): Promise<Task[]> {
    const activeProject = activeProjectService.getActiveProject();
    if (!activeProject) return [];
    
    return await this.getTasksForProject(activeProject.id);
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    try {
      return await apiService.getTask(id);
    } catch (error) {
      console.error('Błąd podczas pobierania zadania:', error);
      return undefined;
    }
  }

  async createTask(taskInput: TaskInput, storyId: string): Promise<Task | null> {
    try {
      const activeProject = activeProjectService.getActiveProject();
      if (!activeProject) {
        throw new Error('Brak aktywnego projektu');
      }

      return await apiService.createTask({
        ...taskInput,
        projectId: activeProject.id,
        storyId: storyId
      });
    } catch (error) {
      console.error('Błąd podczas tworzenia zadania:', error);
      return null;
    }
  }

  async updateTask(id: string, taskUpdate: TaskUpdateInput): Promise<Task | null> {
    try {
      return await apiService.updateTask(id, taskUpdate);
    } catch (error) {
      console.error('Błąd podczas aktualizacji zadania:', error);
      return null;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      await apiService.deleteTask(id);
      return true;
    } catch (error) {
      console.error('Błąd podczas usuwania zadania:', error);
      return false;
    }
  }

  async changeTaskStatus(id: string, newStatus: TaskStatus): Promise<Task | null> {
    try {
      const task = await this.getTaskById(id);
      if (!task) return null;

      const updateData: TaskUpdateInput = {
        state: newStatus
      };

      // Dodaj timestampy w zależności od statusu
      const now = new Date();
      if (newStatus === TaskStatus.DOING && task.state !== TaskStatus.DOING) {
        updateData.startDate = now;
      } else if (newStatus === TaskStatus.DONE && task.state !== TaskStatus.DONE) {
        updateData.endDate = now;
      }

      return await this.updateTask(id, updateData);
    } catch (error) {
      console.error('Błąd podczas zmiany statusu zadania:', error);
      return null;
    }
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const tasks = await this.getTasksForActiveProject();
      // Safeguard against tasks not being an array
      if (!Array.isArray(tasks)) {
        logger.error('TaskService.getTasksByStatus: tasks is not an array!', new Error('Tasks is not an array'), 'TaskService', 'getTasksByStatus', { receivedTasks: tasks });
        return []; // Return empty array or handle error as appropriate
      }
      return tasks.filter(task => task.state === status);
    } catch (error) {
      console.error('Błąd podczas pobierania zadań według statusu:', error);
      return [];
    }
  }

  async getPendingTasksCount(): Promise<number> {
    try {
      const tasks = await this.getTasksByStatus(TaskStatus.TODO);
      return tasks.length;
    } catch (error) {
      console.error('Błąd podczas pobierania liczby oczekujących zadań:', error);
      return 0;
    }
  }
}

export const taskService = new TaskService();