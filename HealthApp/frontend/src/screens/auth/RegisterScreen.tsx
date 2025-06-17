import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { register } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../types/navigation';
import { ROUTES, USER_ROLES } from '../../config/constants';
import { useTheme } from '../../theme/ThemeProvider';
import { RegisterCredentials } from '../../types/auth';
import { RootState } from '../../store';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: USER_ROLES.PATIENT,
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!credentials.email || !credentials.password || !credentials.firstName || !credentials.lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (credentials.password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await dispatch(register(credentials)).unwrap();
    } catch (err) {
      // Error is handled by the auth slice
      console.error('Registration failed:', err);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    input: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.medium,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      color: theme.colors.text.default,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    rowInput: {
      flex: 1,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.layout.borderRadius.medium,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
    },
    link: {
      color: theme.colors.primary,
      fontSize: 14,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    roleContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    roleButton: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginHorizontal: theme.spacing.xs,
      alignItems: 'center',
    },
    roleButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    roleButtonText: {
      color: theme.colors.primary,
    },
    roleButtonTextActive: {
      color: '#FFFFFF',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.row}>
          <View style={styles.rowInput}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={theme.colors.text.secondary}
              value={credentials.firstName}
              onChangeText={(text) => setCredentials({ ...credentials, firstName: text })}
            />
          </View>
          <View style={styles.rowInput}>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={theme.colors.text.secondary}
              value={credentials.lastName}
              onChangeText={(text) => setCredentials({ ...credentials, lastName: text })}
            />
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={credentials.email}
          onChangeText={(text) => setCredentials({ ...credentials, email: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.text.secondary}
          secureTextEntry
          value={credentials.password}
          onChangeText={(text) => setCredentials({ ...credentials, password: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={theme.colors.text.secondary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              credentials.role === USER_ROLES.PATIENT && styles.roleButtonActive,
            ]}
            onPress={() => setCredentials({ ...credentials, role: USER_ROLES.PATIENT })}
          >
            <Text
              style={[
                styles.roleButtonText,
                credentials.role === USER_ROLES.PATIENT && styles.roleButtonTextActive,
              ]}
            >
              Patient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              credentials.role === USER_ROLES.DOCTOR && styles.roleButtonActive,
            ]}
            onPress={() => setCredentials({ ...credentials, role: USER_ROLES.DOCTOR })}
          >
            <Text
              style={[
                styles.roleButtonText,
                credentials.role === USER_ROLES.DOCTOR && styles.roleButtonTextActive,
              ]}
            >
              Doctor
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 