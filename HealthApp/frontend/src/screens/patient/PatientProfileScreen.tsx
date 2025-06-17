import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PatientStackScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks';
import { useTheme } from '../../theme/ThemeProvider';
import { RootState } from '../../store';
import { Patient, MedicalRecord, EmergencyContact } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';

type PatientProfileScreenProps = PatientStackScreenProps<'PatientProfile'>;

export default function PatientProfileScreen() {
  const navigation = useNavigation<PatientProfileScreenProps['navigation']>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async () => {
    try {
      const [patientRes, recordsRes] = await Promise.all([
        api.get(`/patients/${user?.id}`),
        api.get(`/patients/${user?.id}/medical-records`),
      ]);

      setPatient(patientRes.data);
      setMedicalRecords(recordsRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate(ROUTES.PATIENT.EDIT_PROFILE);
  };

  const handleViewMedicalRecord = (recordId: string) => {
    navigation.navigate(ROUTES.PATIENT.MEDICAL_RECORD_DETAILS, { recordId });
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
    editButton: {
      padding: theme.spacing.sm,
    },
    editButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.md,
    },
    medicalRecordCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    recordDate: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
    },
    recordDoctor: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    recordDiagnosis: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    recordNotes: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
    },
    emergencyContact: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
    },
    contactName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    contactRelationship: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
      marginBottom: theme.spacing.sm,
    },
    contactInfo: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {patient && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>
                  {patient.firstName} {patient.lastName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{patient.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{patient.phoneNumber || 'Not provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Date of Birth</Text>
                <Text style={styles.value}>
                  {patient.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString()
                    : 'Not provided'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Gender</Text>
                <Text style={styles.value}>
                  {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not provided'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{patient.address || 'Not provided'}</Text>
              </View>
            </View>
          </View>

          {patient.emergencyContact && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              <View style={styles.emergencyContact}>
                <Text style={styles.contactName}>{patient.emergencyContact.name}</Text>
                <Text style={styles.contactRelationship}>
                  {patient.emergencyContact.relationship}
                </Text>
                <Text style={styles.contactInfo}>
                  Phone: {patient.emergencyContact.phoneNumber}
                </Text>
                {patient.emergencyContact.email && (
                  <Text style={styles.contactInfo}>
                    Email: {patient.emergencyContact.email}
                  </Text>
                )}
                {patient.emergencyContact.address && (
                  <Text style={styles.contactInfo}>
                    Address: {patient.emergencyContact.address}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            {medicalRecords.length > 0 ? (
              medicalRecords.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={styles.medicalRecordCard}
                  onPress={() => handleViewMedicalRecord(record.id)}
                >
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>
                      {new Date(record.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.recordDoctor}>Dr. {record.doctorId}</Text>
                  </View>
                  <Text style={styles.recordDiagnosis}>{record.diagnosis}</Text>
                  {record.notes && (
                    <Text style={styles.recordNotes}>{record.notes}</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.label, { textAlign: 'center' }]}>
                No medical records found
              </Text>
            )}
          </View>

          {patient.allergies && patient.allergies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergies</Text>
              <View style={styles.card}>
                {patient.allergies.map((allergy, index) => (
                  <Text key={index} style={styles.value}>
                    • {allergy}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
} 