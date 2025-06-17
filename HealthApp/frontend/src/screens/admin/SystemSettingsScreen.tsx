import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import api from '../../api/axios.config';

interface SystemSetting {
  key: string;
  value: boolean;
  label: string;
}

export default function SystemSettingsScreen() {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
       const res = await api.get('/admin/system-settings');
       setSettings(res.data);
       setError(null);
    } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to load system settings');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleToggle = (key: string, newValue: boolean) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: newValue } : s)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
       const payload = settings.reduce((o, s) => ({ ...o, [s.key]: s.value }), {});
       await api.post('/admin/system-settings', payload);
       Alert.alert('Success', 'System settings updated.');
    } catch (err: any) {
       Alert.alert('Error', err.response?.data?.message || 'Failed to update system settings.');
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
         <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.contentContainer}>
       <Text style={[styles.title, { color: theme.colors.text }]}>System Settings</Text>
       {settings.map((setting) => (
         <View key={setting.key} style={[styles.settingItem, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{setting.label}</Text>
            <Switch
               value={setting.value}
               onValueChange={(newValue) => handleToggle(setting.key, newValue)}
               trackColor={{ false: "#767577", true: theme.colors.primary }}
            />
         </View>
       ))}
       <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
       >
          {isSaving ? ( <ActivityIndicator color="white" /> ) : ( <Text style={styles.saveButtonText}>Save</Text> )}
       </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  settingLabel: { fontSize: 16, fontWeight: '500' },
  saveButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
}); 