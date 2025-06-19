import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { MedicalRecord } from '../../types';
import { getApi } from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { PatientStackParamList } from '../../types/navigation';
import { format, parseISO } from 'date-fns';

type MedicalRecordsScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList,
  'PatientMedicalRecords'
>;

export default function MedicalRecordsScreen() {
  const navigation = useNavigation<MedicalRecordsScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const fetchRecords = async () => {
    try {
      const apiInstance = await getApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }
      
      const response = await apiInstance.get('/api/patient/medical-records');
      setRecords(response.data.records);
      setFilteredRecords(response.data.records);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medical records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    let filtered = [...records];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        record =>
          record.diagnosis.toLowerCase().includes(query) ||
          record.notes?.toLowerCase().includes(query) ||
          record.prescription?.medications.some(med =>
            med.name.toLowerCase().includes(query)
          )
      );
    }

    // Apply year filter
    if (selectedYear) {
      filtered = filtered.filter(
        record => new Date(record.date).getFullYear() === selectedYear
      );
    }

    setFilteredRecords(filtered);
  }, [searchQuery, selectedYear, records]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRecords();
  };

  const getAvailableYears = () => {
    const years = new Set(
      records.map(record => new Date(record.date).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
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
      marginBottom: theme.spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      marginBottom: theme.spacing.lg,
    },
    searchInput: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text.default,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    yearButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    yearButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    yearButtonText: {
      color: theme.colors.text.default,
      fontSize: 14,
    },
    yearButtonTextActive: {
      color: '#FFFFFF',
    },
    recordCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    recordDate: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    recordDoctor: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    recordDiagnosis: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    recordNotes: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
    },
    prescriptionContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    prescriptionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    medicationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    medicationName: {
      fontSize: 14,
      color: theme.colors.text.default,
      flex: 1,
    },
    medicationDosage: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    attachmentsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    attachmentButton: {
      backgroundColor: theme.colors.primary + '20',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    attachmentText: {
      color: theme.colors.primary,
      fontSize: 12,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
      fontSize: 16,
      marginTop: theme.spacing.xl,
    },
    uploadButton: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    uploadButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Medical Records</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate(ROUTES.PATIENT.UPLOAD_MEDICAL_RECORD)}
          >
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search records..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
            styles.yearButton,
            selectedYear === null && styles.yearButtonActive,
          ]}
          onPress={() => setSelectedYear(null)}
        >
          <Text
            style={[
              styles.yearButtonText,
              selectedYear === null && styles.yearButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {getAvailableYears().map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && styles.yearButtonActive,
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text
              style={[
                styles.yearButtonText,
                selectedYear === year && styles.yearButtonTextActive,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredRecords.length === 0 ? (
        <Text style={styles.emptyText}>No medical records found</Text>
      ) : (
        filteredRecords.map((record) => (
          <TouchableOpacity
            key={record.id}
            style={styles.recordCard}
            onPress={() =>
              navigation.navigate(ROUTES.PATIENT.MEDICAL_RECORD_DETAILS, {
                recordId: record.id,
              })
            }
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordDate}>
                {format(parseISO(record.date), 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.recordDoctor}>Dr. {record.doctorId}</Text>
            </View>

            <Text style={styles.recordDiagnosis}>{record.diagnosis}</Text>
            {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}

            {record.prescription && (
              <View style={styles.prescriptionContainer}>
                <Text style={styles.prescriptionTitle}>Prescription</Text>
                {record.prescription.medications.map((medication, index) => (
                  <View key={index} style={styles.medicationItem}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                  </View>
                ))}
              </View>
            )}

            {record.attachments && record.attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                {record.attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    style={styles.attachmentButton}
                    onPress={() => {
                      // Handle attachment view/download
                    }}
                  >
                    <Text style={styles.attachmentText}>
                      {attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
} 