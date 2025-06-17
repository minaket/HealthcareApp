import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../../hooks';
import { PatientStackParamList } from '../../types/navigation';
import { ROUTES } from '../../config/constants';
import { useTheme } from '../../theme/ThemeProvider';
import { RootState } from '../../store';
import { getApi } from '../../api/axios.config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type PatientDashboardScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList,
  'PatientDashboard'
>;

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  specialty: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface HealthSummary {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    bloodType: string | null;
    allergies: string[];
    chronicConditions: string[];
    needsProfileUpdate: boolean;
  };
  recentRecords: Array<{
    id: string;
    recordType: string;
    recordData: string;
    recordDate: string;
    doctor: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  nextAppointment: {
    id: string;
    date: string;
    type: string;
    status: string;
    doctor: {
      id: string;
      firstName: string;
      lastName: string;
      specialization: string;
    } | null;
  } | null;
}

const COLORS = {
  bloodType: '#FF6B6B',
  allergies: '#4ECDC4',
  lastCheckup: '#96CEB4',
  nextAppointment: '#FFD93D',
  bookAppointment: '#6C5CE7',
  viewRecords: '#00B894',
  prescriptions: '#FF7675',
  messages: '#FDCB6E',
};

export default function PatientDashboardScreen() {
  const navigation = useNavigation<PatientDashboardScreenNavigationProp>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const apiInstance = await getApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }

      const [appointmentsRes, summaryRes] = await Promise.all([
        apiInstance.get('/api/patient/appointments/upcoming'),
        apiInstance.get('/api/patient/health-summary'),
      ]);

      setAppointments(appointmentsRes.data);
      setHealthSummary(summaryRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Failed to load dashboard data');
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getLastCheckup = (records: HealthSummary['recentRecords']) => {
    if (!records || records.length === 0) return 'No checkups yet';
    const checkups = records.filter(record => 
      record.recordType === 'consultation' || 
      record.recordType === 'diagnosis'
    );
    if (checkups.length === 0) return 'No checkups yet';
    return formatDate(checkups[0].recordDate);
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
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text.default,
      opacity: 0.6,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    card: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    summaryItem: {
      flex: 1,
      minWidth: '45%',
      margin: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.large,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    summaryItemContent: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    summaryIcon: {
      marginBottom: theme.spacing.sm,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.text.default,
      opacity: 0.6,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.colors.text.default,
      opacity: 0.5,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    profileUpdateCard: {
      backgroundColor: theme.colors.primary + '15',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      borderRadius: theme.layout.borderRadius.large,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileUpdateIcon: {
      marginRight: theme.spacing.md,
    },
    profileUpdateText: {
      flex: 1,
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      minWidth: '45%',
      margin: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.large,
      overflow: 'hidden',
    },
    actionButtonContent: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    actionIcon: {
      marginBottom: theme.spacing.sm,
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
    },
    bloodTypeCard: {
      backgroundColor: '#FF6B6B',
    },
    allergiesCard: {
      backgroundColor: '#4ECDC4',
    },
    lastCheckupCard: {
      backgroundColor: '#96CEB4',
    },
    nextAppointmentCard: {
      backgroundColor: '#FFD93D',
    },
    bookAppointmentButton: {
      backgroundColor: '#6C5CE7',
    },
    viewRecordsButton: {
      backgroundColor: '#00B894',
    },
    prescriptionsButton: {
      backgroundColor: '#FF7675',
    },
    messagesButton: {
      backgroundColor: '#FDCB6E',
    },
  });

  const getSummaryIcon = (type: string) => {
    const icons = {
      bloodType: 'blood-bag',
      allergies: 'allergy',
      lastCheckup: 'stethoscope',
      nextAppointment: 'calendar-clock',
    };
    return icons[type as keyof typeof icons] || 'information';
  };

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
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            Welcome, {healthSummary?.patient.firstName || 'Patient'}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate(ROUTES.PATIENT.PROFILE)}
        >
          <Icon name="account-circle" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.card, { backgroundColor: theme.colors.error + '15' }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: theme.spacing.md }]}
            onPress={fetchDashboardData}
          >
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {healthSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="heart-pulse" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
            Health Summary
          </Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, { backgroundColor: COLORS.bloodType }]}>
              <View style={styles.summaryItemContent}>
                <Icon 
                  name={getSummaryIcon('bloodType')} 
                  size={32} 
                  color="#FFF" 
                  style={styles.summaryIcon}
                />
                <Text style={[styles.summaryValue, { color: '#FFF' }]}>
                  {healthSummary.patient.bloodType || 'Not set'}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#FFF' }]}>Blood Type</Text>
              </View>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: COLORS.allergies }]}>
              <View style={styles.summaryItemContent}>
                <Icon 
                  name={getSummaryIcon('allergies')} 
                  size={32} 
                  color="#FFF" 
                  style={styles.summaryIcon}
                />
                <Text style={[styles.summaryValue, { color: '#FFF' }]}>
                  {healthSummary.patient.allergies.length || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#FFF' }]}>Allergies</Text>
              </View>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: COLORS.lastCheckup }]}>
              <View style={styles.summaryItemContent}>
                <Icon 
                  name={getSummaryIcon('lastCheckup')} 
                  size={32} 
                  color="#FFF" 
                  style={styles.summaryIcon}
                />
                <Text style={[styles.summaryValue, { color: '#FFF' }]}>
                  {getLastCheckup(healthSummary.recentRecords)}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#FFF' }]}>Last Checkup</Text>
              </View>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: COLORS.nextAppointment }]}>
              <View style={styles.summaryItemContent}>
                <Icon 
                  name={getSummaryIcon('nextAppointment')} 
                  size={32} 
                  color="#FFF" 
                  style={styles.summaryIcon}
                />
                <Text style={[styles.summaryValue, { color: '#FFF' }]}>
                  {healthSummary.nextAppointment 
                    ? formatDate(healthSummary.nextAppointment.date)
                    : 'No upcoming'}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#FFF' }]}>Next Appointment</Text>
              </View>
            </View>
          </View>

          {healthSummary.patient.needsProfileUpdate && (
            <TouchableOpacity
              style={styles.profileUpdateCard}
              onPress={() => navigation.navigate(ROUTES.PATIENT.PROFILE)}
            >
              <Icon 
                name="account-alert" 
                size={24} 
                color={theme.colors.primary} 
                style={styles.profileUpdateIcon}
              />
              <Text style={styles.profileUpdateText}>
                Complete your profile to get better health insights
              </Text>
              <Icon 
                name="chevron-right" 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="rocket-launch" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: COLORS.bookAppointment }]}
            onPress={() => navigation.navigate(ROUTES.PATIENT.BOOK_APPOINTMENT)}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="calendar-plus" size={32} color="#FFF" style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: '#FFF' }]}>Book Appointment</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: COLORS.viewRecords }]}
            onPress={() => navigation.navigate(ROUTES.PATIENT.MEDICAL_RECORDS)}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="file-document" size={32} color="#FFF" style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: '#FFF' }]}>View Records</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: COLORS.prescriptions }]}
            onPress={() => navigation.navigate(ROUTES.PATIENT.PRESCRIPTIONS)}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="pill" size={32} color="#FFF" style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: '#FFF' }]}>Prescriptions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: COLORS.messages }]}
            onPress={() => navigation.navigate(ROUTES.PATIENT.MESSAGES)}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="message-text" size={32} color="#FFF" style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: '#FFF' }]}>Messages</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 