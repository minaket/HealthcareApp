import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';
import { AuthResponse } from '../types/auth';

let api: AxiosInstance | null = null;

export const getApi = async (): Promise<AxiosInstance> => {
  if (api) {
    return api;
  }

  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Add request interceptor
  api.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
      const currentToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (currentToken && config.headers) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh token yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const currentRefreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          // Call refresh token endpoint
          const response = await axios.post<AuthResponse>(
            `${API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
            { refreshToken: currentRefreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Store new tokens
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken),
            AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken || '')
          ]);

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Retry original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh token fails, clear storage and redirect to login
          await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA)
          ]);
          throw refreshError;
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
};

export const clearApi = () => {
  api = null;
};

// Initialize the default export
const initializeApi = async () => {
  if (!api) {
    api = await getApi();
  }
  return api;
};

export default initializeApi; 