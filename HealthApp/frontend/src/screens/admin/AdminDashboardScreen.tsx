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
import { getApi } from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  'AdminDashboard'
>;

interface SystemStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
  };
}

interface Activity {
  id: string;
  description: string;
  user?: string;
  timestamp: string;
}

interface Summary {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalPrescriptions: number;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const { theme } = useTheme();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    systemHealth: { status: 'healthy', message: 'System is running normally' },
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const api = await getApi();
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/system-stats'),
        api.get('/admin/recent-activity'),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load dashboard data');
    }
  };

  const fetchSummary = async () => {
    try {
      const api = await getApi();
       const res = await api.get('/admin/summary');
       setSummary(res.data);
       setError(null);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError('Failed to load summary data');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchSummary()]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchSummary()]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManageUsers = () => {
    navigation.navigate('UserManagement');
  };

  const handleManageDoctors = () => {
    navigation.navigate('DoctorManagement');
  };

  const handleManagePatients = () => {
    navigation.navigate('PatientManagement');
  };

  const handleSystemSettings = () => {
    navigation.navigate('SystemSettings');
  };

  const getSystemHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Admin Dashboard</Text>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </Card>
      )}

      <View style={styles.summaryContainer}>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {summary.totalPatients}
        </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>
            Patients
        </Text>
      </View>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {summary.totalDoctors}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>
            Doctors
          </Text>
              </View>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {summary.totalAppointments}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>
            Appointments
          </Text>
              </View>
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {summary.totalPrescriptions}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text + '80' }]}>
            Prescriptions
          </Text>
            </View>
          </View>

      {stats.systemHealth && (
          <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            System Health
          </Text>
            <View style={styles.systemHealth}>
              <View style={styles.healthStatus}>
                <View
                  style={[
                    styles.healthDot,
                    { backgroundColor: getSystemHealthColor(stats.systemHealth.status) },
                  ]}
                />
              <Text style={[styles.healthText, { color: theme.colors.text }]}>
                  {stats.systemHealth.status.charAt(0).toUpperCase() +
                    stats.systemHealth.status.slice(1)}
                </Text>
            </View>
            <Text style={[styles.healthMessage, { color: theme.colors.text + '80' }]}>
              {stats.systemHealth.message}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Activity
        </Text>
        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityDescription, { color: theme.colors.text }]}>
                  {activity.description}
                </Text>
                {activity.user && (
                  <Text style={[styles.activityMeta, { color: theme.colors.text + '80' }]}>
                    By: {activity.user}
                  </Text>
                )}
              </View>
              <Text style={[styles.activityTimestamp, { color: theme.colors.text + '60' }]}>
                {new Date(activity.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>
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
    </ScrollView>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  errorCard: {
    marginBottom: 16,
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  systemHealth: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  healthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  healthMessage: {
    fontSize: 14,
  },
  activityCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 12,
  },
  activityTimestamp: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 