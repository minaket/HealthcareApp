import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../config/constants';
import { DoctorStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import { DoctorProfileScreen } from '../screens/doctor/DoctorProfileScreen';
import { PatientListScreen } from '../screens/doctor/PatientListScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import { DoctorMedicalRecordsScreen } from '../screens/doctor/DoctorMedicalRecordsScreen';
import PrescriptionManagementScreen from '../screens/doctor/PrescriptionManagementScreen';
import MedicalRecordManagementScreen from '../screens/doctor/MedicalRecordManagementScreen';
import AppointmentManagementScreen from '../screens/doctor/AppointmentManagementScreen';
import CreateMedicalRecordScreen from '../screens/doctor/CreateMedicalRecordScreen';

const Stack = createNativeStackNavigator<DoctorStackParamList>();
const Tab = createBottomTabNavigator<DoctorStackParamList>();

const DoctorTabs = () => {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.default,
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text.default,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name={ROUTES.DOCTOR.DASHBOARD} 
        component={DoctorDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.DOCTOR.PATIENTS} 
        component={PatientListScreen}
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.DOCTOR.APPOINTMENTS} 
        component={DoctorAppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.DOCTOR.MEDICAL_RECORDS} 
        component={DoctorMedicalRecordsScreen}
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const DoctorStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DoctorTabs" 
        component={DoctorTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.DOCTOR.PROFILE} 
        component={DoctorProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name={ROUTES.DOCTOR.MEDICAL_RECORDS} 
        component={DoctorMedicalRecordsScreen}
        options={{
          title: 'Medical Records',
        }}
      />
      <Stack.Screen 
        name={ROUTES.DOCTOR.PRESCRIPTION_MANAGEMENT} 
        component={PrescriptionManagementScreen}
        options={{
          title: 'Prescriptions',
        }}
      />
      <Stack.Screen 
        name={ROUTES.DOCTOR.MEDICAL_RECORD_MANAGEMENT} 
        component={MedicalRecordManagementScreen}
        options={{
          title: 'Manage Records',
        }}
      />
      <Stack.Screen 
        name={ROUTES.DOCTOR.APPOINTMENT_MANAGEMENT} 
        component={AppointmentManagementScreen}
        options={{
          title: 'Manage Appointments',
        }}
      />
      <Stack.Screen 
        name={ROUTES.DOCTOR.CREATE_MEDICAL_RECORD} 
        component={CreateMedicalRecordScreen}
        options={{
          title: 'Create Medical Record',
        }}
      />
    </Stack.Navigator>
  );
}; 