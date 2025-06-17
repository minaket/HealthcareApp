import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoctorStackParamList } from '../../types/navigation';
import { ROUTES } from '../../config/constants';
import api from '../../api/axios.config';

type PatientListScreenNavigationProp = NativeStackNavigationProp<DoctorStackParamList>;

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
}

export const PatientListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<PatientListScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/doctor/patients');
        setPatients(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={[styles.patientCard, { backgroundColor: theme.colors.background.secondary }]}
      onPress={() => {
        // TODO: Navigate to patient details
        console.log('Navigate to patient:', item.id);
      }}
    >
      <Text style={[styles.patientName, { color: theme.colors.text.primary }]}>
        {item.name}
      </Text>
      <View style={styles.patientInfo}>
        <Text style={[styles.patientDetail, { color: theme.colors.text.secondary }]}>
          Age: {item.age}
        </Text>
        <Text style={[styles.patientDetail, { color: theme.colors.text.secondary }]}>
          Gender: {item.gender}
        </Text>
        <Text style={[styles.patientDetail, { color: theme.colors.text.secondary }]}>
          Last Visit: {item.lastVisit}
        </Text>
      </View>
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
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {error || 'No patients found'}
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
  patientCard: {
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
    marginBottom: 8,
  },
  patientInfo: {
    gap: 4,
  },
  patientDetail: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
}); 