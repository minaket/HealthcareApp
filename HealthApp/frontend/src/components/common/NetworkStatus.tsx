import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { testConnection } from '../../utils/network';
import { useTheme } from '../../theme/ThemeProvider';

interface NetworkStatusProps {
  onConnectionTest?: (success: boolean) => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ onConnectionTest }) => {
  const [connectionTest, setConnectionTest] = useState<{
    success: boolean;
    url?: string;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testConnection();
      setConnectionTest(result);
      onConnectionTest?.(result.success);
    } catch (error) {
      console.error('Error testing API connection:', error);
      setConnectionTest({
        success: false,
        error: 'Connection test failed'
      });
      onConnectionTest?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testApiConnection();
  }, []);

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.small,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    title: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.xs,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: theme.spacing.xs,
    },
    connected: {
      backgroundColor: theme.colors.success,
    },
    disconnected: {
      backgroundColor: theme.colors.error,
    },
    warning: {
      backgroundColor: theme.colors.warning,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.small,
      marginTop: theme.spacing.xs,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: theme.spacing.xs,
    },
    successText: {
      color: theme.colors.success,
      fontSize: 12,
      marginTop: theme.spacing.xs,
    },
  });

  const getConnectionStatus = () => {
    if (connectionTest?.success) {
      return { status: 'connected', text: 'Connected to server' };
    }
    if (connectionTest?.error) {
      return { status: 'warning', text: 'Server connection failed' };
    }
    return { status: 'warning', text: 'Checking connection...' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Status</Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Server:</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{connectionStatus.text}</Text>
          <View style={[
            styles.statusIndicator,
            connectionStatus.status === 'connected' ? styles.connected : 
            connectionStatus.status === 'disconnected' ? styles.disconnected : 
            styles.warning
          ]} />
        </View>
      </View>

      {connectionTest?.url && (
        <Text style={styles.statusText}>URL: {connectionTest.url}</Text>
      )}

      {connectionTest?.error && (
        <Text style={styles.errorText}>Error: {connectionTest.error}</Text>
      )}

      {connectionTest?.success && (
        <Text style={styles.successText}>✅ Server is reachable</Text>
      )}

      <TouchableOpacity
        style={styles.retryButton}
        onPress={testApiConnection}
        disabled={isLoading}
      >
        <Text style={styles.retryButtonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 