import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { STORAGE_KEYS } from '../config/constants';
import axios from 'axios';
import * as Network from 'expo-network';

const DEFAULT_PORT = '5000';
const FALLBACK_IP = 'localhost';
const IP_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const IP_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Get all possible IP addresses for the device
const getAllPossibleIPs = async (): Promise<string[]> => {
  const ips: string[] = [];
  
  try {
    // Try to get IP from Expo's development server
    const expoDevServer = Constants.expoConfig?.extra?.['expoDevServer'];
    if (expoDevServer?.hostUri) {
      const ip = expoDevServer.hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        ips.push(ip);
      }
    }

    // Get IP from network info
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected) {
      const ip = await Network.getIpAddressAsync();
      if (ip) {
        ips.push(ip);
      }
    }

    // Add common local network prefixes to try
    const commonPrefixes = ['192.168.0.', '192.168.1.', '10.0.0.'];
    const lastKnownIp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_KNOWN_IP);
    if (lastKnownIp) {
      // Try variations of the last known IP
      const baseIp = lastKnownIp.split('.').slice(0, 3).join('.');
      commonPrefixes.forEach(prefix => {
        if (baseIp.startsWith(prefix)) {
          ips.push(baseIp);
        }
      });
    }

    return [...new Set(ips)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting possible IPs:', error);
    return [];
  }
};

// Test if an IP is reachable
export const testIP = async (ip: string): Promise<boolean> => {
  try {
    console.log('Testing IP:', ip);
    const url = `http://${ip}:${DEFAULT_PORT}`;
    
    // Try both /health and /api/health endpoints
    const endpoints = ['/health', '/api/health'];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${url}${endpoint}`);
        const response = await axios.get(`${url}${endpoint}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept any status less than 500 as valid
        });
        
        console.log(`Endpoint ${endpoint} response:`, {
          status: response.status,
          data: response.data
        });
        
        return true;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed:`, {
          status: error.response?.status,
          message: error.message,
          code: error.code
        });
      }
    }
    
    console.log('All endpoints failed for IP:', ip);
    return false;
  } catch (error) {
    console.error('Error testing IP:', ip, error);
    return false;
  }
};

// Get the current IP address of the device
const getCurrentIP = async (): Promise<string> => {
  try {
    // First try to get the IP from Expo's development server
    const expoDevServer = Constants.expoConfig?.extra?.['expoDevServer'];
    if (expoDevServer?.hostUri) {
      const ip = expoDevServer.hostUri.split(':')[0];
      console.log('Expo dev server IP:', ip);
      
      // If we have a valid IP from Expo, try it first
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        // Test if this IP is reachable
        if (await testIP(ip)) {
          console.log('Using Expo dev server IP:', ip);
          return ip;
        }
      }
    }

    // If Expo IP doesn't work, try the device's actual IP
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected) {
      const ip = await Network.getIpAddressAsync();
      if (ip) {
        console.log('Device IP:', ip);
        // Test if this IP is reachable
        if (await testIP(ip)) {
          console.log('Using device IP:', ip);
          return ip;
        }
      }
    }

    // If we can't get a working IP, try common local network addresses
    const commonIPs = [
      '192.168.0.103', // Try the Expo IP we saw in the logs
      '192.168.0.1',
      '192.168.1.1',
      '10.0.0.1',
      '127.0.0.1',
      'localhost'
    ];

    console.log('Trying common IPs:', commonIPs);

    // Try each IP in parallel
    const results = await Promise.all(
      commonIPs.map(async (ip) => {
        const reachable = await testIP(ip);
        console.log(`IP ${ip} is ${reachable ? 'reachable' : 'not reachable'}`);
        return { ip, reachable };
      })
    );

    // Find the first reachable IP
    const reachableIP = results.find(result => result.reachable);
    if (reachableIP) {
      console.log('Found reachable IP:', reachableIP.ip);
      return reachableIP.ip;
    }

    // If no IP is reachable, try localhost as a last resort
    console.log('No reachable IP found, using localhost');
    return 'localhost';
  } catch (error) {
    console.error('Error getting current IP:', error);
    return 'localhost';
  }
};

// Get the API URL with the current IP
export const getApiUrl = async (): Promise<string> => {
  try {
    const ip = await getCurrentIP();
    const apiUrl = `http://${ip}:${DEFAULT_PORT}`;
    console.log('Using API URL:', apiUrl);
    return apiUrl;
  } catch (error) {
    console.error('Error getting API URL:', error);
    return `http://${FALLBACK_IP}:${DEFAULT_PORT}`;
  }
};

// Check if the current API URL is working and update if needed
export const updateApiUrlIfNeeded = async (): Promise<boolean> => {
  try {
    const currentUrl = await getApiUrl();
    const response = await axios.get(`${currentUrl}/health`, {
      timeout: 2000,
    });
    
    if (response.status === 200) {
      return true;
    }
    
    // If current URL fails, try to get a new IP
    const newIp = await getCurrentIP();
    const newUrl = `http://${newIp}:${DEFAULT_PORT}`;
    const newResponse = await axios.get(`${newUrl}/health`, {
      timeout: 2000,
    });
    
    return newResponse.status === 200;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

// Start periodic IP checks
export const startPeriodicIPChecks = () => {
  const checkAndUpdateIP = async () => {
    try {
      await updateApiUrlIfNeeded();
    } catch (error) {
      console.error('Periodic IP check failed:', error);
    }
  };

  // Run initial check
  checkAndUpdateIP();

  // Set up periodic checks
  const intervalId = setInterval(checkAndUpdateIP, IP_CHECK_INTERVAL);

  // Return cleanup function
  return () => clearInterval(intervalId);
}; 