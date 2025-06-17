import { AxiosError } from 'axios';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse, PasswordResetResponse, TokenVerificationResponse } from '../types/auth';
import getApi from '../api/axios.config';
import { API_ENDPOINTS } from '../config/constants';

interface ApiError {
  message: string;
  code?: string;
  errors?: string[];
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const api = await getApi();
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw {
      code: axiosError.code || 'UNKNOWN_ERROR',
      message: axiosError.response?.data?.message || 'Login failed',
      errors: axiosError.response?.data?.errors
    };
  }
};

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const api = await getApi();
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, credentials);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw {
      code: axiosError.code || 'UNKNOWN_ERROR',
      message: axiosError.response?.data?.message || 'Registration failed',
      errors: axiosError.response?.data?.errors
    };
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const api = await getApi();
    const response = await api.get(API_ENDPOINTS.AUTH.CURRENT_USER);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw {
      code: axiosError.code || 'UNKNOWN_ERROR',
      message: axiosError.response?.data?.message || 'Failed to get current user',
      errors: axiosError.response?.data?.errors
    };
  }
};

export const authService = {
  forgotPassword: async (email: string): Promise<PasswordResetResponse> => {
    try {
      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.response?.data?.message || 'Password reset request failed',
        errors: axiosError.response?.data?.errors
      };
    }
  },

  resetPassword: async (token: string, password: string): Promise<PasswordResetResponse> => {
    try {
      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.response?.data?.message || 'Password reset failed',
        errors: axiosError.response?.data?.errors
      };
    }
  },

  verifyResetToken: async (token: string): Promise<TokenVerificationResponse> => {
    try {
      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_TOKEN, { token });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.response?.data?.message || 'Token verification failed',
        errors: axiosError.response?.data?.errors
      };
    }
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const api = await getApi();
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.response?.data?.message || 'Token refresh failed',
        errors: axiosError.response?.data?.errors
      };
    }
  },

  logout: async (): Promise<void> => {
    try {
      const api = await getApi();
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.response?.data?.message || 'Logout failed',
        errors: axiosError.response?.data?.errors
      };
    }
  }
}; 