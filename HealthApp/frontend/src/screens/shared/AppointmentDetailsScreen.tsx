import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList, DoctorStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { Appointment, User } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO } from 'date-fns';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';

type AppointmentDetailsScreenProps = {
  navigation: NativeStackNavigationProp<
    PatientStackParamList | DoctorStackParamList,
    'AppointmentDetails'
  >;
  route: RouteProp<PatientStackParamList | DoctorStackParamList, 'AppointmentDetails'>;
};

interface AppointmentDetails extends Appointment {
  patient: User;
  doctor: User;
}

export default function AppointmentDetailsScreen() {
  const navigation = useNavigation<AppointmentDetailsScreenProps['navigation']>();
  const route = useRoute<AppointmentDetailsScreenProps['route']>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointmentDetails = async () => {
    try {
      const response = await api.get(`/appointments/${route.params.appointmentId}`);
      setAppointment(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appointment details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [route.params.appointmentId]);

  const handleStatusUpdate = async (newStatus: Appointment['status']) => {
    try {
      await api.patch(`/appointments/${appointment?.id}`, { status: newStatus });
      await fetchAppointmentDetails();
      Alert.alert('Success', 'Appointment status updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleShare = async () => {
    if (!appointment) return;

    try {
      const message = `
Appointment Details:
Date: ${format(parseISO(appointment.date), 'MMMM dd, yyyy')}
Time: ${format(parseISO(appointment.startTime), 'h:mm a')} - ${format(parseISO(appointment.endTime), 'h:mm a')}
Type: ${appointment.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
Status: ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
${user?.role === 'patient' ? `Doctor: Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : `Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}`}
      `.trim();

      await Share.share({
        message,
        title: 'Appointment Details',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share appointment details');
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      case 'no_show':
        return theme.colors.warning;
      default:
        return theme.colors.text.default;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.default,
    },
    shareButton: {
      padding: theme.spacing.sm,
    },
    shareButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text.default + 'CC',
    },
    value: {
      fontSize: 14,
      color: theme.colors.text.default,
      flex: 1,
      textAlign: 'right',
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.small,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    notes: {
      fontSize: 14,
      color: theme.colors.text.default,
      marginTop: theme.spacing.sm,
      lineHeight: 20,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.medium,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.error,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Appointment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointment Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {format(parseISO(appointment.date), 'MMMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>
              {format(parseISO(appointment.startTime), 'h:mm a')} -{' '}
              {format(parseISO(appointment.endTime), 'h:mm a')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>
              {appointment.type.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(appointment.status) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(appointment.status) },
                ]}
              >
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {user?.role === 'patient' ? 'Doctor Information' : 'Patient Information'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {user?.role === 'patient'
                ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                : `${appointment.patient.firstName} ${appointment.patient.lastName}`}
            </Text>
          </View>
          {user?.role === 'patient' && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Specialization</Text>
              <Text style={styles.value}>{appointment.doctor.specialization}</Text>
            </View>
          )}
        </View>

        {appointment.reason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Visit</Text>
            <Text style={styles.notes}>{appointment.reason}</Text>
          </View>
        )}

        {appointment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notes}>{appointment.notes}</Text>
          </View>
        )}

        {user?.role === 'doctor' && appointment.status === 'scheduled' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleStatusUpdate('completed')}
            >
              <Text style={styles.buttonText}>Mark as Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleStatusUpdate('cancelled')}
            >
              <Text style={styles.buttonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 