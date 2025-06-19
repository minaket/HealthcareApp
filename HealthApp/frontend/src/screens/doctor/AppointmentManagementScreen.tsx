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
import { useTheme } from '../../theme/ThemeProvider';
import { Appointment, Patient } from '../../types';
import { getApi } from '../../api/axios.config';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../config/constants';

type AppointmentWithPatient = Appointment & {
  patient: Patient;
};

export default function AppointmentManagementScreen() {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const client = await getApi();
      const response = await client.get('/api/doctor/appointments', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      });
      setAppointments(response.data);
      setError(null);
    } catch (err: any) {
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

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const client = await getApi();
      await client.patch(`/api/appointments/${appointmentId}`, { status });
      fetchAppointments();
      Alert.alert('Success', 'Appointment status updated successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const handleViewPatient = (_patientId: string) => {
    // TODO: Implement navigation to patient details
    // For now, this is a placeholder for future implementation
  };

  const handleMessagePatient = async (patientId: string, patientName: string) => {
    try {
      const client = await getApi();
      
      // Get or create conversation with the patient
      const conversationResponse = await client.get(`/api/messages/patient/${patientId}`);
      
      if (conversationResponse.data?.id) {
        // Navigate to chat screen
        navigation.navigate(ROUTES.DOCTOR.CHAT, {
          chatId: conversationResponse.data.id,
          patientName: patientName
        });
      } else {
        Alert.alert('Error', 'Failed to start conversation with patient');
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation with patient');
    }
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
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'time-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'no-show':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
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
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    dateTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.default,
    },
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateNavButton: {
      padding: theme.spacing.sm,
      marginHorizontal: theme.spacing.xs,
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
    patientInfo: {
      flex: 1,
    },
    patientName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    appointmentTime: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    statusBadge: {
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
    reason: {
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
      color: 'white',
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
      <View style={[styles.container, styles.centered]}>
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
        <Text style={styles.dateTitle}>
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
            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
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

      {error && <Text style={styles.errorText}>{error}</Text>}

        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
          <Ionicons name="calendar" size={64} color={theme.colors.text.secondary} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No appointments scheduled for this date</Text>
        </View>
      ) : (
        appointments.map((appointment) => {
          const appointmentTime = parseISO(appointment.startTime);
          const isPast = isBefore(appointmentTime, new Date());
          const statusColor = getStatusColor(appointment.status);

          return (
            <View
              key={appointment.id}
              style={[
                styles.appointmentCard,
                {
                  opacity: isPast ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.appointmentHeader}>
                <View style={styles.patientInfo}>
                  <Text
                    style={styles.patientName}
                    onPress={() => handleViewPatient(appointment.patient.id)}
                  >
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </Text>
                  <Text style={styles.appointmentTime}>
                    {format(appointmentTime, 'hh:mm a')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor + '20' },
                  ]}
                >
                  <Ionicons 
                    name={getStatusIcon(appointment.status)} 
                    size={20} 
                    color={statusColor} 
                  />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Text>
          </View>
              </View>

              {appointment.reason && (
                <Text style={styles.reason}>
                  {appointment.reason}
                </Text>
              )}

              {!isPast && appointment.status === 'scheduled' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleMessagePatient(
                      appointment.patient.id, 
                      `${appointment.patient.firstName} ${appointment.patient.lastName}`
                    )}
                  >
                    <Ionicons name="chatbubble" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Message</Text>
                  </TouchableOpacity>
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
        })
      )}
    </ScrollView>
  );
}