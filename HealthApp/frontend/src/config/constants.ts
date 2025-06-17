// API Configuration
export const API_URL = process.env['EXPO_PUBLIC_API_URL'] || 'http://192.168.0.103:5000';

// Storage Keys
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  TWO_FA_SECRET: '@two_fa_secret',
  TWO_FA_ENABLED: '@two_fa_enabled',
  
  // App Settings
  THEME: '@theme',
  LANGUAGE: '@language',
  SETTINGS: '@settings',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  BIOMETRIC_ENABLED: '@biometric_enabled',
  PIN_CODE: '@pin_code',
  PIN_ENABLED: '@pin_enabled',
  
  // Session
  LAST_ACTIVITY: '@last_activity',
  SESSION_TIMEOUT: '@session_timeout',
  LAST_SYNC: '@last_sync',
  
  // Network
  LAST_KNOWN_IP: '@last_known_ip',
  LAST_IP_CHECK: '@last_ip_check',
  API_CACHE: '@api_cache',
  
  // Data
  OFFLINE_DATA: '@offline_data',
  NOTIFICATIONS: '@notifications',
  ERROR_LOGS: '@error_logs',
  DEBUG_MODE: '@debug_mode',
  FEATURE_FLAGS: '@feature_flags',
  USER_PREFERENCES: '@user_preferences',
  
  // Cache
  CACHED_MEDICAL_RECORDS: '@cached_medical_records',
  CACHED_APPOINTMENTS: '@cached_appointments',
  CACHED_MESSAGES: '@cached_messages',
  CACHED_PROFILE: '@cached_profile',
  CACHED_DOCTORS: '@cached_doctors',
  CACHED_PATIENTS: '@cached_patients',
  CACHED_NOTIFICATIONS: '@cached_notifications',
  CACHED_SETTINGS: '@cached_settings',
  CACHED_THEME: '@cached_theme',
  CACHED_LANGUAGE: '@cached_language',
  CACHED_BIOMETRIC: '@cached_biometric',
  CACHED_PIN: '@cached_pin',
  CACHED_SESSION: '@cached_session',
  CACHED_API: '@cached_api',
  CACHED_ERROR: '@cached_error',
  CACHED_DEBUG: '@cached_debug',
  CACHED_FEATURES: '@cached_features',
  CACHED_PREFS: '@cached_prefs'
} as const;

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// User Roles
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
} as const;

// Navigation
export const ROUTES = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
    VERIFY_2FA: 'Verify2FA',
  },
  PATIENT: {
    DASHBOARD: 'PatientDashboard',
    PROFILE: 'PatientProfile',
    EDIT_PROFILE: 'PatientEditProfile',
    APPOINTMENTS: 'PatientAppointments',
    MEDICAL_RECORDS: 'PatientMedicalRecords',
    MESSAGES: 'PatientMessages',
    APPOINTMENT_DETAILS: 'PatientAppointmentDetails',
    NEW_APPOINTMENT: 'PatientNewAppointment',
    MEDICAL_RECORD_DETAILS: 'PatientMedicalRecordDetails',
    CHAT: 'PatientChat',
  },
  DOCTOR: {
    DASHBOARD: 'DoctorDashboard',
    PROFILE: 'DoctorProfile',
    APPOINTMENTS: 'DoctorAppointments',
    PATIENTS: 'DoctorPatients',
    PATIENT_LIST: 'DoctorPatients',
    MESSAGES: 'DoctorMessages',
    MEDICAL_RECORDS: 'DoctorMedicalRecords',
    APPOINTMENT_DETAILS: 'DoctorAppointmentDetails',
    PRESCRIPTION_MANAGEMENT: 'DoctorPrescriptionManagement',
    MEDICAL_RECORD_MANAGEMENT: 'DoctorMedicalRecordManagement',
    APPOINTMENT_MANAGEMENT: 'DoctorAppointmentManagement',
    CREATE_MEDICAL_RECORD: 'DoctorCreateMedicalRecord',
  },
  ADMIN: {
    DASHBOARD: 'AdminDashboard',
    USER_MANAGEMENT: 'AdminUserManagement',
    SYSTEM_SETTINGS: 'AdminSystemSettings',
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
    VERIFY_2FA: '/api/auth/2fa/verify',
    SETUP_2FA: '/api/auth/2fa/setup',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_TOKEN: '/api/auth/verify-token',
    CURRENT_USER: '/api/auth/current-user'
  },
  APPOINTMENTS: {
    BASE: '/api/patient/appointments',
    UPCOMING: '/api/patient/appointments/upcoming',
    PATIENT: '/api/patient/appointments',
    DOCTOR: '/api/doctor/appointments',
  },
  MEDICAL_RECORDS: {
    BASE: '/api/patient/medical-records',
    PATIENT: '/api/patient/medical-records',
    DOCTOR: '/api/doctor/medical-records',
  },
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    DOCTORS: '/api/users/doctors',
    PATIENTS: '/api/users/patients',
  },
  MESSAGES: {
    BASE: '/api/messages',
    CONVERSATIONS: '/api/messages/conversations',
  },
  PATIENT: {
    HEALTH_SUMMARY: '/api/patient/health-summary',
    APPOINTMENTS: '/api/patient/appointments',
    UPCOMING_APPOINTMENTS: '/api/patient/appointments/upcoming',
    MEDICAL_RECORDS: '/api/patient/medical-records',
  },
} as const;

export const APP_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  CACHE_DURATION: 3600, // 1 hour in seconds
  PAGINATION_LIMIT: 10,
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 3000, // milliseconds
} as const; 