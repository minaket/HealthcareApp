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
import initializeApi from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';

type DoctorDashboardScreenNavigationProp = NativeStackNavigationProp<
  DoctorStackParamList,
  'DoctorDashboard'
>;

interface Message {
  id: string;
  patientName: string;
  content: string;
  time: string;
  isUnread: boolean;
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
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const client = await initializeApi();
      
      // Fetch data with better error handling
      const [messagesRes, statsRes] = await Promise.allSettled([
        client.get('/api/doctor/messages/recent'),
        client.get('/api/doctor/dashboard-stats'),
      ]);

      // Handle messages response
      if (messagesRes.status === 'fulfilled') {
        setRecentMessages(messagesRes.value.data);
      } else {
        console.log('Messages fetch failed:', messagesRes.reason);
        setRecentMessages([]); // Set empty array instead of showing error
      }

      // Handle stats response
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      } else {
        console.log('Stats fetch failed:', statsRes.reason);
        // Provide fallback stats
        setStats({
          totalPatients: 0,
          appointmentsToday: 0,
          pendingReports: 0,
          unreadMessages: 0,
        });
      }

      setError(null);
    } catch (err: any) {
      console.log('Dashboard fetch error:', err);
      // Set fallback data instead of showing error
      setStats({
        totalPatients: 0,
        appointmentsToday: 0,
        pendingReports: 0,
        unreadMessages: 0,
      });
      setRecentMessages([]);
      setError(null); // Don't show error to user
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

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageDate.toLocaleDateString();
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
      position: 'relative',
      overflow: 'hidden',
    },
    headerBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary + '08',
      borderRadius: theme.layout.borderRadius.large,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      position: 'relative',
      zIndex: 1,
    },
    headerLeft: {
      flex: 1,
    },
    welcomeText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    doctorName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    dateText: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    profileButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    profileIcon: {
      color: 'white',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      margin: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statIcon: {
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.layout.borderRadius.medium,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    card: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    messageCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    messageInfo: {
      flex: 1,
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    messagePatient: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    messageTime: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    messageContent: {
      fontSize: 14,
      lineHeight: 20,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginLeft: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.layout.borderRadius.medium,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      marginRight: theme.spacing.xs,
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
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      margin: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionIcon: {
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.medium,
    },
    actionText: {
      color: theme.colors.text.default,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.medium,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      marginTop: theme.spacing.md,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
      opacity: 0.6,
    },
    emptyText: {
      color: theme.colors.text.secondary,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '500',
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
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>
              Welcome back,
            </Text>
            <Text style={styles.doctorName}>
              Dr. {user?.lastName}
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
            <Ionicons name="person" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
            Today's Overview
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="calendar-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.appointmentsToday}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Today's Appointments</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="people-outline" size={32} color={theme.colors.success} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.totalPatients}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total Patients</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="file-tray-outline" size={32} color={theme.colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.pendingReports}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Pending Reports</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.info + '20' }]}>
                <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.info} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.info }]}>{stats.unreadMessages}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Unread Messages</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
            Recent Messages
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.DOCTOR.MESSAGES)}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        {recentMessages.length > 0 ? (
          recentMessages.slice(0, 3).map((message) => (
            <TouchableOpacity
              key={message.id}
              style={[styles.card, styles.messageCard]}
              onPress={() => navigation.navigate(ROUTES.DOCTOR.MESSAGES)}
            >
              <View style={styles.messageInfo}>
                <View style={styles.messageHeader}>
                  <Text style={[styles.messagePatient, { 
                    color: message.isUnread ? theme.colors.text.default : theme.colors.text.default,
                    fontWeight: message.isUnread ? '600' : '400'
                  }]}>
                    {message.patientName}
                  </Text>
                  <Text style={[styles.messageTime, { color: theme.colors.text.secondary }]}>
                    {formatMessageTime(message.time)}
                  </Text>
                </View>
                <Text 
                  style={[styles.messageContent, { 
                    color: message.isUnread ? theme.colors.text.default : theme.colors.text.secondary 
                  }]}
                  numberOfLines={2}
                >
                  {message.content}
                </Text>
                {message.isUnread && (
                  <View style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.secondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No recent messages</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="flash-outline" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.PATIENTS)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="people-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>View Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.MESSAGES)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.success} />
            </View>
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.MEDICAL_RECORDS)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="document-text-outline" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.actionText}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.DOCTOR.PROFILE)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '20' }]}>
              <Ionicons name="person-circle-outline" size={32} color={theme.colors.info} />
            </View>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 