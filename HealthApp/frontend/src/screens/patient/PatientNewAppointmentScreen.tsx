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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Doctor, Appointment, TimeSlot } from '../../types';
import initializeApi from '../../api/axios.config';
import { ROUTES, API_ENDPOINTS } from '../../config/constants';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { PatientStackParamList } from '../../types/navigation';

type PatientNewAppointmentScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList,
  typeof ROUTES.PATIENT.NEW_APPOINTMENT
>;

export default function PatientNewAppointmentScreen() {
  const navigation = useNavigation<PatientNewAppointmentScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const api = await initializeApi();
      const response = await api.get(API_ENDPOINTS.USERS.DOCTORS);
      setDoctors(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
      setDoctors([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    try {
      setLoading(true);
      const api = await initializeApi();
      const response = await api.get(
        `/api/doctors/${selectedDoctor.id}/available-slots`,
        {
          params: {
            date: format(selectedDate, 'yyyy-MM-dd'),
          },
        }
      );
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedTime(''); // Reset selected time when date changes
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      const api = await initializeApi();
      const appointmentData = {
        doctorId: selectedDoctor.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        reason: reason.trim(),
        status: 'scheduled'
      };
      const response = await api.post(API_ENDPOINTS.APPOINTMENTS.PATIENT, appointmentData);
      Alert.alert(
        'Success',
        'Appointment booked successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate(ROUTES.PATIENT.APPOINTMENTS)
          }
        ]
      );
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        isAvailable: true
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        isAvailable: true
      });
    }
    
    return slots;
  };

  // Use generated slots if API doesn't return any
  const displaySlots = availableSlots.length > 0 ? availableSlots : generateTimeSlots();

  const handleMessageDoctor = async (doctor: Doctor) => {
    try {
      setLoading(true);
      const api = await initializeApi();
      // Get or create conversation with the doctor
      const conversationResponse = await api.get(`/api/messages/doctor/${doctor.id}`);
      if (conversationResponse.data?.id) {
        // Navigate to chat screen
        navigation.navigate(ROUTES.PATIENT.CHAT, {
          chatId: conversationResponse.data.id,
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

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const api = await initializeApi();
              await api.patch(`/api/patient/appointments/${appointmentId}/cancel`);
              Alert.alert('Success', 'Appointment cancelled successfully.');
              // Refresh appointments list
              fetchAppointments();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Doctor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorsList}>
          {(doctors || []).map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={[
                styles.doctorCard,
                {
                  backgroundColor: selectedDoctor?.id === doctor.id 
                    ? theme.colors.primary 
                    : theme.colors.card,
                },
              ]}
              onPress={() => setSelectedDoctor(doctor)}
            >
              <Text
                style={[
                  styles.doctorName,
                  { color: selectedDoctor?.id === doctor.id ? '#FFF' : theme.colors.text },
                ]}
              >
                Dr. {doctor.firstName} {doctor.lastName}
              </Text>
              <Text
                style={[
                  styles.doctorSpecialty,
                  { color: selectedDoctor?.id === doctor.id ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                {doctor.specialization}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 10 }} />
        )}
        {!loading && (!doctors || doctors.length === 0) && (
          <Text style={[styles.noDoctorsText, { color: theme.colors.textSecondary }]}>
            No doctors available
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Date</Text>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: theme.colors.card }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
            {format(selectedDate, 'MMMM dd, yyyy')}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
            maximumDate={addDays(new Date(), 30)}
          />
        )}
      </View>

      {selectedDoctor && selectedDate && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Available Time Slots</Text>
          <View style={styles.timeSlotsContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : displaySlots.length > 0 ? (
              displaySlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    {
                      backgroundColor: selectedTime === slot.time 
                        ? theme.colors.primary
                        : theme.colors.card,
                      opacity: slot.isAvailable ? 1 : 0.5,
                    },
                  ]}
                  onPress={() => slot.isAvailable && setSelectedTime(slot.time)}
                  disabled={!slot.isAvailable}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      { color: selectedTime === slot.time ? '#FFF' : theme.colors.text },
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noSlotsText, { color: theme.colors.textSecondary }]}>
                No available slots for this date
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Reason for Visit</Text>
        <TextInput
          style={[
            styles.reasonInput,
            {
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Please describe your reason for visit"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={4}
          value={reason}
          onChangeText={setReason}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.bookButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: loading ? 0.7 : 1,
          },
        ]}
        onPress={handleBookAppointment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  doctorsList: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  doctorCard: {
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
  },
  dateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeSlot: {
    padding: 12,
    borderRadius: 8,
    margin: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noSlotsText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  bookButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noDoctorsText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  messageButton: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 