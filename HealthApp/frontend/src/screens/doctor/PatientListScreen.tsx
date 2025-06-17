import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoctorStackParamList } from '../../types/navigation';
import { ROUTES } from '../../config/constants';
import { getApi } from '../../api/axios.config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type PatientListScreenNavigationProp = NativeStackNavigationProp<DoctorStackParamList>;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
  lastVisit?: string;
  email?: string;
}

export const PatientListScreen: React.FC = () => {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const navigation = useNavigation<PatientListScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiInstance = await getApi();
      const response = await apiInstance.get('/api/doctor/patients');
      setPatients(response.data);
      setError(null);
    } catch (err: any) {
      console.log('Fetch patients error:', err);
      setError('Failed to fetch patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={[styles.patientCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}
      onPress={() => {
        // TODO: Navigate to patient details
        console.log('Navigate to patient:', item.id);
      }}
    >
      <View style={styles.patientHeader}>
        <Icon name="account" size={24} color={theme.colors.primary} style={styles.patientIcon} />
        <View style={styles.patientNameContainer}>
          <Text style={[styles.patientName, { color: theme.colors.text.default }]}>
            {item.firstName} {item.lastName}
          </Text>
          {item.email && (
            <Text style={[styles.patientEmail, { color: theme.colors.text.secondary }]}>
              {item.email}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
      </View>
      
      <View style={styles.patientInfo}>
        {item.age && (
          <View style={styles.infoItem}>
            <Icon name="calendar" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.patientDetail, { color: theme.colors.text.secondary }]}>
              Age: {item.age}
            </Text>
          </View>
        )}
        {item.gender && (
          <View style={styles.infoItem}>
            <Icon name="gender-male-female" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.patientDetail, { color: theme.colors.text.secondary }]}>
              Gender: {item.gender}
            </Text>
          </View>
        )}
        {item.lastVisit && (
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.patientDetail, { color: theme.colors.text.secondary }]}>
              Last Visit: {item.lastVisit}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="account-group" size={64} color={theme.colors.text.secondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {error || 'No patients found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  patientCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientIcon: {
    marginRight: 12,
  },
  patientNameContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
  },
  patientInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientDetail: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
}); 