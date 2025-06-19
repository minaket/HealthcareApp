import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { MedicalRecord, Patient } from '../../types';
import { getApi } from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

type MedicalRecordManagementScreenNavigationProp = NativeStackNavigationProp<
  any,
  'MedicalRecordManagement'
>;

type MedicalRecordManagementScreenRouteProp = {
  params: {
    patientId: string;
  };
};

export default function MedicalRecordManagementScreen() {
  const navigation = useNavigation<MedicalRecordManagementScreenNavigationProp>();
  const route = useRoute<MedicalRecordManagementScreenRouteProp>();
  const { patientId } = route.params;
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    attachments: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async () => {
    try {
      const client = await getApi();
      const [patientRes, recordsRes] = await Promise.all([
        client.get(`/patients/${patientId}`),
        client.get(`/patients/${patientId}/medical-records`),
      ]);

      setPatient(patientRes.data);
      setMedicalRecords(recordsRes.data);
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

  const handleAddAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          type: result.mimeType,
          name: result.name,
        } as any);

        const client = await getApi();
        const response = await client.post('/medical-records/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setNewRecord((prev) => ({
          ...prev,
          attachments: [...prev.attachments, response.data.fileUrl],
        }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload attachment');
    }
  };

  const handleCreateRecord = async () => {
    if (!newRecord.diagnosis.trim() || !newRecord.treatment.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const client = await getApi();
      const response = await client.post(`/patients/${patientId}/medical-records`, {
        ...newRecord,
        doctorId: user?.id,
      });

      setMedicalRecords([response.data, ...medicalRecords]);
      setIsModalVisible(false);
      setNewRecord({
        diagnosis: '',
        treatment: '',
        notes: '',
        attachments: [],
      });
      Alert.alert('Success', 'Medical record created successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create medical record');
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    navigation.navigate(ROUTES.DOCTOR.MEDICAL_RECORD_DETAILS, {
      recordId: record.id,
      patientId,
    });
  };

  const renderMedicalRecord = (record: MedicalRecord) => {
    const recordDate = parseISO(record.createdAt);

    return (
      <TouchableOpacity
        key={record.id}
        style={[styles.recordCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleViewRecord(record)}
      >
        <View style={styles.recordHeader}>
          <Text style={[styles.recordDate, { color: theme.colors.text + '80' }]}>
            {format(recordDate, 'MMM dd, yyyy')}
          </Text>
          {record.attachments.length > 0 && (
            <View style={styles.attachmentBadge}>
              <Ionicons name="attach" size={16} color={theme.colors.primary} />
              <Text style={[styles.attachmentCount, { color: theme.colors.primary }]}>
                {record.attachments.length}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.diagnosis, { color: theme.colors.text }]}>
          {record.diagnosis}
        </Text>
        <Text
          style={[styles.treatment, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {record.treatment}
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
          <Text style={styles.addButtonText}>Add Medical Record</Text>
        </TouchableOpacity>

        {medicalRecords.map(renderMedicalRecord)}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                New Medical Record
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Diagnosis *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                multiline
                numberOfLines={3}
                placeholder="Enter diagnosis"
                placeholderTextColor={theme.colors.text + '80'}
                value={newRecord.diagnosis}
                onChangeText={(text) =>
                  setNewRecord((prev) => ({ ...prev, diagnosis: text }))
                }
              />

              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Treatment *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                multiline
                numberOfLines={3}
                placeholder="Enter treatment"
                placeholderTextColor={theme.colors.text + '80'}
                value={newRecord.treatment}
                onChangeText={(text) =>
                  setNewRecord((prev) => ({ ...prev, treatment: text }))
                }
              />

              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                multiline
                numberOfLines={4}
                placeholder="Enter additional notes"
                placeholderTextColor={theme.colors.text + '80'}
                value={newRecord.notes}
                onChangeText={(text) =>
                  setNewRecord((prev) => ({ ...prev, notes: text }))
                }
              />

              <TouchableOpacity
                style={[
                  styles.attachButton,
                  { backgroundColor: theme.colors.card },
                ]}
                onPress={handleAddAttachment}
              >
                <Ionicons
                  name="attach"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={[styles.attachButtonText, { color: theme.colors.primary }]}>
                  Add Attachment
                </Text>
              </TouchableOpacity>

              {newRecord.attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  <Text style={[styles.attachmentsTitle, { color: theme.colors.text }]}>
                    Attachments ({newRecord.attachments.length})
                  </Text>
                  {newRecord.attachments.map((url, index) => (
                    <View
                      key={index}
                      style={[
                        styles.attachmentItem,
                        { backgroundColor: theme.colors.card },
                      ]}
                    >
                      <Ionicons
                        name="document-text"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[styles.attachmentName, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {url.split('/').pop()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateRecord}
              >
                <Text style={styles.submitButtonText}>Create Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientInfo: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 14,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentCount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  diagnosis: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  treatment: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: '70%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  attachButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  attachmentsList: {
    marginBottom: 16,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 