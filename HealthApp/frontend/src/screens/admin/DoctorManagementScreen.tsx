import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getApi } from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';

interface Doctor {
  id: string;
  email: string;
  name: string;
  isBlocked: boolean;
}

export default function DoctorManagementScreen() {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const api = await getApi();
      const res = await api.get('/admin/doctors');
      setDoctors(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleBlockDoctor = async (doctor: Doctor) => {
    try {
      const api = await getApi();
      await api.post(`/admin/doctors/${doctor.id}/block`);
      fetchDoctors();
      Alert.alert('Success', `Doctor ${doctor.name} (${doctor.email}) has been blocked.`);
    } catch (err) {
      console.error('Error blocking doctor:', err);
      Alert.alert('Error', 'Failed to block doctor');
    }
  };

  const handleUnblockDoctor = async (doctor: Doctor) => {
    try {
      const api = await getApi();
      await api.post(`/admin/doctors/${doctor.id}/unblock`);
      fetchDoctors();
      Alert.alert('Success', `Doctor ${doctor.name} (${doctor.email}) has been unblocked.`);
    } catch (err) {
      console.error('Error unblocking doctor:', err);
      Alert.alert('Error', 'Failed to unblock doctor');
    }
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    try {
      const api = await getApi();
      await api.delete(`/admin/doctors/${doctor.id}`);
      fetchDoctors();
      Alert.alert('Success', `Doctor ${doctor.name} (${doctor.email}) has been deleted.`);
    } catch (err) {
      console.error('Error deleting doctor:', err);
      Alert.alert('Error', 'Failed to delete doctor');
    }
  };

  const openActionModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
       style={[styles.doctorItem, { backgroundColor: theme.colors.card }]}
       onPress={() => openActionModal(item)}
    >
       <View style={styles.doctorInfo}>
         <Text style={[styles.doctorName, { color: theme.colors.text }]}>{item.name}</Text>
         <Text style={[styles.doctorEmail, { color: theme.colors.text + '80' }]}>{item.email}</Text>
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
         data={doctors}
         renderItem={renderItem}
         keyExtractor={(item) => item.id}
         contentContainerStyle={styles.listContainer}
       />
       {selectedDoctor && (
         <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Actions for Doctor {selectedDoctor.name} ({selectedDoctor.email})</Text>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: selectedDoctor.isBlocked ? "green" : "red" }]}
                     onPress={() => { (selectedDoctor.isBlocked ? handleUnblockDoctor(selectedDoctor) : handleBlockDoctor(selectedDoctor)); setModalVisible(false); }}
                  >
                     <Text style={styles.actionText}>{selectedDoctor.isBlocked ? "Unblock" : "Block"} Doctor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: "red" }]}
                     onPress={() => { handleDeleteDoctor(selectedDoctor); setModalVisible(false); }}
                  >
                     <Text style={styles.actionText}>Delete Doctor</Text>
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
  doctorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: 'bold' },
  doctorEmail: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', borderRadius: 12, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  actionButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  actionText: { color: 'white', fontSize: 16, fontWeight: '500' },
}); 