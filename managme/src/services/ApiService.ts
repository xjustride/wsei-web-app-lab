import axios from 'axios';
import type { Project, ProjectInput } from '@/models/Project';
import type { Story, StoryInput } from '@/models/Story';
import type { Task, TaskInput, TaskUpdateInput } from '@/models/Task';
import { logger } from '@/utils/logger';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        logger.logApiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '');
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        logger.logApiError('REQUEST', 'unknown', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => {
        logger.logApiResponse(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || '',
          response.status
        );
        return response;
      },
      async (error) => {
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'unknown';
        
        if (error.response?.status === 401 && this.token) {
          logger.warn('Received 401, attempting token refresh', 'ApiService', 'token-refresh');
          // Try to refresh token
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const userId = localStorage.getItem('userId');
            if (refreshToken && userId) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken,
                userId
              });
              
              const responseData = response.data as { accessToken: string; refreshToken: string };
              const { accessToken, refreshToken: newRefreshToken } = responseData;
              this.setToken(accessToken);
              localStorage.setItem('token', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              logger.info('Token refreshed successfully', 'ApiService', 'token-refresh');
              
              // Retry original request
              if (error.config.headers) {
                error.config.headers.Authorization = `Bearer ${accessToken}`;
              }
              return axios.request(error.config);
            }
          } catch (refreshError) {
            logger.error('Token refresh failed', refreshError as Error, 'ApiService', 'token-refresh');
            this.clearTokens();
            window.location.href = '/login';
          }
        }
        
        logger.logApiError(method, url, error);
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  clearTokens() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  }

  // Helper function to normalize project data for frontend compatibility
  private normalizeProject(project: any): Project {
    return {
      ...project,
      id: project._id || project.id,
      name: project.nazwa || project.name,
      description: project.opis || project.description
    };
  }

  // Helper function to normalize story data for frontend compatibility
  private normalizeStory(story: any): Story {
    return {
      ...story,
      id: story._id || story.id,
      name: story.nazwa || story.name,
      description: story.opis || story.description,
      project: story.projectId || story.project,
      state: story.status || story.state,
      assignedTo: story.assignedUserId || story.assignedTo
    };
  }

  // Helper function to normalize task data for frontend compatibility
  private normalizeTask(task: any): Task {
    return {
      ...task,
      id: task._id || task.id,
      name: task.nazwa || task.name,
      description: task.opis || task.description,
      project: task.projectId || task.project,
      story: task.storyId || task.story,
      state: task.status || task.state,
      assignedTo: task.assignedUserId || task.assignedTo
    };
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/projects`);
    logger.debug('Data received from API for getProjects:', 'ApiService.getProjects', {responseData: response.data });
    return (response.data as any[]).map((project: any) => this.normalizeProject(project));
  }

  async getProject(id: string): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
    return this.normalizeProject(response.data);
  }

  async createProject(projectInput: ProjectInput): Promise<Project> {
    // Convert frontend input to backend format
    const backendInput = {
      nazwa: projectInput.name || projectInput.nazwa,
      opis: projectInput.description || projectInput.opis,
      members: projectInput.members || [],
      viewers: projectInput.viewers || []
    };
    const response = await axios.post(`${API_BASE_URL}/projects`, backendInput);
    return this.normalizeProject(response.data);
  }

  async updateProject(id: string, projectInput: ProjectInput): Promise<Project> {
    // Convert frontend input to backend format
    const backendInput = {
      nazwa: projectInput.name || projectInput.nazwa,
      opis: projectInput.description || projectInput.opis,
      members: projectInput.members || [],
      viewers: projectInput.viewers || []
    };
    const response = await axios.put(`${API_BASE_URL}/projects/${id}`, backendInput);
    return this.normalizeProject(response.data);
  }

  async deleteProject(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/projects/${id}`);
  }

  // Project member management
  async addProjectMember(projectId: string, userId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/projects/${projectId}/members`, { userId });
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await axios({
      method: 'delete',
      url: `${API_BASE_URL}/projects/${projectId}/members`,
      data: { userId },
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async addProjectViewer(projectId: string, userId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/projects/${projectId}/viewers`, { userId });
  }

  async removeProjectViewer(projectId: string, userId: string): Promise<void> {
    await axios({
      method: 'delete',
      url: `${API_BASE_URL}/projects/${projectId}/viewers`,
      data: { userId },
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Stories
  async getStories(projectId?: string): Promise<Story[]> {
    let url = `${API_BASE_URL}/stories`;
    if (projectId) {
      url = `${API_BASE_URL}/stories/project/${projectId}`;
    }
    const response = await axios.get(url);
    logger.debug('Data received from API for getStories:', 'ApiService.getStories', { projectId, responseData: response.data });
    return (response.data as any[]).map((story: any) => this.normalizeStory(story));
  }

  async getStory(id: string): Promise<Story> {
    const response = await axios.get(`${API_BASE_URL}/stories/${id}`);
    return this.normalizeStory(response.data);
  }

  async createStory(storyInput: StoryInput & { projectId: string }): Promise<Story> {
    try {
      // Map frontend status to backend status
      let status = storyInput.state || storyInput.status;
      if (status === 'doing') {
        status = 'in-progress' as any; // Cast to any to satisfy TypeScript
      }
      
      // Convert frontend input to backend format with more explicit mapping
      const backendInput = {
        name: storyInput.name || storyInput.nazwa || '',
        description: storyInput.description || storyInput.opis || '',
        priority: storyInput.priority || 'medium',
        status: status || 'todo',
        projectId: storyInput.projectId
      };
      
      console.log('Creating story with data:', backendInput); // Debug log
      
      // Force the Content-Type header
      const response = await axios.post(`${API_BASE_URL}/stories`, backendInput, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return this.normalizeStory(response.data);
    } catch (error: any) {
      console.error('Error creating story:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateStory(id: string, storyInput: Partial<StoryInput>): Promise<Story> {
    // Convert frontend input to backend format
    const backendInput: any = {};
    if (storyInput.name || storyInput.nazwa) {
      backendInput.nazwa = storyInput.name || storyInput.nazwa;
    }
    if (storyInput.description || storyInput.opis) {
      backendInput.opis = storyInput.description || storyInput.opis;
    }
    if (storyInput.priority) {
      backendInput.priority = storyInput.priority;
    }
    if (storyInput.state || storyInput.status) {
      backendInput.status = storyInput.state || storyInput.status;
    }
    if (storyInput.assignedTo || storyInput.assignedUserId) {
      backendInput.assignedUserId = storyInput.assignedTo || storyInput.assignedUserId;
    }
    const response = await axios.put(`${API_BASE_URL}/stories/${id}`, backendInput);
    return this.normalizeStory(response.data);
  }

  async updateStoryStatus(id: string, status: string): Promise<Story> {
    const response = await axios.put(`${API_BASE_URL}/stories/${id}/status`, { status });
    return this.normalizeStory(response.data);
  }

  async deleteStory(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/stories/${id}`);
  }

  // Tasks
  async getTasks(filters?: { projectId?: string; storyId?: string; status?: string }): Promise<Task[]> {
    let url = `${API_BASE_URL}/tasks`;
    
    if (filters?.storyId) {
      url = `${API_BASE_URL}/tasks/story/${filters.storyId}`;
    } else if (filters?.projectId) {
      url = `${API_BASE_URL}/tasks/project/${filters.projectId}`;
    }
    
    const params: any = {};
    if (filters?.status) {
      params.status = filters.status;
    }
    
    const response = await axios.get(url, { params });
    return (response.data as any[]).map((task: any) => this.normalizeTask(task));
  }

  async getTask(id: string): Promise<Task> {
    const response = await axios.get(`${API_BASE_URL}/tasks/${id}`);
    return this.normalizeTask(response.data);
  }

  async createTask(taskInput: TaskInput & { projectId: string; storyId: string }): Promise<Task> {
    // Convert frontend input to backend format
    const backendInput = {
      nazwa: taskInput.name || taskInput.nazwa,
      opis: taskInput.description || taskInput.opis,
      priority: taskInput.priority,
      projectId: taskInput.projectId,
      storyId: taskInput.storyId,
      estimatedTime: taskInput.estimatedTime,
      assignedUserId: taskInput.assignedTo || taskInput.assignedUserId,
      startDate: taskInput.startDate,
      endDate: taskInput.endDate
    };
    const response = await axios.post(`${API_BASE_URL}/tasks`, backendInput);
    return this.normalizeTask(response.data);
  }

  async updateTask(id: string, taskInput: TaskUpdateInput): Promise<Task> {
    // Convert frontend input to backend format
    const backendInput: any = {};
    if (taskInput.name || taskInput.nazwa) {
      backendInput.nazwa = taskInput.name || taskInput.nazwa;
    }
    if (taskInput.description || taskInput.opis) {
      backendInput.opis = taskInput.description || taskInput.opis;
    }
    if (taskInput.priority) {
      backendInput.priority = taskInput.priority;
    }
    if (taskInput.estimatedTime) {
      backendInput.estimatedTime = taskInput.estimatedTime;
    }
    if (taskInput.state || taskInput.status) {
      backendInput.status = taskInput.state || taskInput.status;
    }
    if (taskInput.assignedTo || taskInput.assignedUserId) {
      backendInput.assignedUserId = taskInput.assignedTo || taskInput.assignedUserId;
    }
    if (taskInput.startDate) {
      backendInput.startDate = taskInput.startDate;
    }
    if (taskInput.endDate) {
      backendInput.endDate = taskInput.endDate;
    }
    const response = await axios.put(`${API_BASE_URL}/tasks/${id}`, backendInput);
    return this.normalizeTask(response.data);
  }

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const response = await axios.put(`${API_BASE_URL}/tasks/${id}/status`, { status });
    return this.normalizeTask(response.data);
  }

  async addTimeLog(taskId: string, timeLog: { timeSpent: number; description?: string }): Promise<Task> {
    const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/time-log`, timeLog);
    return this.normalizeTask(response.data);
  }

  async deleteTask(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/tasks/${id}`);
  }

  // Users
  async getUsers(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data as any[];
  }

  async getUsersByRole(role: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/users/role/${role}`);
    return response.data as any[];
  }

  async createUser(userInput: any): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/users`, userInput);
    return response.data;
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}/role`, { role });
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/users/${userId}`);
  }
}

export const apiService = new ApiService();
