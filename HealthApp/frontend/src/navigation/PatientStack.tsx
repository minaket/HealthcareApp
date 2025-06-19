import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../config/constants';
import { PatientStackParamList } from '../types/navigation';

// Import screens
import PatientTabs from './PatientTabs';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';
import PatientEditProfileScreen from '../screens/patient/PatientEditProfileScreen';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import MedicalRecordsScreen from '../screens/patient/MedicalRecordsScreen';
import MessagesScreen from '../screens/patient/MessagesScreen';
import MessageDoctorsScreen from '../screens/patient/MessageDoctorsScreen';
import PatientNewAppointmentScreen from '../screens/patient/PatientNewAppointmentScreen';
import AppointmentDetailsScreen from '../screens/shared/AppointmentDetailsScreen';
import MedicalRecordDetailsScreen from '../screens/shared/MedicalRecordDetailsScreen';
import UploadMedicalRecordScreen from '../screens/patient/UploadMedicalRecordScreen';

const Stack = createNativeStackNavigator<PatientStackParamList>();

export const PatientStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PatientTabs" 
        component={PatientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.PROFILE} 
        component={PatientProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.EDIT_PROFILE} 
        component={PatientEditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.APPOINTMENTS} 
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.MEDICAL_RECORDS} 
        component={MedicalRecordsScreen}
        options={{
          title: 'Medical Records',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.MESSAGES} 
        component={MessagesScreen}
        options={{
          title: 'Messages',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.MESSAGE_DOCTORS} 
        component={MessageDoctorsScreen}
        options={{
          title: 'Message Doctors',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.NEW_APPOINTMENT} 
        component={PatientNewAppointmentScreen}
        options={{
          title: 'Book Appointment',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.APPOINTMENT_DETAILS} 
        component={AppointmentDetailsScreen}
        options={{
          title: 'Appointment Details',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.MEDICAL_RECORD_DETAILS} 
        component={MedicalRecordDetailsScreen}
        options={{
          title: 'Medical Record Details',
        }}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.CHAT} 
        component={require('../screens/shared/ChatScreen').default}
        options={({ route }: any) => ({
          title: route.params?.patientName || 'Chat',
        })}
      />
      <Stack.Screen 
        name={ROUTES.PATIENT.UPLOAD_MEDICAL_RECORD} 
        component={UploadMedicalRecordScreen}
        options={{
          title: 'Upload Medical Record',
        }}
      />
    </Stack.Navigator>
  );
}; 