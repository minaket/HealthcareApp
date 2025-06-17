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
import api from '../../api/axios.config';

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
  const { theme } = useTheme();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/doctor/medical-records');
      setRecords(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medical records');
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
      style={[styles.recordCard, { backgroundColor: theme.colors.background.secondary }]}
      onPress={() => {
        // TODO: Navigate to record details
        console.log('Navigate to record:', item.id);
      }}
    >
      <Text style={[styles.patientName, { color: theme.colors.text.primary }]}>
        {item.patientName}
      </Text>
      <Text style={[styles.date, { color: theme.colors.text.secondary }]}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text style={[styles.diagnosis, { color: theme.colors.text.primary }]}>
        {item.diagnosis}
      </Text>
      <Text 
        style={[styles.treatment, { color: theme.colors.text.secondary }]}
        numberOfLines={2}
      >
        {item.treatment}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
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
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {error || 'No medical records found'}
          </Text>
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
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    marginBottom: 8,
  },
  diagnosis: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  treatment: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
}); 