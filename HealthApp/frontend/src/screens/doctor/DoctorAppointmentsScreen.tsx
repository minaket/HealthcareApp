import * as React from 'react';
import { useState, useEffect } from 'react';
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
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

type DoctorAppointmentsScreenNavigationProp = NativeStackNavigationProp<
  DoctorStackParamList,
  typeof ROUTES.DOCTOR.APPOINTMENTS
>;

interface AppointmentWithPatient extends Appointment {
  patient: User;
}

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation<DoctorAppointmentsScreenNavigationProp>();
  const { theme, isDarkMode } = useTheme();

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/doctor/appointments', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      });
      setAppointments(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appointments');
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
      await api.patch(`/appointments/${appointmentId}`, { status: newStatus });
      await fetchAppointments();
      Alert.alert('Success', 'Appointment status updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.danger;
      case 'no_show':
        return theme.colors.warning;
      default:
        return theme.colors.text.primary;
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
      backgroundColor: theme.colors.background.primary,
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
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
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
    },
    dateButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    dateButtonText: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.sm,
    },
    dateButtonTextActive: {
      color: theme.colors.white,
    },
    appointmentCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    appointmentTime: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    appointmentStatus: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.small,
    },
    statusText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
    },
    patientInfo: {
      marginBottom: theme.spacing.sm,
    },
    patientName: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    appointmentType: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    appointmentReason: {
      fontSize: theme.typography.fontSize.sm,
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
      backgroundColor: `${theme.colors.primary}20`,
    },
    actionButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSize.base,
      marginTop: theme.spacing.xl,
    },
  });

  if (isLoading) {
    return React.createElement(
      View,
      { style: [styles.container, { justifyContent: 'center', alignItems: 'center' }] },
      React.createElement(ActivityIndicator, { size: 'large', color: theme.colors.primary })
    );
  }

  return React.createElement(
    ScrollView,
    {
      style: styles.container,
      contentContainerStyle: styles.content,
      refreshControl: React.createElement(RefreshControl, {
        refreshing: isRefreshing,
        onRefresh,
      }),
    },
    React.createElement(
      View,
      { style: styles.header },
      React.createElement(Text, { style: styles.title }, 'Appointments')
    ),
    error && React.createElement(Text, { style: styles.errorText }, error),
    React.createElement(
      ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        style: styles.dateSelector,
      },
      [-2, -1, 0, 1, 2].map((dayOffset) => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

        return React.createElement(
          TouchableOpacity,
          {
            key: dayOffset,
            style: [styles.dateButton, isSelected && styles.dateButtonActive],
            onPress: () => setSelectedDate(date),
          },
          React.createElement(
            Text,
            {
              style: [styles.dateButtonText, isSelected && styles.dateButtonTextActive],
            },
            getRelativeDate(format(date, 'yyyy-MM-dd'))
          )
        );
      })
    ),
    appointments.length === 0
      ? React.createElement(Text, { style: styles.emptyText }, 'No appointments scheduled for this date')
      : appointments.map((appointment) =>
          React.createElement(
            View,
            { key: appointment.id, style: styles.appointmentCard },
            React.createElement(
              View,
              { style: styles.appointmentHeader },
              React.createElement(
                Text,
                { style: styles.appointmentTime },
                `${format(parseISO(appointment.startTime), 'h:mm a')} - ${format(
                  parseISO(appointment.endTime),
                  'h:mm a'
                )}`
              ),
              React.createElement(
                View,
                {
                  style: [
                    styles.appointmentStatus,
                    { backgroundColor: `${getStatusColor(appointment.status)}20` },
                  ],
                },
                React.createElement(
                  Text,
                  {
                    style: [styles.statusText, { color: getStatusColor(appointment.status) }],
                  },
                  appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
                )
              )
            ),
            React.createElement(
              View,
              { style: styles.patientInfo },
              React.createElement(
                Text,
                { style: styles.patientName },
                `${appointment.patient.firstName} ${appointment.patient.lastName}`
              ),
              React.createElement(
                Text,
                { style: styles.appointmentType },
                appointment.type
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
              ),
              appointment.reason &&
                React.createElement(Text, { style: styles.appointmentReason }, appointment.reason)
            ),
            React.createElement(
              View,
              { style: styles.actionButtons },
              appointment.status === 'scheduled' &&
                React.createElement(
                  React.Fragment,
                  null,
                  React.createElement(
                    TouchableOpacity,
                    {
                      style: styles.actionButton,
                      onPress: () => handleStatusUpdate(appointment.id, 'completed'),
                    },
                    React.createElement(Text, { style: styles.actionButtonText }, 'Complete')
                  ),
                  React.createElement(
                    TouchableOpacity,
                    {
                      style: styles.actionButton,
                      onPress: () => handleStatusUpdate(appointment.id, 'cancelled'),
                    },
                    React.createElement(Text, { style: styles.actionButtonText }, 'Cancel')
                  )
                ),
              React.createElement(
                TouchableOpacity,
                {
                  style: styles.actionButton,
                  onPress: () =>
                    navigation.navigate(ROUTES.DOCTOR.APPOINTMENT_DETAILS, {
                      appointmentId: appointment.id,
                    }),
                },
                React.createElement(Text, { style: styles.actionButtonText }, 'View Details')
              )
            )
          )
        )
  );
} 