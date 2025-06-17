import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../../hooks';
import { DoctorStackParamList } from '../../types/navigation';
import { ROUTES } from '../../config/constants';
import { useTheme } from '../../theme/ThemeProvider';
import { RootState } from '../../store';
import { getApi } from '../../api/axios.config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type DoctorDashboardScreenNavigationProp = NativeStackNavigationProp<
  DoctorStackParamList,
  'DoctorDashboard'
>;

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingReports: number;
  unreadMessages: number;
}

export default function DoctorDashboardScreen() {
  const navigation = useNavigation<DoctorDashboardScreenNavigationProp>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const apiInstance = await getApi();
      const [appointmentsRes, statsRes] = await Promise.all([
        apiInstance.get('/api/doctor/appointments/today'),
        apiInstance.get('/api/doctor/dashboard-stats'),
      ]);

      setTodayAppointments(appointmentsRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err: any) {
      console.log('Dashboard fetch error:', err);
      // Set empty data instead of dummy data
      setStats({
        totalPatients: 0,
        appointmentsToday: 0,
        pendingReports: 0,
        unreadMessages: 0,
      });
      setTodayAppointments([]);
      setError(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'clock-outline';
      case 'completed':
        return 'check-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
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
    header: {
      marginBottom: theme.spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.medium,
      padding: theme.spacing.md,
      margin: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statIcon: {
      marginBottom: theme.spacing.sm,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    appointmentCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    appointmentInfo: {
      flex: 1,
    },
    appointmentTime: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    appointmentPatient: {
      fontSize: 14,
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    appointmentType: {
      fontSize: 12,
      color: theme.colors.text.secondary,
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
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    actionButton: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.medium,
      padding: theme.spacing.md,
      margin: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionIcon: {
      marginBottom: theme.spacing.sm,
    },
    actionText: {
      color: theme.colors.text.default,
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
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
      color: theme.colors.text.secondary,
      textAlign: 'center',
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
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>
            Welcome, Dr. {user?.lastName}!
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate(ROUTES.DOCTOR.PROFILE)}
        >
          <Icon name="account" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="chart-line" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
            Today's Overview
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="calendar-clock" size={32} color={theme.colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.appointmentsToday}</Text>
              <Text style={styles.statLabel}>Today's Appointments</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="account-group" size={32} color={theme.colors.success} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.totalPatients}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="file-document" size={32} color={theme.colors.warning} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.pendingReports}</Text>
              <Text style={styles.statLabel}>Pending Reports</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="message-text" size={32} color={theme.colors.info} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.unreadMessages}</Text>
              <Text style={styles.statLabel}>Unread Messages</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="calendar-today" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
          Today's Appointments
        </Text>
        {todayAppointments.length > 0 ? (
          todayAppointments.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              style={[styles.card, styles.appointmentCard]}
              onPress={() => navigation.navigate(ROUTES.DOCTOR.APPOINTMENTS)}
            >
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentTime}>{appointment.time}</Text>
                <Text style={styles.appointmentPatient}>
                  {appointment.patientName}
                </Text>
                <Text style={styles.appointmentType}>
                  {appointment.type}
                </Text>
              </View>
              <View style={[
                styles.appointmentStatus,
                { backgroundColor: getStatusColor(appointment.status) + '20' }
              ]}>
                <Icon 
                  name={getStatusIcon(appointment.status)} 
                  size={16} 
                  color={getStatusColor(appointment.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={64} color={theme.colors.text.secondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No appointments scheduled for today</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="lightning-bolt" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.PATIENTS)}
          >
            <Icon name="account-group" size={32} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>View Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.APPOINTMENTS)}
          >
            <Icon name="calendar-plus" size={32} color={theme.colors.success} style={styles.actionIcon} />
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.MEDICAL_RECORDS)}
          >
            <Icon name="file-document" size={32} color={theme.colors.warning} style={styles.actionIcon} />
            <Text style={styles.actionText}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.PROFILE)}
          >
            <Icon name="account-cog" size={32} color={theme.colors.info} style={styles.actionIcon} />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 