import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoctorStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeProvider';
import { Appointment, User } from '../../types';
import initializeApi from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type DoctorAppointmentsScreenNavigationProp = NativeStackNavigationProp<
  DoctorStackParamList,
  typeof ROUTES.DOCTOR.APPOINTMENTS
>;

interface AppointmentWithPatient extends Appointment {
  patient: User;
}

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation<DoctorAppointmentsScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const client = await initializeApi();
      const response = await client.get('/api/doctor/appointments', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      });
      setAppointments(response.data);
      setError(null);
    } catch (err: any) {
      console.log('Fetch appointments error:', err);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAppointments();
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const client = await initializeApi();
      await client.patch(`/api/appointments/${appointmentId}`, { status: newStatus });
      await fetchAppointments();
      Alert.alert('Success', 'Appointment status updated successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update appointment status');
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
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'clock-outline';
      case 'completed':
        return 'check-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'no_show':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getRelativeDate = (date: string) => {
    const parsedDate = parseISO(date);
    if (isToday(parsedDate)) return 'Today';
    if (isTomorrow(parsedDate)) return 'Tomorrow';
    if (isThisWeek(parsedDate)) return format(parsedDate, 'EEEE');
    return format(parsedDate, 'MMM dd, yyyy');
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
    dateSelector: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    dateButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.layout.borderRadius.medium,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    dateButtonText: {
      color: theme.colors.text.default,
      fontSize: 14,
      fontWeight: '500',
    },
    dateButtonTextActive: {
      color: 'white',
    },
    appointmentCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    appointmentTime: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text.default,
    },
    appointmentStatus: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.small,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: theme.spacing.xs,
    },
    patientInfo: {
      marginBottom: theme.spacing.sm,
    },
    patientName: {
      fontSize: 16,
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
      fontWeight: '600',
    },
    appointmentType: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    appointmentReason: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    actionButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.layout.borderRadius.medium,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: theme.spacing.xs,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
      fontSize: 16,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
      >
        {[-2, -1, 0, 1, 2].map((dayOffset) => {
          const date = new Date();
          date.setDate(date.getDate() + dayOffset);
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

          return (
            <TouchableOpacity
              key={dayOffset}
              style={[styles.dateButton, isSelected && styles.dateButtonActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateButtonText, isSelected && styles.dateButtonTextActive]}>
                {getRelativeDate(format(date, 'yyyy-MM-dd'))}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="calendar-blank" size={64} color={theme.colors.text.secondary} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No appointments scheduled for this date</Text>
        </View>
      ) : (
        appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTime}>
                {format(parseISO(appointment.startTime), 'h:mm a')} - {format(
                  parseISO(appointment.endTime),
                  'h:mm a'
                )}
              </Text>
              <View
                style={[
                  styles.appointmentStatus,
                  { backgroundColor: `${getStatusColor(appointment.status)}20` },
                ]}
              >
                <Icon 
                  name={getStatusIcon(appointment.status)} 
                  size={16} 
                  color={getStatusColor(appointment.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {appointment.patient.firstName} {appointment.patient.lastName}
              </Text>
              <Text style={styles.appointmentType}>
                {appointment.type
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Text>
              {appointment.reason && (
                <Text style={styles.appointmentReason}>{appointment.reason}</Text>
              )}
            </View>

            <View style={styles.actionButtons}>
              {appointment.status === 'scheduled' && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: `${theme.colors.success}20` }
                    ]}
                    onPress={() => handleStatusUpdate(appointment.id, 'completed')}
                  >
                    <Icon name="check" size={16} color={theme.colors.success} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.success }]}>
                      Complete
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: `${theme.colors.error}20` }
                    ]}
                    onPress={() => handleStatusUpdate(appointment.id, 'cancelled')}
                  >
                    <Icon name="close" size={16} color={theme.colors.error} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: `${theme.colors.primary}20` }
                ]}
                onPress={() =>
                  navigation.navigate(ROUTES.DOCTOR.APPOINTMENT_DETAILS, {
                    appointmentId: appointment.id,
                  })
                }
              >
                <Icon name="eye" size={16} color={theme.colors.primary} />
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  View Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
} 