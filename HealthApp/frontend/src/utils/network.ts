import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import axios from 'axios';

const DEFAULT_PORT = '5000';

// Simple IP detection for Android
const getCurrentIP = async (): Promise<string> => {
  // For Android, we need to use the computer's IP address, not localhost
  // The most common IP for development is 192.168.0.104 (as seen in the logs)
  const commonIPs = [
    '192.168.0.104', // Your computer's IP from the logs
    '192.168.0.103',
    '192.168.0.1',
    '192.168.1.1',
    '10.0.0.1'
  ];

  console.log('🔍 Testing IPs for Android:', commonIPs);

  // Test each IP
  for (const ip of commonIPs) {
    try {
      console.log(`Testing: ${ip}`);
      const response = await axios.get(`http://${ip}:${DEFAULT_PORT}/health`, {
        timeout: 3000
      });
      
      if (response.status === 200) {
        console.log(`✅ Found working IP: ${ip}`);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_KNOWN_IP, ip);
        return ip;
      }
    } catch (error: any) {
      console.log(`❌ IP ${ip} failed:`, error.message);
    }
  }

  // If no IP works, use the most likely one
  console.log('⚠️ Using fallback IP: 192.168.0.104');
  return '192.168.0.104';
};

// Get API URL
export const getApiUrl = async (): Promise<string> => {
  try {
    const ip = await getCurrentIP();
    const apiUrl = `http://${ip}:${DEFAULT_PORT}`;
    console.log('🌐 Using API URL:', apiUrl);
    return apiUrl;
  } catch (error) {
    console.error('❌ Error getting API URL:', error);
    return 'http://192.168.0.104:5000'; // Fallback to your computer's IP
  }
};

// Simple connection test
export const testConnection = async (): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const apiUrl = await getApiUrl();
    const response = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      return { success: true, url: apiUrl };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Network error' 
    };
  }
};

// Simplified network status
export const getNetworkStatus = async (): Promise<{
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
}> => {
  try {
    // Test connection to determine network status
    const connectionTest = await testConnection();
    return {
      isConnected: connectionTest.success,
      type: connectionTest.success ? 'wifi' : 'unknown',
      isInternetReachable: connectionTest.success
    };
  } catch (error) {
    console.error('Error getting network status:', error);
    return {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false
    };
  }
}; 