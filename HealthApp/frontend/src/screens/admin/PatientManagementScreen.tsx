import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getApi } from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';

interface Patient {
  id: string;
  email: string;
  name: string;
  isBlocked: boolean;
}

export default function PatientManagementScreen() {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const api = await getApi();
      const res = await api.get('/admin/patients');
      setPatients(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleBlockPatient = async (patient: Patient) => {
    try {
      const api = await getApi();
      await api.post(`/admin/patients/${patient.id}/block`);
      fetchPatients();
      Alert.alert('Success', `Patient ${patient.name} (${patient.email}) has been blocked.`);
    } catch (err) {
      console.error('Error blocking patient:', err);
      Alert.alert('Error', 'Failed to block patient');
    }
  };

  const handleUnblockPatient = async (patient: Patient) => {
    try {
      const api = await getApi();
      await api.post(`/admin/patients/${patient.id}/unblock`);
      fetchPatients();
      Alert.alert('Success', `Patient ${patient.name} (${patient.email}) has been unblocked.`);
    } catch (err) {
      console.error('Error unblocking patient:', err);
      Alert.alert('Error', 'Failed to unblock patient');
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    try {
      const api = await getApi();
      await api.delete(`/admin/patients/${patient.id}`);
      fetchPatients();
      Alert.alert('Success', `Patient ${patient.name} (${patient.email}) has been deleted.`);
    } catch (err) {
      console.error('Error deleting patient:', err);
      Alert.alert('Error', 'Failed to delete patient');
    }
  };

  const openActionModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
       style={[styles.patientItem, { backgroundColor: theme.colors.card }]}
       onPress={() => openActionModal(item)}
    >
       <View style={styles.patientInfo}>
         <Text style={[styles.patientName, { color: theme.colors.text }]}>{item.name}</Text>
         <Text style={[styles.patientEmail, { color: theme.colors.text + '80' }]}>{item.email}</Text>
       </View>
       {item.isBlocked ? ( <Ionicons name="lock-closed" size={24} color="red" /> ) : ( <Ionicons name="lock-open" size={24} color="green" /> )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
         <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
       <FlatList
         data={patients}
         renderItem={renderItem}
         keyExtractor={(item) => item.id}
         contentContainerStyle={styles.listContainer}
       />
       {selectedPatient && (
         <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Actions for Patient {selectedPatient.name} ({selectedPatient.email})</Text>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: selectedPatient.isBlocked ? "green" : "red" }]}
                     onPress={() => { (selectedPatient.isBlocked ? handleUnblockPatient(selectedPatient) : handleBlockPatient(selectedPatient)); setModalVisible(false); }}
                  >
                     <Text style={styles.actionText}>{selectedPatient.isBlocked ? "Unblock" : "Block"} Patient</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: "red" }]}
                     onPress={() => { handleDeletePatient(selectedPatient); setModalVisible(false); }}
                  >
                     <Text style={styles.actionText}>Delete Patient</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: "gray" }]}
                     onPress={() => setModalVisible(false)}
                  >
                     <Text style={styles.actionText}>Cancel</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>
       )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  patientItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: 'bold' },
  patientEmail: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', borderRadius: 12, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  actionButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  actionText: { color: 'white', fontSize: 16, fontWeight: '500' },
}); 