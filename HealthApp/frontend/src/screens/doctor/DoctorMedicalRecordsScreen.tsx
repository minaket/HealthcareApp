import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoctorStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeProvider';
import { ROUTES } from '../../config/constants';
import initializeApi from '../../api/axios.config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type DoctorMedicalRecordsScreenNavigationProp = NativeStackNavigationProp<
  DoctorStackParamList,
  typeof ROUTES.DOCTOR.MEDICAL_RECORDS
>;

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  attachments: string[];
}

export const DoctorMedicalRecordsScreen: React.FC = () => {
  const navigation = useNavigation<DoctorMedicalRecordsScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = await initializeApi();
      const response = await client.get('/api/doctor/medical-records');
      setRecords(response.data);
      setError(null);
    } catch (err: any) {
      console.log('Fetch medical records error:', err);
      setError('Failed to load medical records');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const renderRecordItem = ({ item }: { item: MedicalRecord }) => (
    <TouchableOpacity
      style={[styles.recordCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}
      onPress={() => {
        // TODO: Navigate to record details
        console.log('Navigate to record:', item.id);
      }}
    >
      <View style={styles.recordHeader}>
        <Icon name="file-document" size={24} color={theme.colors.primary} style={styles.recordIcon} />
        <View style={styles.recordInfo}>
          <Text style={[styles.patientName, { color: theme.colors.text.default }]}>
            {item.patientName}
          </Text>
          <Text style={[styles.date, { color: theme.colors.text.secondary }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
      </View>
      
      <View style={styles.recordContent}>
        <View style={styles.diagnosisContainer}>
          <Icon name="stethoscope" size={16} color={theme.colors.warning} />
          <Text style={[styles.diagnosis, { color: theme.colors.text.default }]}>
            {item.diagnosis}
          </Text>
        </View>
        
        <View style={styles.treatmentContainer}>
          <Icon name="pill" size={16} color={theme.colors.success} />
          <Text 
            style={[styles.treatment, { color: theme.colors.text.secondary }]}
            numberOfLines={2}
          >
            {item.treatment}
          </Text>
        </View>
        
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Icon name="paperclip" size={16} color={theme.colors.info} />
            <Text style={[styles.attachmentsText, { color: theme.colors.text.secondary }]}>
              {item.attachments.length} attachment{item.attachments.length !== 1 ? 's' : ''}
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
        data={records}
        renderItem={renderRecordItem}
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
          <View style={styles.emptyState}>
            <Icon name="file-document-outline" size={64} color={theme.colors.text.secondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {error || 'No medical records found'}
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
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
  },
  recordContent: {
    gap: 8,
  },
  diagnosisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagnosis: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  treatmentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  treatment: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentsText: {
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