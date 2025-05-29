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
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
              });
              
              const responseData = response.data as { token: string; refreshToken: string };
              const { token, refreshToken: newRefreshToken } = responseData;
              this.setToken(token);
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              logger.info('Token refreshed successfully', 'ApiService', 'token-refresh');
              
              // Retry original request
              if (error.config.headers) {
                error.config.headers.Authorization = `Bearer ${token}`;
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
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/projects`);
    // Log the actual data received from the API
    logger.debug('Data received from API for getProjects:', 'ApiService.getProjects', {responseData: response.data });
    return response.data as Project[];
  }

  async getProject(id: string): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
    return response.data as Project;
  }

  async createProject(projectInput: ProjectInput): Promise<Project> {
    const response = await axios.post(`${API_BASE_URL}/projects`, projectInput);
    return response.data as Project;
  }

  async updateProject(id: string, projectInput: ProjectInput): Promise<Project> {
    const response = await axios.put(`${API_BASE_URL}/projects/${id}`, projectInput);
    return response.data as Project;
  }

  async deleteProject(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/projects/${id}`);
  }

  // Stories
  async getStories(projectId?: string): Promise<Story[]> {
    const params = projectId ? { projectId } : {};
    const response = await axios.get(`${API_BASE_URL}/stories`, { params });
    // Log the actual data received from the API for stories
    logger.debug('Data received from API for getStories:', 'ApiService.getStories', { projectId, responseData: response.data });
    return response.data as Story[];
  }

  async getStory(id: string): Promise<Story> {
    const response = await axios.get(`${API_BASE_URL}/stories/${id}`);
    return response.data as Story;
  }

  async createStory(storyInput: StoryInput & { project: string }): Promise<Story> {
    const response = await axios.post(`${API_BASE_URL}/stories`, storyInput);
    return response.data as Story;
  }

  async updateStory(id: string, storyInput: Partial<StoryInput>): Promise<Story> {
    const response = await axios.put(`${API_BASE_URL}/stories/${id}`, storyInput);
    return response.data as Story;
  }

  async deleteStory(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/stories/${id}`);
  }

  // Tasks
  async getTasks(filters?: { projectId?: string; storyId?: string; state?: string }): Promise<Task[]> {
    const response = await axios.get(`${API_BASE_URL}/tasks`, { params: filters });
    return response.data as Task[];
  }

  async getTask(id: string): Promise<Task> {
    const response = await axios.get(`${API_BASE_URL}/tasks/${id}`);
    return response.data as Task;
  }

  async createTask(taskInput: TaskInput & { project: string; story: string }): Promise<Task> {
    const response = await axios.post(`${API_BASE_URL}/tasks`, taskInput);
    return response.data as Task;
  }

  async updateTask(id: string, taskInput: TaskUpdateInput): Promise<Task> {
    const response = await axios.put(`${API_BASE_URL}/tasks/${id}`, taskInput);
    return response.data as Task;
  }

  async deleteTask(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/tasks/${id}`);
  }
}

export const apiService = new ApiService();
