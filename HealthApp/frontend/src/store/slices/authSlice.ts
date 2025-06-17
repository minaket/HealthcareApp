import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_ENDPOINTS } from '../../config/constants';
import { getApi } from '../../api/axios.config';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse, AuthState, AuthError } from '../../types/auth';
import axios from 'axios';

const initialState: AuthState = {
  user: null,
  token: undefined,
  refreshToken: undefined,
  isAuthenticated: false,
  isLoading: false,
  error: undefined,
  errorCode: undefined
};

export const login = createAsyncThunk<AuthResponse, LoginCredentials, { rejectValue: AuthError }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Attempting login with credentials:', {
        ...credentials,
        password: '[REDACTED]'
      });

      const apiInstance = await getApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }

      const response = await apiInstance.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      console.log('Login response:', {
        status: response.status,
        data: {
          ...response.data,
          token: response.data.token ? '[REDACTED]' : undefined
        }
      });

      const { accessToken, refreshToken, user } = response.data;
      
      if (!accessToken || !user) {
        console.error('Invalid response from server:', response.data);
        throw new Error('Invalid response from server');
      }

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken ?? ''),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
      ]);
      
      return { ...response.data, token: accessToken };
    } catch (error) {
      console.error('Login error:', {
        code: error instanceof axios.AxiosError ? error.code : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        response: error instanceof axios.AxiosError ? error.response?.data : undefined,
        status: error instanceof axios.AxiosError ? error.response?.status : undefined
      });

      // Handle specific error codes from the backend
      if (error instanceof axios.AxiosError && error.response?.data?.code === 'INVALID_CREDENTIALS') {
        return rejectWithValue({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      if (error instanceof axios.AxiosError && error.response?.data?.code === 'LOGIN_ERROR') {
        return rejectWithValue({
          message: 'Login failed. Please try again later.',
          code: 'LOGIN_ERROR'
        });
      }

      // Handle network errors
      if (error instanceof axios.AxiosError && error.code === 'ERR_NETWORK') {
        return rejectWithValue({
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          code: 'NETWORK_ERROR'
        });
      }

      if (error instanceof axios.AxiosError && error.code === 'ECONNABORTED') {
        return rejectWithValue({
          message: 'Request timed out. The server might be busy. Please try again.',
          code: 'TIMEOUT'
        });
      }

      // Handle HTTP status codes
      if (error instanceof axios.AxiosError && error.response?.status === 400) {
        const errorData = error.response.data as { message?: string; errors?: any[] };
        return rejectWithValue({
          message: errorData.message || 'Invalid input. Please check your details and try again.',
          code: 'INVALID_INPUT',
          errors: errorData.errors
        });
      }

      if (error instanceof axios.AxiosError && error.response?.status === 401) {
        return rejectWithValue({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      if (error instanceof axios.AxiosError && error.response?.status === 500) {
        return rejectWithValue({
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR'
        });
      }

      // Default error
      return rejectWithValue({
        message: error instanceof axios.AxiosError 
          ? (error.response?.data as { message?: string })?.message || error.message || 'Login failed. Please try again.'
          : error instanceof Error 
            ? error.message 
            : 'Login failed. Please try again.',
        code: error instanceof axios.AxiosError 
          ? (error.response?.data as { code?: string })?.code || 'UNKNOWN_ERROR'
          : 'UNKNOWN_ERROR',
        details: error instanceof axios.AxiosError ? error.response?.data : undefined
      });
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_DATA
  ]);
});

export const register = createAsyncThunk<AuthResponse, RegisterCredentials, { rejectValue: AuthError }>(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Attempting registration with credentials:', {
        ...credentials,
        password: '[REDACTED]'
      });
      
      const apiInstance = await getApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }
      
      const response = await apiInstance.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, credentials);
      console.log('Registration response:', {
        status: response.status,
        data: {
          ...response.data,
          token: response.data.token ? '[REDACTED]' : undefined
        }
      });
      
      const { accessToken, refreshToken, user } = response.data;
      
      if (!accessToken || !user) {
        console.error('Invalid response from server:', response.data);
        throw new Error('Invalid response from server');
      }

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken ?? ''),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
      ]);
      
      return { ...response.data, token: accessToken };
    } catch (error) {
      console.error('Registration error:', {
        code: error instanceof axios.AxiosError ? error.code : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        response: error instanceof axios.AxiosError ? error.response?.data : undefined,
        status: error instanceof axios.AxiosError ? error.response?.status : undefined
      });

      // Handle specific error codes from the backend
      if (error instanceof axios.AxiosError && error.response?.data?.code === 'EMAIL_EXISTS') {
        return rejectWithValue({
          message: 'This email is already registered. Please use a different email or try logging in.',
          code: 'EMAIL_EXISTS'
        });
      }

      if (error instanceof axios.AxiosError && error.response?.data?.code === 'VALIDATION_ERROR') {
        const errorData = error.response.data as { message?: string; errors?: any[] };
        return rejectWithValue({
          message: errorData.message || 'Please check your input and try again.',
          code: 'VALIDATION_ERROR',
          errors: errorData.errors
        });
      }

      if (error instanceof axios.AxiosError && error.response?.data?.code === 'REGISTRATION_ERROR') {
        const errorData = error.response.data as { message?: string; details?: any };
        return rejectWithValue({
          message: errorData.message || 'Registration failed. Please try again later.',
          code: 'REGISTRATION_ERROR',
          details: errorData.details
        });
      }

      // Handle network errors
      if (error instanceof axios.AxiosError && error.code === 'ERR_NETWORK') {
        return rejectWithValue({
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          code: 'NETWORK_ERROR'
        });
      }

      if (error instanceof axios.AxiosError && error.code === 'ECONNABORTED') {
        return rejectWithValue({
          message: 'Request timed out. The server might be busy. Please try again.',
          code: 'TIMEOUT'
        });
      }

      // Handle HTTP status codes
      if (error instanceof axios.AxiosError && error.response?.status === 400) {
        const errorData = error.response.data as { message?: string; errors?: any[] };
        return rejectWithValue({
          message: errorData.message || 'Invalid input. Please check your details and try again.',
          code: 'INVALID_INPUT',
          errors: errorData.errors
        });
      }

      if (error instanceof axios.AxiosError && error.response?.status === 500) {
        return rejectWithValue({
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR'
        });
      }

      // Default error
      return rejectWithValue({
        message: error instanceof axios.AxiosError 
          ? (error.response?.data as { message?: string })?.message || error.message || 'Registration failed. Please try again.'
          : error instanceof Error 
            ? error.message 
            : 'Registration failed. Please try again.',
        code: error instanceof axios.AxiosError 
          ? (error.response?.data as { code?: string })?.code || 'UNKNOWN_ERROR'
          : 'UNKNOWN_ERROR',
        details: error instanceof axios.AxiosError ? error.response?.data : undefined
      });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = undefined;
      state.errorCode = undefined;
    },
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!token;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
        state.errorCode = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = undefined;
        state.errorCode = undefined;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message;
        state.errorCode = action.payload?.code;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
        state.errorCode = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = undefined;
        state.errorCode = undefined;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message;
        state.errorCode = action.payload?.code;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = undefined;
        state.refreshToken = undefined;
        state.isAuthenticated = false;
        state.error = undefined;
        state.errorCode = undefined;
      });
  }
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer; 