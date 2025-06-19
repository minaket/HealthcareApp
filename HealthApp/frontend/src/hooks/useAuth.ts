import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi } from '../api/axios.config';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor';
}

const formatValidationErrors = (errors: any[]): string => {
  if (!errors || !Array.isArray(errors)) return 'Invalid request data';
  
  return errors
    .map(error => {
      if (typeof error === 'string') return error;
      if (error.msg) return error.msg;
      if (error.message) return error.message;
      return JSON.stringify(error);
    })
    .join('\n');
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const loadStoredUser = useCallback(async () => {
    try {
      const [userData, token] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
      ]);

      if (userData && token) {
        const user = JSON.parse(userData);
        setState(prev => ({ ...prev, user: { ...user, token }, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load user data'),
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadStoredUser();
  }, [loadStoredUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const api = await getApi();
      console.log('Attempting login to:', `${api.defaults.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`);
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      console.log('Login response:', response.data);

      const { user, token, refreshToken } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''),
      ]);

      setState(prev => ({
        ...prev,
        user: { ...user, token },
        loading: false,
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = formatValidationErrors(error.response.data.errors);
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: new Error(errorMessage),
        loading: false,
      }));

      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);

      const { user, token, refreshToken } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''),
      ]);

      setState(prev => ({
        ...prev,
        user: { ...user, token },
        loading: false,
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = formatValidationErrors(error.response.data.errors);
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: new Error(errorMessage),
        loading: false,
      }));

      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const api = await getApi();
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of logout success
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: null,
      }));
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.put(API_ENDPOINTS.USERS.PROFILE, updates);
      const updatedUser = response.data;

      // Update stored user data
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(updatedUser)
      );

      setState(prev => ({
        ...prev,
        user: { ...updatedUser, token: prev.user?.token || '' },
        loading: false,
      }));

      return updatedUser;
    } catch (error) {
      const updateError = error instanceof Error ? error : new Error('Profile update failed');
      setState(prev => ({ ...prev, error: updateError, loading: false }));
      throw updateError;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset email';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = formatValidationErrors(error.response.data.errors);
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password,
      });
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to reset password';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = formatValidationErrors(error.response.data.errors);
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
  };
}; 