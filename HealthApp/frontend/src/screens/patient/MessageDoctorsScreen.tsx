import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Doctor } from '../../types';
import initializeApi from '../../api/axios.config';
import { ROUTES, API_ENDPOINTS } from '../../config/constants';
import { Ionicons } from '@expo/vector-icons';
import { PatientStackParamList } from '../../types/navigation';

type MessageDoctorsScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList,
  'MessageDoctors'
>;

export default function MessageDoctorsScreen() {
  const navigation = useNavigation<MessageDoctorsScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const api = await initializeApi();
      const response = await api.get(API_ENDPOINTS.USERS.DOCTORS);
      setDoctors(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageDoctor = async (doctor: Doctor) => {
    try {
      setLoading(true);
      const api = await initializeApi();
      // Get or create conversation with the doctor
      const conversationResponse = await api.get(`/api/messages/doctor/${doctor.id}`);
      if (conversationResponse.data?.id) {
        // Navigate to chat screen with conversation id as chatId
        navigation.navigate(ROUTES.PATIENT.CHAT, {
          chatId: conversationResponse.data.id, // This is the conversation id
          patientName: `Dr. ${doctor.firstName} ${doctor.lastName}`
        });
      } else {
        Alert.alert('Error', 'Failed to start conversation with doctor');
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start conversation. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <View style={[styles.doctorCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.doctorInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>
            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
          </Text>
        </View>
        <View style={styles.doctorDetails}>
          <Text style={[styles.doctorName, { color: theme.colors.text }]}>
            Dr. {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.doctorSpecialty, { color: theme.colors.textSecondary }]}>
            {item.specialization}
          </Text>
          {item.yearsOfExperience && (
            <Text style={[styles.experience, { color: theme.colors.textSecondary }]}>
              {item.yearsOfExperience} years of experience
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.messageButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleMessageDoctor(item)}
        disabled={loading}
      >
        <Ionicons name="chatbubble" size={16} color="#FFF" />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search doctors by name or specialty..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {!loading && (
        <FlatList
          data={filteredDoctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name="medical-outline" 
                size={64} 
                color={theme.colors.textSecondary} 
                style={styles.emptyIcon} 
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {searchQuery ? 'No doctors found' : 'No doctors available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Please check back later'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    marginBottom: 2,
  },
  experience: {
    fontSize: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
