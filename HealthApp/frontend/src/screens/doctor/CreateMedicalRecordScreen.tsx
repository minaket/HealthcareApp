import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoctorStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { User, Medication } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type CreateMedicalRecordScreenProps = {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'CreateMedicalRecord'>;
};

interface FormData {
  patientId: string;
  date: Date;
  diagnosis: string;
  notes: string;
  prescription: {
    medications: Medication[];
    instructions: string;
  } | null;
}

export default function CreateMedicalRecordScreen() {
  const navigation = useNavigation<CreateMedicalRecordScreenProps['navigation']>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    date: new Date(),
    diagnosis: '',
    notes: '',
    prescription: null,
  });

  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentMedication, setCurrentMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await api().get('/api/doctor/patients');
      setPatients(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handlePatientSelect = (patient: User) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patientId: patient.id });
    setShowPatientPicker(false);
  };

  const handleAddMedication = () => {
    if (
      currentMedication.name &&
      currentMedication.dosage &&
      currentMedication.frequency &&
      currentMedication.duration
    ) {
      setMedications([...medications, currentMedication]);
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
    const updatedMedications = medications.filter((_, i) => i !== index);
    setMedications(updatedMedications);
  };

  const handleSubmit = async () => {
    if (!formData.patientId) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }

    if (!formData.diagnosis) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return;
    }

    try {
      setIsSubmitting(true);

      const recordData = {
        ...formData,
        prescription: medications.length > 0
          ? {
              medications,
              instructions: prescriptionInstructions,
              status: 'active',
            }
          : null,
      };

      await api().post('/api/doctor/medical-records', recordData);
      Alert.alert(
        'Success',
        'Medical record created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create medical record');
      Alert.alert('Error', 'Failed to create medical record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    formGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontSize: 16,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    patientSelector: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    patientSelectorText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    patientPicker: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      zIndex: 1000,
    },
    patientList: {
      padding: theme.spacing.lg,
    },
    patientItem: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    patientItemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    medicationSection: {
      marginTop: theme.spacing.xl,
    },
    medicationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    medicationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    medicationForm: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    medicationInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontSize: 16,
      marginBottom: theme.spacing.md,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    addButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    medicationList: {
      marginTop: theme.spacing.lg,
    },
    medicationItem: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    medicationItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    medicationName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    removeButton: {
      padding: theme.spacing.sm,
    },
    removeButtonText: {
      color: theme.colors.error,
      fontSize: 14,
    },
    medicationDetails: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
      marginBottom: theme.spacing.xs,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    submitButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Medical Record</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Patient</Text>
          <TouchableOpacity
            style={styles.patientSelector}
            onPress={() => setShowPatientPicker(true)}
          >
            <Text style={styles.patientSelectorText}>
              {selectedPatient
                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                : 'Select a patient'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.colors.text }}>
              {format(formData.date, 'MMMM dd, yyyy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Diagnosis</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter diagnosis"
            placeholderTextColor={theme.colors.text + '80'}
            value={formData.diagnosis}
            onChangeText={(text) => setFormData({ ...formData, diagnosis: text })}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter additional notes"
            placeholderTextColor={theme.colors.text + '80'}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
          />
        </View>

        <View style={styles.medicationSection}>
          <View style={styles.medicationHeader}>
            <Text style={styles.medicationTitle}>Prescription</Text>
          </View>

          <View style={styles.medicationForm}>
            <TextInput
              style={styles.medicationInput}
              placeholder="Medication name"
              placeholderTextColor={theme.colors.text + '80'}
              value={currentMedication.name}
              onChangeText={(text) =>
                setCurrentMedication({ ...currentMedication, name: text })
              }
            />
            <TextInput
              style={styles.medicationInput}
              placeholder="Dosage"
              placeholderTextColor={theme.colors.text + '80'}
              value={currentMedication.dosage}
              onChangeText={(text) =>
                setCurrentMedication({ ...currentMedication, dosage: text })
              }
            />
            <TextInput
              style={styles.medicationInput}
              placeholder="Frequency"
              placeholderTextColor={theme.colors.text + '80'}
              value={currentMedication.frequency}
              onChangeText={(text) =>
                setCurrentMedication({ ...currentMedication, frequency: text })
              }
            />
            <TextInput
              style={styles.medicationInput}
              placeholder="Duration"
              placeholderTextColor={theme.colors.text + '80'}
              value={currentMedication.duration}
              onChangeText={(text) =>
                setCurrentMedication({ ...currentMedication, duration: text })
              }
            />
            <TextInput
              style={styles.medicationInput}
              placeholder="Additional notes (optional)"
              placeholderTextColor={theme.colors.text + '80'}
              value={currentMedication.notes}
              onChangeText={(text) =>
                setCurrentMedication({ ...currentMedication, notes: text })
              }
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddMedication}>
              <Text style={styles.addButtonText}>Add Medication</Text>
            </TouchableOpacity>
          </View>

          {medications.length > 0 && (
            <>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Prescription instructions"
                placeholderTextColor={theme.colors.text + '80'}
                value={prescriptionInstructions}
                onChangeText={setPrescriptionInstructions}
                multiline
              />

              <View style={styles.medicationList}>
                {medications.map((medication, index) => (
                  <View key={index} style={styles.medicationItem}>
                    <View style={styles.medicationItemHeader}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveMedication(index)}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.medicationDetails}>
                      Dosage: {medication.dosage}
                    </Text>
                    <Text style={styles.medicationDetails}>
                      Frequency: {medication.frequency}
                    </Text>
                    <Text style={styles.medicationDetails}>
                      Duration: {medication.duration}
                    </Text>
                    {medication.notes && (
                      <Text style={styles.medicationDetails}>
                        Notes: {medication.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create Medical Record</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showPatientPicker && (
        <View style={styles.patientPicker}>
          <ScrollView style={styles.patientList}>
            {patients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientItem}
                onPress={() => handlePatientSelect(patient)}
              >
                <Text style={styles.patientItemText}>
                  {patient.firstName} {patient.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
} 