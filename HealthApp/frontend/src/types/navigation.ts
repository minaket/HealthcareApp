import { NavigatorScreenParams } from '@react-navigation/native';
import { ROUTES } from '../config/constants';
import { User } from './auth';

// Auth Stack
export type AuthStackParamList = {
  [ROUTES.AUTH.LOGIN]: undefined;
  [ROUTES.AUTH.REGISTER]: undefined;
  [ROUTES.AUTH.FORGOT_PASSWORD]: undefined;
  [ROUTES.AUTH.RESET_PASSWORD]: { token: string };
  [ROUTES.AUTH.VERIFY_2FA]: { email: string };
};

// Patient Stack
export type PatientStackParamList = {
  PatientTabs: undefined;
  PatientHome: undefined;
  [ROUTES.PATIENT.PROFILE]: undefined;
  [ROUTES.PATIENT.EDIT_PROFILE]: undefined;
  [ROUTES.PATIENT.NEW_APPOINTMENT]: undefined;
  [ROUTES.PATIENT.APPOINTMENTS]: undefined;
  [ROUTES.PATIENT.MEDICAL_RECORDS]: undefined;
  [ROUTES.PATIENT.MESSAGES]: undefined;
  [ROUTES.PATIENT.APPOINTMENT_DETAILS]: { appointmentId: string };
  [ROUTES.PATIENT.MEDICAL_RECORD_DETAILS]: { recordId: string };
  [ROUTES.PATIENT.CHAT]: { recipientId: string };
  UploadMedicalRecord: undefined;
};

// Doctor Stack
export type DoctorStackParamList = {
  [ROUTES.DOCTOR.DASHBOARD]: undefined;
  [ROUTES.DOCTOR.PROFILE]: undefined;
  [ROUTES.DOCTOR.APPOINTMENTS]: undefined;
  [ROUTES.DOCTOR.PATIENTS]: undefined;
  [ROUTES.DOCTOR.MESSAGES]: undefined;
  [ROUTES.DOCTOR.MEDICAL_RECORDS]: undefined;
  [ROUTES.DOCTOR.APPOINTMENT_DETAILS]: { appointmentId: string };
};

// Admin Stack
export type AdminStackParamList = {
  [ROUTES.ADMIN.DASHBOARD]: undefined;
  [ROUTES.ADMIN.USER_MANAGEMENT]: undefined;
  [ROUTES.ADMIN.SYSTEM_SETTINGS]: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Patient: NavigatorScreenParams<PatientStackParamList>;
  Doctor: NavigatorScreenParams<DoctorStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 