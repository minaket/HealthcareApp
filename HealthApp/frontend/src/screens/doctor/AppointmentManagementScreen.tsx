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
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Appointment, Patient } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO, isToday, isAfter, isBefore } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

type AppointmentManagementScreenNavigationProp = NativeStackNavigationProp<
  any,
  'AppointmentManagement'
>;

type AppointmentWithPatient = Appointment & {
  patient: Patient;
};

export default function AppointmentManagementScreen() {
  const navigation = useNavigation<AppointmentManagementScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/doctors/appointments', {
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

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await api.patch(`/appointments/${appointmentId}`, { status });
      fetchAppointments();
      Alert.alert('Success', 'Appointment status updated successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const handleViewPatient = (patientId: string) => {
    navigation.navigate(ROUTES.DOCTOR.PATIENT_DETAILS, { patientId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      case 'no-show':
        return theme.colors.warning;
      default:
        return theme.colors.text;
    }
  };

  const renderAppointment = (appointment: AppointmentWithPatient) => {
    const appointmentTime = parseISO(appointment.timeSlot.startTime);
    const isPast = isBefore(appointmentTime, new Date());
    const statusColor = getStatusColor(appointment.status);

    return (
      <View
        key={appointment.id}
        style={[
          styles.appointmentCard,
          {
            backgroundColor: theme.colors.card,
            opacity: isPast ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.patientInfo}>
            <Text
              style={[styles.patientName, { color: theme.colors.text }]}
              onPress={() => handleViewPatient(appointment.patient.id)}
            >
              {appointment.patient.firstName} {appointment.patient.lastName}
            </Text>
            <Text style={[styles.appointmentTime, { color: theme.colors.text + '80' }]}>
              {format(appointmentTime, 'hh:mm a')}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={[styles.reason, { color: theme.colors.text }]}>
          {appointment.reason}
        </Text>

        {!isPast && appointment.status === 'scheduled' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              onPress={() => handleUpdateStatus(appointment.id, 'completed')}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              onPress={() => handleUpdateStatus(appointment.id, 'cancelled')}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
              onPress={() => handleUpdateStatus(appointment.id, 'no-show')}
            >
              <Ionicons name="alert" size={20} color="white" />
              <Text style={styles.actionButtonText}>No Show</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.dateTitle, { color: theme.colors.text }]}>
          {format(selectedDate, 'MMMM dd, yyyy')}
        </Text>
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => setSelectedDate((prev) => addDays(prev, -1))}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={[styles.todayButton, { color: theme.colors.primary }]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => setSelectedDate((prev) => addDays(prev, 1))}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.text + '40'}
            />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
              No appointments scheduled for this day
            </Text>
          </View>
        ) : (
          appointments.map(renderAppointment)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    padding: 8,
  },
  todayButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reason: {
    fontSize: 14,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
}); 