import axios from 'axios';
import { User, UserRole } from '@/models/User';
import { userService, GoogleUserProfile } from './UserService'; // Import GoogleUserProfile
import { jwtDecode } from 'jwt-decode';

// Define API base URL
const API_URL = 'http://localhost:3001/api';

const TOKEN_KEY = 'managme_auth_token';
const USER_KEY = 'managme_current_user';

interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface AuthUser extends User {
  token: string;
}

interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
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
      const response = await axios.post(`${API_URL}/auth/login`, { 
        username, 
        password 
      });
      
      const { token, refreshToken } = response.data as AuthTokens;
      
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, refreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
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
      
      localStorage.setItem(this.storageTokenKey, token);
      localStorage.setItem(this.storageRefreshTokenKey, newRefreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return true;
    } catch (error) {
      console.error('Refresh token error:', error);
      // Clear auth
      this.logout();
      return false;
    }
  }

  loginUser(email: string, password?: string): { token: string; user: User } | null {
    const user = userService.getUserByEmail(email);

    if (!user) {
      console.warn('AuthService: Użytkownik nie znaleziony');
      return null;
    }
    
    // For manually created users, password is required
    if (user.role !== UserRole.GUEST && (!password || user.password !== password)) {
        console.warn('AuthService: Nieprawidłowe hasło');
        return null;
    }
    // For GUEST users (potentially created via OAuth), password check might be skipped if they only use OAuth
    // However, if a GUEST user somehow tries to log in via form, this logic might need adjustment.
    // Current userService.findOrCreateUserForGoogle doesn't set a password.

    const token = this.generateToken(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { token, user };
  }

  async loginWithGoogle(profile: GoogleUserProfile): Promise<{ token: string; user: User } | null> {
    try {
      const user = userService.findOrCreateUserForGoogle(profile);
      if (!user) {
        console.error('AuthService: Nie udało się znaleźć lub utworzyć użytkownika dla profilu Google.');
        return null;
      }

      // Guest users created via Google might not have a password.
      // The token generation should not depend on it.
      const token = this.generateToken(user);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { token, user };
    } catch (error) {
      console.error('AuthService: Błąd podczas logowania przez Google:', error);
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

  private generateToken(user: User): string {
    // Implementation for generating a token
    return 'generated-token';
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Token decoding error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
