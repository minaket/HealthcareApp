import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getApi } from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  isBlocked: boolean;
}

export default function UserManagementScreen() {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
       const res = await getApi.get('/admin/users');
       setUsers(res.data);
       setError(null);
    } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to load users');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBlockUser = async (user: User) => {
    try {
       await getApi.post(`/admin/users/${user.id}/block`);
       fetchUsers();
       Alert.alert('Success', `User ${user.name} (${user.email}) has been blocked.`);
    } catch (err: any) {
       Alert.alert('Error', err.response?.data?.message || 'Failed to block user.');
    }
  };

  const handleUnblockUser = async (user: User) => {
    try {
       await getApi.post(`/admin/users/${user.id}/unblock`);
       fetchUsers();
       Alert.alert('Success', `User ${user.name} (${user.email}) has been unblocked.`);
    } catch (err: any) {
       Alert.alert('Error', err.response?.data?.message || 'Failed to unblock user.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
       await getApi.delete(`/admin/users/${user.id}`);
       fetchUsers();
       Alert.alert('Success', `User ${user.name} (${user.email}) has been deleted.`);
    } catch (err: any) {
       Alert.alert('Error', err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const openActionModal = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
       style={[styles.userItem, { backgroundColor: theme.colors.card }]}
       onPress={() => openActionModal(item)}
    >
       <View style={styles.userInfo}>
         <Text style={[styles.userName, { color: theme.colors.text }]}>{item.name}</Text>
         <Text style={[styles.userEmail, { color: theme.colors.text + '80' }]}>{item.email}</Text>
         <Text style={[styles.userRole, { color: theme.colors.text + '80' }]}>({item.role})</Text>
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
         data={users}
         renderItem={renderItem}
         keyExtractor={(item) => item.id}
         contentContainerStyle={styles.listContainer}
       />
       {selectedUser && (
         <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Actions for {selectedUser.name} ({selectedUser.email})</Text>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: selectedUser.isBlocked ? "green" : "red" }]}
                     onPress={() => { (selectedUser.isBlocked ? handleUnblockUser(selectedUser) : handleBlockUser(selectedUser)); setModalVisible(false); }}
                  >
                     <Text style={styles.actionText}>{selectedUser.isBlocked ? "Unblock" : "Block"} User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={[styles.actionButton, { backgroundColor: "red" }]}
                     onPress={() => { handleDeleteUser(selectedUser); setModalVisible(false); }}
                  >
                     <Text style={styles.actionText}>Delete User</Text>
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
  userItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userEmail: { fontSize: 14 },
  userRole: { fontSize: 14, fontStyle: 'italic' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', borderRadius: 12, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  actionButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  actionText: { color: 'white', fontSize: 16, fontWeight: '500' },
}); 