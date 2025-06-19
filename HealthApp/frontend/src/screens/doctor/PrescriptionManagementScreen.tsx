import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Prescription, Patient, Medication } from '../../types';
import { getApi } from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

type PrescriptionManagementScreenNavigationProp = NativeStackNavigationProp<
  any,
  'PrescriptionManagement'
>;

type PrescriptionManagementScreenRouteProp = {
  params: {
    patientId: string;
  };
};

export default function PrescriptionManagementScreen() {
  const navigation = useNavigation<PrescriptionManagementScreenNavigationProp>();
  const route = useRoute<PrescriptionManagementScreenRouteProp>();
  const { patientId } = route.params;
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    medications: [] as Medication[],
    instructions: '',
  });
  const [currentMedication, setCurrentMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async () => {
    try {
      const client = await getApi();
      const [patientRes, prescriptionsRes] = await Promise.all([
        client.get(`/patients/${patientId}`),
        client.get(`/patients/${patientId}/prescriptions`),
      ]);
      setPatient(patientRes.data);
      setPrescriptions(prescriptionsRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleAddMedication = () => {
    if (
      currentMedication.name &&
      currentMedication.dosage &&
      currentMedication.frequency &&
      currentMedication.duration
    ) {
      setNewPrescription((prev) => ({
        ...prev,
        medications: [...prev.medications, currentMedication],
      }));
      setCurrentMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
      });
    } else {
      Alert.alert('Error', 'Please fill in all required medication fields');
    }
  };

  const handleRemoveMedication = (index: number) => {
    setNewPrescription((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleCreatePrescription = async () => {
    if (newPrescription.medications.length === 0) {
      Alert.alert('Error', 'Please add at least one medication');
      return;
    }
    try {
      const client = await getApi();
      const response = await client.post(`/patients/${patientId}/prescriptions`, {
        ...newPrescription,
        doctorId: user?.id,
      });
      setPrescriptions([response.data, ...prescriptions]);
      setIsModalVisible(false);
      setNewPrescription({ medications: [], instructions: '' });
      Alert.alert('Success', 'Prescription created successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create prescription');
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    navigation.navigate(ROUTES.DOCTOR.PRESCRIPTION_DETAILS, {
      prescriptionId: prescription.id,
      patientId,
    });
  };

  const renderPrescription = (prescription: Prescription) => {
    const createdAt = parseISO(prescription.createdAt);
    return (
      <TouchableOpacity
        key={prescription.id}
        style={[styles.prescriptionCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleViewPrescription(prescription)}
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      {patient && (
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}> 
          <Text style={[styles.patientName, { color: theme.colors.text }]}>
            {patient.firstName} {patient.lastName}
          </Text>
          <Text style={[styles.patientInfo, { color: theme.colors.text + '80' }]}>
            DOB: {format(parseISO(patient.dateOfBirth), 'MMM dd, yyyy')}
          </Text>
        </View>
      )}
      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Prescription</Text>
        </TouchableOpacity>
        {prescriptions.map(renderPrescription)}
      </ScrollView>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>New Prescription</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Medications *</Text>
              <View style={styles.medicationForm}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Name"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={currentMedication.name}
                  onChangeText={(text) => setCurrentMedication((prev) => ({ ...prev, name: text }))}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Dosage"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={currentMedication.dosage}
                  onChangeText={(text) => setCurrentMedication((prev) => ({ ...prev, dosage: text }))}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Frequency"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={currentMedication.frequency}
                  onChangeText={(text) => setCurrentMedication((prev) => ({ ...prev, frequency: text }))}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Duration"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={currentMedication.duration}
                  onChangeText={(text) => setCurrentMedication((prev) => ({ ...prev, duration: text }))}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Notes (optional)"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={currentMedication.notes}
                  onChangeText={(text) => setCurrentMedication((prev) => ({ ...prev, notes: text }))}
                />
                <TouchableOpacity style={styles.addMedicationButton} onPress={handleAddMedication}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.addMedicationText, { color: theme.colors.primary }]}>Add Medication</Text>
                </TouchableOpacity>
              </View>
              {newPrescription.medications.length > 0 && (
                <View style={styles.medicationList}>
                  {newPrescription.medications.map((med, idx) => (
                    <View key={idx} style={styles.medicationItem}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMedication(idx)}>
                        <Ionicons name="remove-circle" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Instructions</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
                multiline
                numberOfLines={3}
                placeholder="Enter instructions"
                placeholderTextColor={theme.colors.text + '80'}
                value={newPrescription.instructions}
                onChangeText={(text) => setNewPrescription((prev) => ({ ...prev, instructions: text }))}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.colors.border }]} onPress={() => setIsModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.primary }]} onPress={handleCreatePrescription}>
                <Text style={styles.submitButtonText}>Create Prescription</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  patientName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  patientInfo: { fontSize: 14 },
  content: { flex: 1, padding: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginBottom: 16 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '500', marginLeft: 8 },
  prescriptionCard: { borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  prescriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  prescriptionDate: { fontSize: 14 },
  prescriptionStatus: { fontSize: 14, fontWeight: '500' },
  medicationCount: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  instructions: { fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  modalBody: { maxHeight: '70%' },
  inputLabel: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, textAlignVertical: 'top' },
  medicationForm: { marginBottom: 12 },
  addMedicationButton: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addMedicationText: { marginLeft: 4, fontSize: 14, fontWeight: '500' },
  medicationList: { marginBottom: 12 },
  medicationItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  medicationName: { fontSize: 15, color: '#333' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelButton: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, marginRight: 8, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '500' },
  submitButton: { flex: 1, borderRadius: 8, padding: 12, marginLeft: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
}); 