import { User } from './user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: User['gender'];
  address?: User['address'];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  token?: string; // For backward compatibility
}

export interface AuthState {
  user: User | null;
  token: string | undefined;
  refreshToken: string | undefined;
  isLoading: boolean;
  error: string | undefined;
  errorCode: string | undefined;
  isAuthenticated: boolean;
}

export interface AuthError {
  message: string;
  code: string;
  errors?: Array<{ field: string; message: string }>;
  details?: any;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface TokenVerificationRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
  data?: {
    resetToken?: string;
    email?: string;
  };
}

export interface TokenVerificationResponse {
  message: string;
  success: boolean;
  data?: {
    isValid: boolean;
    email?: string;
  };
}

// Re-export User type from user.ts
export type { User } from './user'; 