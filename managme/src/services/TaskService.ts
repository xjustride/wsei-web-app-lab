import { Task, TaskInput, TaskStatus, TaskUpdateInput } from '@/models/Task';
import { activeProjectService } from './ActiveProjectService';
import { storyService } from './StoryService';

export class TaskService {
  private storageKey = 'managme_tasks';

  getAllTasks(): Task[] {
    try {
      const tasks = localStorage.getItem(this.storageKey);
      if (!tasks) return [];
      
      const parsedTasks = JSON.parse(tasks, (key, value) => {
        if (['createdAt', 'startedAt', 'completedAt'].includes(key) && value) {
          return new Date(value);
        }
        return value;
      });
      
      return parsedTasks;
    } catch (error) {
      console.error('Błąd podczas pobierania zadań:', error);
      return [];
    }
  }

  getTasksForStory(storyId: string): Task[] {
    return this.getAllTasks().filter(task => task.storyId === storyId);
  }

  getTasksForProject(projectId: string): Task[] {
    const stories = storyService.getStoriesForProject(projectId);
    const storyIds = stories.map(story => story.id);
    return this.getAllTasks().filter(task => storyIds.includes(task.storyId));
  }

  getTasksForActiveProject(): Task[] {
    const activeProject = activeProjectService.getActiveProject();
    if (!activeProject) return [];
    
    return this.getTasksForProject(activeProject.id);
  }

  getTaskById(id: string): Task | undefined {
    return this.getAllTasks().find(task => task.id === id);
  }

  createTask(taskInput: TaskInput): Task | null {
    try {
      const tasks = this.getAllTasks();
      const newTask: Task = {
        ...taskInput,
        id: crypto.randomUUID(),
        status: TaskStatus.TODO,
        createdAt: new Date()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify([...tasks, newTask]));
      return newTask;
    } catch (error) {
      console.error('Błąd podczas tworzenia zadania:', error);
      return null;
    }
  }

  updateTask(id: string, taskInput: TaskUpdateInput): Task | null {
    try {
      const tasks = this.getAllTasks();
      const index = tasks.findIndex(task => task.id === id);
      
      if (index === -1) return null;
      
      const existingTask = tasks[index];
      let updatedTask: Task = { ...existingTask, ...taskInput };

      if (taskInput.status !== undefined && taskInput.status !== existingTask.status) {
        if (taskInput.status === TaskStatus.DOING && existingTask.status === TaskStatus.TODO) {
          if (!updatedTask.startedAt) {
            updatedTask.startedAt = new Date();
          }
          
          if (!updatedTask.assigneeId && !taskInput.assigneeId) {
            throw new Error('Zadanie musi mieć przypisanego użytkownika przed zmianą statusu na "W trakcie"');
          }
        } 
        else if (taskInput.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE) {
          updatedTask.completedAt = new Date();
          
          if (!updatedTask.assigneeId) {
            throw new Error('Zadanie musi mieć przypisanego użytkownika przed zmianą statusu na "Ukończone"');
          }
        }
      }
      
      if (taskInput.assigneeId && !existingTask.assigneeId && existingTask.status === TaskStatus.TODO) {
        updatedTask.status = TaskStatus.DOING;
        updatedTask.startedAt = new Date();
      }

      tasks[index] = updatedTask;
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
      
      return updatedTask;
    } catch (error) {
      console.error('Błąd podczas aktualizacji zadania:', error);
      return null;
    }
  }

  deleteTask(id: string): boolean {
    try {
      const tasks = this.getAllTasks();
      const filteredTasks = tasks.filter(task => task.id !== id);
      
      if (filteredTasks.length === tasks.length) {
        return false;
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredTasks));
      return true;
    } catch (error) {
      console.error('Błąd podczas usuwania zadania:', error);
      return false;
    }
  }

  assignTask(id: string, userId: string): Task | null {
    try {
      const task = this.getTaskById(id);
      if (!task) return null;
      
      return this.updateTask(id, { 
        assigneeId: userId,
        status: task.status === TaskStatus.TODO ? TaskStatus.DOING : task.status
      });
    } catch (error) {
      console.error('Błąd podczas przypisywania zadania:', error);
      return null;
    }
  }

  completeTask(id: string, loggedHours?: number): Task | null {
    try {
      const task = this.getTaskById(id);
      if (!task) return null;
      
      if (!task.assigneeId) {
        throw new Error('Nie można zakończyć zadania bez przypisanego użytkownika');
      }
      
      const updateData: TaskUpdateInput = { 
        status: TaskStatus.DONE
      };
      
      if (loggedHours !== undefined) {
        updateData.loggedHours = loggedHours;
      }
      
      return this.updateTask(id, updateData);
    } catch (error) {
      console.error('Błąd podczas kończenia zadania:', error);
      return null;
    }
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getTasksForActiveProject().filter(task => task.status === status);
  }
}

export const taskService = new TaskService();
