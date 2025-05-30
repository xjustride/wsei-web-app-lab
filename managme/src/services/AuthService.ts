import axios from 'axios';
import { User } from '@/models/User';
import { GoogleUserProfile, userService } from '@/services/UserService';
import { apiService } from './ApiService';
import { logger } from '@/utils/logger';

// Define API base URL
const API_URL = 'http://localhost:3001/api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthUser extends User {
  token: string;
}

export class AuthService {
  private storageTokenKey = 'token';
  private storageRefreshTokenKey = 'refreshToken';
  private storageUserIdKey = 'userId';
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

  async login(email: string, password: string): Promise<boolean> {
    try {
      logger.logAuthAction('LOGIN_ATTEMPT', undefined, { email });
      
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password 
      });
      
      const authResponse = response.data as AuthResponse;
      const { user, accessToken, refreshToken } = authResponse;
      
      localStorage.setItem(this.storageTokenKey, accessToken);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      localStorage.setItem(this.storageUserIdKey, user._id || user.id || '');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      apiService.setToken(accessToken);
      
      // Normalize user data for frontend compatibility
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        token: accessToken
      };
      this.currentUser = normalizedUser;
      
      logger.logAuthAction('LOGIN_SUCCESS', normalizedUser.id, { email });
      return true;
    } catch (error) {
      logger.logAuthError('LOGIN_FAILED', error instanceof Error ? error : new Error('Unknown error'), { email });
      return false;
    }
  }

  async loginWithGoogle(googleProfile: GoogleUserProfile): Promise<boolean> {
    try {
      logger.logAuthAction('GOOGLE_LOGIN_ATTEMPT', undefined, { email: googleProfile.email });
      
      // Debug: Log the token being sent
      console.log('Google profile received:', googleProfile);
      console.log('Google profile token:', googleProfile.token);
      console.log('Token length:', googleProfile.token?.length);
      console.log('Token first 50 chars:', googleProfile.token?.substring(0, 50));
      
      const payload = { token: googleProfile.token };
      console.log('Request payload before sending:', payload);
      console.log('Payload stringified:', JSON.stringify(payload));
      
      // Send Google token to backend for verification using direct axios call
      console.log('Making request to:', `${API_URL}/auth/google`);
      const response = await axios.post(`${API_URL}/auth/google`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const authResponse = response.data as AuthResponse;
      const { user, accessToken, refreshToken } = authResponse;
      
      localStorage.setItem(this.storageTokenKey, accessToken);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      localStorage.setItem(this.storageUserIdKey, user._id || user.id || '');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      apiService.setToken(accessToken);
      
      // Normalize user data for frontend compatibility
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        token: accessToken
      };
      this.currentUser = normalizedUser;
      
      logger.logAuthAction('GOOGLE_LOGIN_SUCCESS', normalizedUser.id, { email: googleProfile.email });
      return true;
    } catch (error) {
      logger.logAuthError('GOOGLE_LOGIN_FAILED', error instanceof Error ? error : new Error('Unknown error'), { email: googleProfile.email });
      return false;
    }
  }

  async register(firstName: string, lastName: string, email: string, password: string, role: string): Promise<boolean> {
    try {
      logger.logAuthAction('REGISTER_ATTEMPT', undefined, { email });
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName,
        lastName,
        email,
        password,
        role
      });
      
      const authResponse = response.data as AuthResponse;
      const { user, accessToken, refreshToken } = authResponse;
      
      localStorage.setItem(this.storageTokenKey, accessToken);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      localStorage.setItem(this.storageUserIdKey, user._id || user.id || '');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      apiService.setToken(accessToken);
      
      // Normalize user data for frontend compatibility
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        token: accessToken
      };
      this.currentUser = normalizedUser;
      
      logger.logAuthAction('REGISTER_SUCCESS', normalizedUser.id, { email });
      return true;
    } catch (error) {
      logger.logAuthError('REGISTER_FAILED', error instanceof Error ? error : new Error('Unknown error'), { email });
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      logger.logAuthAction('REFRESH_TOKEN_ATTEMPT');
      
      const refreshToken = localStorage.getItem(this.storageRefreshTokenKey);
      const userId = localStorage.getItem(this.storageUserIdKey);
      
      if (!refreshToken || !userId) {
        throw new Error('No refresh token or user ID found');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken,
        userId
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data as AuthTokens;
      
      localStorage.setItem(this.storageTokenKey, accessToken);
      localStorage.setItem(this.storageRefreshTokenKey, newRefreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      apiService.setToken(accessToken);
      
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
      apiService.setToken(token);
      
      const response = await axios.get(`${API_URL}/auth/me`);
      const user = response.data as User;
      
      // Normalize user data for frontend compatibility
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        token
      };
      this.currentUser = normalizedUser;
      
      return user;
    } catch (error) {
      console.error('Load current user error:', error);
      return null;
    }
  }

  logout(): void {
    const userId = this.currentUser?.id;
    logger.logAuthAction('LOGOUT', userId);
    
    // Send logout request to backend
    const refreshToken = localStorage.getItem(this.storageRefreshTokenKey);
    if (refreshToken) {
      axios.post(`${API_URL}/auth/logout`, { refreshToken }).catch(() => {
        // Ignore errors on logout
      });
    }
    
    localStorage.removeItem(this.storageTokenKey);
    localStorage.removeItem(this.storageRefreshTokenKey);
    localStorage.removeItem(this.storageUserIdKey);
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
    // Alias for backward compatibility
    return this.login(email, password);
  }

  getAuthHeader(): { Authorization: string } | undefined {
    const token = localStorage.getItem(this.storageTokenKey);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }
}

export const authService = new AuthService();
