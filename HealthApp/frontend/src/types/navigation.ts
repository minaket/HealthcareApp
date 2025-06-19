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
  [ROUTES.PATIENT.DASHBOARD]: undefined;
  [ROUTES.PATIENT.PROFILE]: undefined;
  [ROUTES.PATIENT.EDIT_PROFILE]: undefined;
  [ROUTES.PATIENT.APPOINTMENTS]: undefined;
  [ROUTES.PATIENT.MEDICAL_RECORDS]: undefined;
  [ROUTES.PATIENT.MESSAGES]: undefined;
  [ROUTES.PATIENT.MESSAGE_DOCTORS]: undefined;
  [ROUTES.PATIENT.APPOINTMENT_DETAILS]: { appointmentId: string };
  [ROUTES.PATIENT.NEW_APPOINTMENT]: undefined;
  [ROUTES.PATIENT.MEDICAL_RECORD_DETAILS]: { recordId: string };
  [ROUTES.PATIENT.CHAT]: { chatId: string; patientName: string };
  [ROUTES.PATIENT.UPLOAD_MEDICAL_RECORD]: undefined;
};

// Doctor Stack
export type DoctorStackParamList = {
  DoctorTabs: undefined;
  [ROUTES.DOCTOR.DASHBOARD]: undefined;
  [ROUTES.DOCTOR.PROFILE]: undefined;
  [ROUTES.DOCTOR.APPOINTMENTS]: undefined;
  [ROUTES.DOCTOR.PATIENTS]: undefined;
  [ROUTES.DOCTOR.MESSAGES]: undefined;
  [ROUTES.DOCTOR.MEDICAL_RECORDS]: undefined;
  [ROUTES.DOCTOR.APPOINTMENT_DETAILS]: { appointmentId: string };
  [ROUTES.DOCTOR.PRESCRIPTION_MANAGEMENT]: { patientId: string };
  [ROUTES.DOCTOR.MEDICAL_RECORD_MANAGEMENT]: { patientId: string };
  [ROUTES.DOCTOR.APPOINTMENT_MANAGEMENT]: undefined;
  [ROUTES.DOCTOR.CREATE_MEDICAL_RECORD]: undefined;
  [ROUTES.DOCTOR.CHAT]: { chatId: string; patientName: string };
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