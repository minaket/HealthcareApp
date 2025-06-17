import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '../hooks/useAppSelector';
import { STORAGE_KEYS, ROUTES } from '../config/constants';
import { RootStackParamList } from '../types/navigation';
import { AuthStack } from './AuthStack';
import { PatientStack } from './PatientStack';
import { DoctorStack } from './DoctorStack';
import { AdminStack } from './AdminStack';
import { useTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  // Create navigation themes based on our app theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.notification,
    },
  };

  // Determine which stack to show based on user role
  const getRoleStack = () => {
    if (!user) return null;

    switch (user.role) {
      case 'patient':
        return <Stack.Screen name="Patient" component={PatientStack} />;
      case 'doctor':
        return <Stack.Screen name="Doctor" component={DoctorStack} />;
      case 'admin':
        return <Stack.Screen name="Admin" component={AdminStack} />;
      default:
        return null;
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          getRoleStack()
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 