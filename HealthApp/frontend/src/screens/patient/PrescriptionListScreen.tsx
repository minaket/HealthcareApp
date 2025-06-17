import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Prescription } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function PrescriptionListScreen() {
  const navigation = useNavigation();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get(`/patients/${user?.id}/prescriptions`);
      setPrescriptions(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPrescriptions();
  };

  const handleViewPrescription = (prescriptionId: string) => {
    navigation.navigate(ROUTES.PATIENT.PRESCRIPTION_DETAILS, { prescriptionId });
  };

  const renderPrescription = (prescription: Prescription) => {
    const createdAt = parseISO(prescription.createdAt);
    return (
      <TouchableOpacity
        key={prescription.id}
        style={[styles.prescriptionCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleViewPrescription(prescription.id)}
      >
        <View style={styles.prescriptionHeader}>
          <Text style={[styles.prescriptionDate, { color: theme.colors.text + '80' }]}>
            {format(createdAt, 'MMM dd, yyyy')}
          </Text>
          <Text style={[styles.prescriptionStatus, { color: theme.colors.primary }]}>
            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
          </Text>
        </View>
        <Text style={[styles.medicationCount, { color: theme.colors.text }]}>
          {prescription.medications.length} medication{prescription.medications.length !== 1 ? 's' : ''}
        </Text>
        <Text style={[styles.instructions, { color: theme.colors.text + '80' }]} numberOfLines={2}>
          {prescription.instructions}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>My Prescriptions</Text>
      {prescriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="medkit-outline" size={48} color={theme.colors.text + '40'} />
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No prescriptions found</Text>
        </View>
      ) : (
        prescriptions.map(renderPrescription)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', margin: 16 },
  prescriptionCard: { borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  prescriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  prescriptionDate: { fontSize: 14 },
  prescriptionStatus: { fontSize: 14, fontWeight: '500' },
  medicationCount: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  instructions: { fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyStateText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
}); 