import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';
import { AuthResponse } from '../types/auth';
import { getApiUrl } from '../utils/network';

let api: AxiosInstance | null = null;

export const getApi = async (): Promise<AxiosInstance> => {
  if (api) {
    return api;
  }

  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  // Get the best available API URL using dynamic detection
  const baseURL = await getApiUrl();
  
  console.log('🔧 Creating axios instance with baseURL:', baseURL);

  api = axios.create({
    baseURL,
    timeout: 15000, // Increased timeout for better reliability
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Add request interceptor
  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const currentToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (currentToken && config.headers) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      
      // Log request for debugging
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor
  api.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      return response;
    },
    async (error) => {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'NETWORK_ERROR'}`);
      
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
            `${baseURL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
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
          if (api) {
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
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