import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../../hooks';
import { AdminStackParamList } from '../../types/navigation';
import { ROUTES } from '../../config/constants';
import { useTheme } from '../../theme/ThemeProvider';
import { RootState } from '../../store';
import api from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  'AdminDashboard'
>;

interface SystemStats {
  totalUsers: number;
  activeDoctors: number;
  activePatients: number;
  totalAppointments: number;
  pendingApprovals: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'appointment_created' | 'system_update';
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0, totalPrescriptions: 0 });

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/system-stats'),
        api.get('/admin/recent-activity'),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchSummary = async () => {
    try {
       const res = await api.get('/admin/summary');
       setSummary(res.data);
       setError(null);
    } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to load summary');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchSummary();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
    fetchSummary();
  };

  const getSystemHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'critical':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const handleManageUsers = () => { navigation.navigate(ROUTES.ADMIN.USER_MANAGEMENT); };
  const handleManageDoctors = () => { navigation.navigate(ROUTES.ADMIN.DOCTOR_MANAGEMENT); };
  const handleManagePatients = () => { navigation.navigate(ROUTES.ADMIN.PATIENT_MANAGEMENT); };
  const handleSystemSettings = () => { navigation.navigate(ROUTES.ADMIN.SYSTEM_SETTINGS); };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text + 'CC',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      margin: theme.spacing.xs,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.text + 'CC',
      textAlign: 'center',
    },
    systemHealth: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    healthStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    healthDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.sm,
    },
    healthText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    healthMessage: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    activityCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    activityItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    activityInfo: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    activityDescription: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    activityMeta: {
      fontSize: 12,
      color: theme.colors.text + '99',
    },
    activityTimestamp: {
      fontSize: 12,
      color: theme.colors.text + '99',
    },
    summaryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    summaryItem: { width: '48%', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    summaryValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 4 },
    summaryLabel: { fontSize: 14 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
    subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    actionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
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
        <Text style={styles.welcomeText}>
          Welcome, {user?.firstName}!
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

      {error && <Text style={styles.errorText}>{error}</Text>}

      {stats && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.activeDoctors}</Text>
                <Text style={styles.statLabel}>Active Doctors</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.activePatients}</Text>
                <Text style={styles.statLabel}>Active Patients</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalAppointments}</Text>
                <Text style={styles.statLabel}>Total Appointments</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.systemHealth}>
              <View style={styles.healthStatus}>
                <View
                  style={[
                    styles.healthDot,
                    { backgroundColor: getSystemHealthColor(stats.systemHealth.status) },
                  ]}
                />
                <Text style={styles.healthText}>
                  {stats.systemHealth.status.charAt(0).toUpperCase() +
                    stats.systemHealth.status.slice(1)}
                </Text>
              </View>
              <Text style={styles.healthMessage}>{stats.systemHealth.message}</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityInfo}>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                {activity.user && (
                  <Text style={styles.activityMeta}>By: {activity.user}</Text>
                )}
              </View>
              <Text style={styles.activityTimestamp}>
                {new Date(activity.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleManageUsers}
          >
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleManageDoctors}
          >
            <Ionicons name="medkit" size={24} color="white" />
            <Text style={styles.actionText}>Manage Doctors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleManagePatients}
          >
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.actionText}>Manage Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSystemSettings}
          >
            <Ionicons name="settings" size={24} color="white" />
            <Text style={styles.actionText}>System Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{summary.totalPatients}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>Patients</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{summary.totalDoctors}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>Doctors</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{summary.totalAppointments}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>Appointments</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{summary.totalPrescriptions}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>Prescriptions</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleManageUsers}
        >
          <Ionicons name="people" size={24} color="white" />
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleManageDoctors}
        >
          <Ionicons name="medkit" size={24} color="white" />
          <Text style={styles.actionText}>Manage Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleManagePatients}
        >
          <Ionicons name="people" size={24} color="white" />
          <Text style={styles.actionText}>Manage Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSystemSettings}
        >
          <Ionicons name="settings" size={24} color="white" />
          <Text style={styles.actionText}>System Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 