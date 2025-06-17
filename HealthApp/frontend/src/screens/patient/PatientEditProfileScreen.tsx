import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../../hooks';
import { useTheme } from '../../theme/ThemeProvider';
import { RootState } from '../../store';
import { ROUTES } from '../../config/constants';
import { PatientStackParamList } from '../../types/navigation';
import { getApi } from '../../api/axios.config';

type PatientEditProfileScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList,
  'PatientEditProfile'
>;

export default function PatientEditProfileScreen() {
  const navigation = useNavigation<PatientEditProfileScreenNavigationProp>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    allergies: [] as string[],
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
      address: ''
    }
  });

  const [allergyInput, setAllergyInput] = useState('');

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    try {
      const apiInstance = await getApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }

      await apiInstance.put('/api/patient/profile', formData);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
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
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    allergyContainer: {
      marginBottom: theme.spacing.xl,
    },
    allergyInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    allergyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    allergyText: {
      flex: 1,
      color: theme.colors.text,
    },
    removeButton: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.dateOfBirth}
          onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Gender (male, female, other)"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.gender}
          onChangeText={(text) => setFormData({ ...formData, gender: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Blood Type (A+, A-, B+, B-, AB+, AB-, O+, O-)"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.bloodType}
          onChangeText={(text) => setFormData({ ...formData, bloodType: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies</Text>
        <View style={styles.allergyContainer}>
          <View style={styles.allergyInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Add allergy"
              placeholderTextColor={theme.colors.text + '80'}
              value={allergyInput}
              onChangeText={setAllergyInput}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {formData.allergies.map((allergy, index) => (
            <View key={index} style={styles.allergyItem}>
              <Text style={styles.allergyText}>• {allergy}</Text>
              <TouchableOpacity onPress={() => removeAllergy(index)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.emergencyContact.name}
          onChangeText={(text) => setFormData({
            ...formData,
            emergencyContact: { ...formData.emergencyContact, name: text }
          })}
        />

        <TextInput
          style={styles.input}
          placeholder="Relationship"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.emergencyContact.relationship}
          onChangeText={(text) => setFormData({
            ...formData,
            emergencyContact: { ...formData.emergencyContact, relationship: text }
          })}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.emergencyContact.phoneNumber}
          onChangeText={(text) => setFormData({
            ...formData,
            emergencyContact: { ...formData.emergencyContact, phoneNumber: text }
          })}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.emergencyContact.email}
          onChangeText={(text) => setFormData({
            ...formData,
            emergencyContact: { ...formData.emergencyContact, email: text }
          })}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Address (optional)"
          placeholderTextColor={theme.colors.text + '80'}
          value={formData.emergencyContact.address}
          onChangeText={(text) => setFormData({
            ...formData,
            emergencyContact: { ...formData.emergencyContact, address: text }
          })}
          multiline
        />
      </View>
    </ScrollView>
  );
} 