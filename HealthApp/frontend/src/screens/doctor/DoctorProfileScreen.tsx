import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDoctor } from '../../hooks/useDoctor';
import { Doctor } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const DoctorProfileScreen = () => {
  const { user } = useAuth();
  const { doctor, updateDoctor, isLoading, error } = useDoctor();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Doctor>>({
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    education: '',
    hospital: '',
    department: '',
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        yearsOfExperience: doctor.yearsOfExperience || 0,
        education: doctor.education || '',
        hospital: doctor.hospital || '',
        department: doctor.department || '',
      });
    }
  }, [doctor]);

  const handleUpdate = async () => {
    try {
      await updateDoctor(formData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Specialization</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.specialization}
            onChangeText={(text) =>
              setFormData({ ...formData, specialization: text })
            }
            placeholder="Enter specialization"
          />
        ) : (
          <Text style={styles.value}>{doctor?.specialization || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>License Number</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.licenseNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, licenseNumber: text })
            }
            placeholder="Enter license number"
          />
        ) : (
          <Text style={styles.value}>{doctor?.licenseNumber || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Years of Experience</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.yearsOfExperience?.toString()}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                yearsOfExperience: parseInt(text) || 0,
              })
            }
            keyboardType="numeric"
            placeholder="Enter years of experience"
          />
        ) : (
          <Text style={styles.value}>
            {doctor?.yearsOfExperience || 'Not set'} years
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Education</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={formData.education}
            onChangeText={(text) => setFormData({ ...formData, education: text })}
            placeholder="Enter education details"
            multiline
            numberOfLines={3}
          />
        ) : (
          <Text style={styles.value}>{doctor?.education || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Hospital</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.hospital}
            onChangeText={(text) => setFormData({ ...formData, hospital: text })}
            placeholder="Enter hospital name"
          />
        ) : (
          <Text style={styles.value}>{doctor?.hospital || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Department</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.department}
            onChangeText={(text) =>
              setFormData({ ...formData, department: text })
            }
            placeholder="Enter department"
          />
        ) : (
          <Text style={styles.value}>{doctor?.department || 'Not set'}</Text>
        )}
      </View>

      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: colors.text.white,
    ...typography.button,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...typography.body1,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    ...typography.body1,
    color: colors.text.primary,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: colors.text.white,
    ...typography.button,
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
    textAlign: 'center',
  },
}); 