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
      logger.logTaskAction('updateTask', undefined, { id, taskUpdate });
      const result = await apiService.updateTask(id, taskUpdate);
      logger.logTaskAction('updateTask', undefined, { id, result });
      
      if (result) {
        // Validate that we got back a valid task object
        if (!result.id) {
          logger.logTaskError('updateTask', new Error('Invalid task object returned from API'), id);
        }
        
        // Force refresh from the server to ensure we have the latest data
        // This helps with UI synchronization
        return result;
      }
      return null;
    } catch (error) {
      logger.logTaskError('updateTask', error as Error, id);
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
      logger.logTaskAction('changeTaskStatus', undefined, { id, newStatus });
      
      const task = await this.getTaskById(id);
      if (!task) {
        logger.logTaskError('changeTaskStatus', new Error('Task not found'), id);
        return null;
      }

      logger.logTaskAction('changeTaskStatus', undefined, { id, currentStatus: task.state, newStatus });

      const updateData: TaskUpdateInput = {
        state: newStatus
      };

      // Add timestamps depending on status
      const now = new Date();
      if (newStatus === TaskStatus.DOING && task.state !== TaskStatus.DOING) {
        updateData.startDate = now;
      } else if (newStatus === TaskStatus.DONE && task.state !== TaskStatus.DONE) {
        updateData.endDate = now;
      }

      const result = await this.updateTask(id, updateData);
      
      if (result) {
        logger.logTaskAction('changeTaskStatus', undefined, { id, updatedTask: result });
      } else {
        logger.logTaskError('changeTaskStatus', new Error('Failed to update task status'), id);
      }
      
      return result;
    } catch (error) {
      logger.logTaskError('changeTaskStatus', error as Error, id);
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

  // Funkcja do odświeżania wszystkich zadań w aktywnym projekcie
  async refreshTasks(): Promise<{
    todoTasks: Task[],
    doingTasks: Task[],
    doneTasks: Task[]
  }> {
    try {
      logger.logTaskAction('refreshTasks', undefined, { message: 'Odświeżanie wszystkich zadań' });
      
      const [todoTasks, doingTasks, doneTasks] = await Promise.all([
        this.getTasksByStatus(TaskStatus.TODO),
        this.getTasksByStatus(TaskStatus.DOING),
        this.getTasksByStatus(TaskStatus.DONE)
      ]);
      
      logger.logTaskAction('refreshTasks', undefined, { 
        todoCount: todoTasks.length, 
        doingCount: doingTasks.length, 
        doneCount: doneTasks.length 
      });
      
      return { todoTasks, doingTasks, doneTasks };
    } catch (error) {
      logger.logTaskError('refreshTasks', error as Error);
      return { todoTasks: [], doingTasks: [], doneTasks: [] };
    }
  }
}

export const taskService = new TaskService();