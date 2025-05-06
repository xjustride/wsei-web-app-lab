import axios from 'axios';
import { User } from '@/models/User';

// Define API base URL
const API_URL = 'http://localhost:3001/api';

interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface AuthUser extends User {
  token: string;
}

export class AuthService {
  private storageTokenKey = 'auth_token';
  private storageRefreshTokenKey = 'auth_refresh_token';
  private currentUser: AuthUser | null = null;

  constructor() {
    // Set up axios interceptors to handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            await this.refreshToken();
            // Get the new token
            const token = localStorage.getItem(this.storageTokenKey);
            // Set the new token in the headers
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            // Retry the original request
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh token fails, log out
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { 
        username, 
        password 
      });
      
      const { token, refreshToken } = response.data as AuthTokens;
      
      // Store tokens
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      
      // Set default auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Load user info immediately after login
      await this.loadCurrentUser();
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(this.storageRefreshTokenKey);
      
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken
      });
      
      const { token, refreshToken: newRefreshToken } = response.data as AuthTokens;
      
      // Store new tokens
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, newRefreshToken);
      
      // Update auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return true;
    } catch (error) {
      console.error('Refresh token error:', error);
      // Clear auth
      this.logout();
      return false;
    }
  }

  async loadCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem(this.storageTokenKey);
      
      if (!token) {
        return null;
      }
      
      // Set auth header just in case
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_URL}/users/me`);
      const user = response.data as User;
      
      // Store user with token
      this.currentUser = {
        ...user,
        token
      };
      
      return user;
    } catch (error) {
      console.error('Load current user error:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.storageTokenKey);
    localStorage.removeItem(this.storageRefreshTokenKey);
    delete axios.defaults.headers.common['Authorization'];
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.storageTokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAuthHeader(): { Authorization: string } | undefined {
    const token = localStorage.getItem(this.storageTokenKey);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }
}

export const authService = new AuthService();
