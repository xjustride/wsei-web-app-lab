import axios from 'axios';
import { User } from '@/models/User';
import { GoogleUserProfile, userService } from '@/services/UserService';
import { apiService } from './ApiService';
import { logger } from '@/utils/logger';

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
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = localStorage.getItem(this.storageTokenKey);
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (refreshError) {
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
      logger.logAuthAction('LOGIN_ATTEMPT', undefined, { username });
      
      const response = await axios.post(`${API_URL}/auth/login`, { 
        username, 
        password 
      });
      
      const { token, refreshToken } = response.data as AuthTokens;
      
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      apiService.setToken(token);
      
      await this.loadCurrentUser();
      
      logger.logAuthAction('LOGIN_SUCCESS', this.currentUser?.id, { username });
      return true;
    } catch (error) {
      logger.logAuthError('LOGIN_FAILED', error instanceof Error ? error : new Error('Unknown error'), { username });
      return false;
    }
 }

  async loginWithGoogle(googleProfile: GoogleUserProfile): Promise<boolean> {
    try {
      logger.logAuthAction('GOOGLE_LOGIN_ATTEMPT', undefined, { email: googleProfile.email });
      
      // Przekazujemy dane z Google do API
      const response = await axios.post(`${API_URL}/auth/google-login`, { googleProfile });
      
      const { token, refreshToken } = response.data as AuthTokens;
      
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      apiService.setToken(token);
      
      // Zamiast tworzyć użytkownika lokalnie, pobieramy go z serwera
      // żeby mieć pewność, że role i uprawnienia są poprawnie ustawione
      await this.loadCurrentUser();
      
      logger.logAuthAction('GOOGLE_LOGIN_SUCCESS', this.currentUser?.id, { email: googleProfile.email });
      return true;
    } catch (error) {
      logger.logAuthError('GOOGLE_LOGIN_FAILED', error instanceof Error ? error : new Error('Unknown error'), { email: googleProfile.email });
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      logger.logAuthAction('REFRESH_TOKEN_ATTEMPT');
      
      const refreshToken = localStorage.getItem(this.storageRefreshTokenKey);
      
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken
      });
      
      const { token, refreshToken: newRefreshToken } = response.data as AuthTokens;
      
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, newRefreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      logger.logAuthAction('REFRESH_TOKEN_SUCCESS');
      return true;
    } catch (error) {
      logger.logAuthError('REFRESH_TOKEN_FAILED', error instanceof Error ? error : new Error('Unknown error'));
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
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_URL}/users/me`);
      const user = response.data as User;
      
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
    const userId = this.currentUser?.id;
    logger.logAuthAction('LOGOUT', userId);
    
    localStorage.removeItem(this.storageTokenKey);
    localStorage.removeItem(this.storageRefreshTokenKey);
    delete axios.defaults.headers.common['Authorization'];
    apiService.clearTokens();
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.storageTokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async loginUser(email: string, password: string): Promise<boolean> {
    // Alias dla metody login
    return this.login(email, password);
  }

  getAuthHeader(): { Authorization: string } | undefined {
    const token = localStorage.getItem(this.storageTokenKey);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }
}

export const authService = new AuthService();
