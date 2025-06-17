import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../hooks/useAppointments';
import { format } from 'date-fns';
import { ROUTES } from '../../config/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PatientStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<PatientStackParamList, typeof ROUTES.PATIENT.APPOINTMENTS>;

const AppointmentsScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAuth();
  const { appointments, loading, error, refetch } = useAppointments();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderAppointmentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.appointmentCard, { backgroundColor: theme.colors.card }]}
      onPress={() => navigation.navigate(ROUTES.PATIENT.APPOINTMENT_DETAILS, { appointmentId: item.id })}
    >
      <View style={styles.appointmentHeader}>
        <Text style={[styles.doctorName, { color: theme.colors.text }]}>
          Dr. {item.doctor.firstName} {item.doctor.lastName}
        </Text>
        <Text style={[styles.status, { color: getStatusColor(item.status, theme) }]}>
          {item.status}
        </Text>
      </View>
      
      <View style={styles.appointmentDetails}>
        <Text style={[styles.date, { color: theme.colors.text }]}>
          {format(new Date(item.scheduledAt), 'MMM dd, yyyy')}
        </Text>
        <Text style={[styles.time, { color: theme.colors.text }]}>
          {format(new Date(item.scheduledAt), 'hh:mm a')}
        </Text>
        <Text style={[styles.type, { color: theme.colors.text }]}>
          {item.consultationType}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error loading appointments. Please try again.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={refetch}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No appointments scheduled
            </Text>
            <TouchableOpacity
              style={[styles.newAppointmentButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate(ROUTES.PATIENT.NEW_APPOINTMENT)}
            >
              <Text style={styles.newAppointmentButtonText}>Schedule Appointment</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const getStatusColor = (status: string, theme: any) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return theme.colors.info;
    case 'completed':
      return theme.colors.success;
    case 'cancelled':
      return theme.colors.error;
    case 'in_progress':
      return theme.colors.warning;
    default:
      return theme.colors.text;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  appointmentCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  appointmentDetails: {
    gap: 4,
  },
  date: {
    fontSize: 14,
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
  },
  type: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  newAppointmentButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newAppointmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentsScreen; 