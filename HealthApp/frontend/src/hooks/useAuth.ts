import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios.config';
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

      setState({
        user: { ...user, token },
        loading: false,
        error: null,
      });

      return user;
    } catch (error: any) {
      console.error('Login error details:', error.response?.data);
      
      let errorMessage = 'Login failed';
      if (error.response?.data?.errors) {
        errorMessage = formatValidationErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      const authError = new Error(errorMessage);
      setState(prev => ({ ...prev, error: authError, loading: false }));
      throw authError;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('Attempting registration to:', `${api.defaults.baseURL}${API_ENDPOINTS.AUTH.REGISTER}`);
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      console.log('Registration response:', response.data);

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

      setState({
        user: { ...user, token },
        loading: false,
        error: null,
      });

      return user;
    } catch (error: any) {
      console.error('Registration error details:', error.response?.data);
      
      let errorMessage = 'Registration failed';
      if (error.response?.data?.errors) {
        errorMessage = formatValidationErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      const authError = new Error(errorMessage);
      setState(prev => ({ ...prev, error: authError, loading: false }));
      throw authError;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Call logout endpoint to invalidate token
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);

      // Clear stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server request fails
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
      setState({
        user: null,
        loading: false,
        error: null,
      });
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

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
  };
}; 