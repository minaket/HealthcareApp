import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeProvider';
import { ROUTES } from '../../config/constants';
import { PatientStackParamList } from '../../types/navigation';
import initializeApi from '../../api/axios.config';
import { Ionicons } from '@expo/vector-icons';

type UploadMedicalRecordScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList,
  'UploadMedicalRecord'
>;

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export default function UploadMedicalRecordScreen() {
  const navigation = useNavigation<UploadMedicalRecordScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordType, setRecordType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const recordTypes = [
    'Lab Results',
    'X-Ray',
    'MRI Scan',
    'CT Scan',
    'Prescription',
    'Vaccination Record',
    'Surgery Report',
    'Consultation Notes',
    'Other'
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name || 'Unknown file',
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset: any) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedicalRecord = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the medical record.');
      return;
    }

    if (!recordType) {
      Alert.alert('Error', 'Please select a record type.');
      return;
    }

    if (uploadedFiles.length === 0) {
      Alert.alert('Error', 'Please upload at least one file.');
      return;
    }

    try {
      setLoading(true);
      const api = await initializeApi();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('recordType', recordType);
      formData.append('date', date);

      // Append files
      uploadedFiles.forEach((file, index) => {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const mimeType = file.type || `image/${fileExtension}`;
        
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: mimeType,
        } as any);
      });

      const response = await api.post('/api/patient/medical-records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success',
        'Medical record uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate(ROUTES.PATIENT.MEDICAL_RECORDS)
          }
        ]
      );
    } catch (error: any) {
      console.error('Error uploading medical record:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload medical record. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Upload Medical Record</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Record Details</Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Record title"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Description (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Record Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
            {recordTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: recordType === type ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setRecordType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: recordType === type ? '#FFF' : theme.colors.text },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor={theme.colors.textSecondary}
            value={date}
            onChangeText={setDate}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upload Files</Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              onPress={pickDocument}
            >
              <Ionicons name="document" size={24} color="#FFF" />
              <Text style={styles.uploadButtonText}>Pick Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.colors.secondary }]}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={styles.uploadButtonText}>Pick Image</Text>
            </TouchableOpacity>
          </View>

          {uploadedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={[styles.filesTitle, { color: theme.colors.text }]}>
                Uploaded Files ({uploadedFiles.length})
              </Text>
              {uploadedFiles.map((file, index) => (
                <View key={index} style={[styles.fileItem, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
                      {formatFileSize(file.size)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={uploadMedicalRecord}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFF" />
              <Text style={styles.uploadButtonText}>Upload Medical Record</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeContainer: {
    marginBottom: 12,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 16,
    padding: 16,
  },
  filesContainer: {
    marginTop: 16,
  },
  filesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
});
