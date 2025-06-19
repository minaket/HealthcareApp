import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../config/constants';
import { PatientStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import PatientDashboardScreen from '../screens/patient/PatientDashboardScreen';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import MedicalRecordsScreen from '../screens/patient/MedicalRecordsScreen';
import MessagesScreen from '../screens/patient/MessagesScreen';

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
        name={ROUTES.PATIENT.DASHBOARD} 
        component={PatientDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.PATIENT.APPOINTMENTS} 
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.PATIENT.MEDICAL_RECORDS} 
        component={MedicalRecordsScreen}
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={ROUTES.PATIENT.MESSAGES} 
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default PatientTabs; 