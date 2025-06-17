import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../config/constants';
import { PatientStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens (we'll create these next)
import PatientDashboardScreen from '../screens/patient/PatientDashboardScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';
import PatientEditProfileScreen from '../screens/patient/PatientEditProfileScreen';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import MedicalRecordsScreen from '../screens/patient/MedicalRecordsScreen';
import MessagesScreen from '../screens/patient/MessagesScreen';
import PatientNewAppointmentScreen from '../screens/patient/PatientNewAppointmentScreen';
import UploadMedicalRecordScreen from '../screens/patient/UploadMedicalRecordScreen';

const Stack = createNativeStackNavigator<PatientStackParamList>();
const Tab = createBottomTabNavigator<PatientStackParamList>();

const PatientTabs = () => {
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
        tabBarInactiveTintColor: theme.colors.text,
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="PatientHome" 
        component={PatientDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.PATIENT.APPOINTMENTS} 
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.PATIENT.MEDICAL_RECORDS} 
        component={MedicalRecordsScreen}
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.PATIENT.MESSAGES} 
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const PatientStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PatientTabs" 
        component={PatientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.PROFILE} 
        component={PatientProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.EDIT_PROFILE} 
        component={PatientEditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.NEW_APPOINTMENT} 
        component={PatientNewAppointmentScreen}
        options={{
          title: 'New Appointment',
        }}
      />
      <Stack.Screen 
        name="UploadMedicalRecord" 
        component={UploadMedicalRecordScreen}
        options={{
          title: 'Upload Medical Record',
        }}
      />
    </Stack.Navigator>
  );
}; 