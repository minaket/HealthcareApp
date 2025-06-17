import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList, DoctorStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { MedicalRecord, User } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO } from 'date-fns';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';

type MedicalRecordDetailsScreenProps = {
  navigation: NativeStackNavigationProp<
    PatientStackParamList | DoctorStackParamList,
    'MedicalRecordDetails'
  >;
  route: RouteProp<PatientStackParamList | DoctorStackParamList, 'MedicalRecordDetails'>;
};

interface MedicalRecordWithUsers extends MedicalRecord {
  patient: User;
  doctor: User;
}

export default function MedicalRecordDetailsScreen() {
  const navigation = useNavigation<MedicalRecordDetailsScreenProps['navigation']>();
  const route = useRoute<MedicalRecordDetailsScreenProps['route']>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [record, setRecord] = useState<MedicalRecordWithUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordDetails = async () => {
    try {
      const response = await api.get(`/medical-records/${route.params.recordId}`);
      setRecord(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medical record details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordDetails();
  }, [route.params.recordId]);

  const handleShare = async () => {
    if (!record) return;

    try {
      const message = `
Medical Record Details:
Date: ${format(parseISO(record.date), 'MMMM dd, yyyy')}
Doctor: Dr. ${record.doctor.firstName} ${record.doctor.lastName}
Patient: ${record.patient.firstName} ${record.patient.lastName}
Diagnosis: ${record.diagnosis}
${record.notes ? `Notes: ${record.notes}` : ''}
${record.prescription ? `Prescription: ${record.prescription.medications.map(med => 
  `${med.name} - ${med.dosage} (${med.frequency})`
).join('\n')}` : ''}
      `.trim();

      await Share.share({
        message,
        title: 'Medical Record Details',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share medical record details');
    }
  };

  const handleViewAttachment = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this attachment');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open attachment');
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
    shareButton: {
      padding: theme.spacing.sm,
    },
    shareButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
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
    diagnosis: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      lineHeight: 24,
    },
    notes: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
      lineHeight: 20,
    },
    prescriptionContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    prescriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    prescriptionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    prescriptionStatus: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    medicationItem: {
      marginBottom: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    medicationName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    medicationDetails: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
      marginBottom: theme.spacing.xs,
    },
    medicationNotes: {
      fontSize: 12,
      color: theme.colors.text + '99',
      fontStyle: 'italic',
    },
    attachmentsContainer: {
      marginTop: theme.spacing.md,
    },
    attachmentTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    attachmentList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    attachmentButton: {
      backgroundColor: theme.colors.primary + '20',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    attachmentIcon: {
      marginRight: theme.spacing.sm,
    },
    attachmentText: {
      color: theme.colors.primary,
      fontSize: 14,
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

  if (!record) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Medical record not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Record</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {format(parseISO(record.date), 'MMMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>
              {user?.role === 'patient' ? 'Doctor' : 'Patient'}
            </Text>
            <Text style={styles.value}>
              {user?.role === 'patient'
                ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`
                : `${record.patient.firstName} ${record.patient.lastName}`}
            </Text>
          </View>
          {user?.role === 'patient' && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Specialization</Text>
              <Text style={styles.value}>{record.doctor.specialization}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <Text style={styles.diagnosis}>{record.diagnosis}</Text>
          {record.notes && <Text style={styles.notes}>{record.notes}</Text>}
        </View>

        {record.prescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription</Text>
            <View style={styles.prescriptionContainer}>
              <View style={styles.prescriptionHeader}>
                <Text style={styles.prescriptionTitle}>Medications</Text>
                <Text style={styles.prescriptionStatus}>
                  {record.prescription.status.charAt(0).toUpperCase() +
                    record.prescription.status.slice(1)}
                </Text>
              </View>
              {record.prescription.medications.map((medication, index) => (
                <View key={index} style={styles.medicationItem}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
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
                    <Text style={styles.medicationNotes}>{medication.notes}</Text>
                  )}
                </View>
              ))}
              {record.prescription.instructions && (
                <Text style={styles.notes}>
                  Instructions: {record.prescription.instructions}
                </Text>
              )}
            </View>
          </View>
        )}

        {record.attachments && record.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.attachmentTitle}>Attachments</Text>
            <View style={styles.attachmentList}>
              {record.attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.id}
                  style={styles.attachmentButton}
                  onPress={() => handleViewAttachment(attachment.url)}
                >
                  <Text style={styles.attachmentText}>
                    {attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 