import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Prescription, Medication, Doctor } from '../../types';
import api from '../../api/axios.config';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function PrescriptionDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { prescriptionId } = route.params as { prescriptionId: string };
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescription = async () => {
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
      if (response.data.doctorId) {
        const doctorRes = await api.get(`/doctors/${response.data.doctorId}`);
        setDoctor(doctorRes.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load prescription details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Prescription not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Prescription Details</Text>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text + '80' }]}>Date</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {format(parseISO(prescription.createdAt), 'MMM dd, yyyy')}
        </Text>
      </View>
      {doctor && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text + '80' }]}>Prescribed By</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialty})
          </Text>
        </View>
      )}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text + '80' }]}>Status</Text>
        <Text style={[styles.value, { color: theme.colors.primary }]}> 
          {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text + '80' }]}>Medications</Text>
        {prescription.medications.map((med: Medication, idx: number) => (
          <View key={idx} style={styles.medicationItem}>
            <Ionicons name="medkit" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.medicationName, { color: theme.colors.text }]}>{med.name}</Text>
              <Text style={[styles.medicationDetails, { color: theme.colors.text + '80' }]}>Dosage: {med.dosage}</Text>
              <Text style={[styles.medicationDetails, { color: theme.colors.text + '80' }]}>Frequency: {med.frequency}</Text>
              <Text style={[styles.medicationDetails, { color: theme.colors.text + '80' }]}>Duration: {med.duration}</Text>
              {med.notes ? (
                <Text style={[styles.medicationNotes, { color: theme.colors.text + '99' }]}>{med.notes}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text + '80' }]}>Instructions</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{prescription.instructions}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  section: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  value: { fontSize: 16, marginBottom: 2 },
  medicationItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  medicationName: { fontSize: 16, fontWeight: 'bold' },
  medicationDetails: { fontSize: 14 },
  medicationNotes: { fontSize: 13, fontStyle: 'italic' },
  errorText: { color: 'red', fontSize: 16 },
}); 