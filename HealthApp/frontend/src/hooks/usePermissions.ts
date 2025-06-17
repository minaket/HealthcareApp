import { useState } from 'react';
import { Platform, PermissionsAndroid, Alert, Permission } from 'react-native';

// Define the screen capture permission constant since it's not in PermissionsAndroid
const SCREEN_CAPTURE_PERMISSION = 'android.permission.DETECT_SCREEN_CAPTURE' as Permission;

export const usePermissions = () => {
  const [hasScreenCapturePermission, setHasScreenCapturePermission] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);

  const checkScreenCapturePermission = async () => {
    if (Platform.OS !== 'android') {
      setHasScreenCapturePermission(true);
      return true;
    }

    try {
      setIsCheckingPermission(true);
      // For Android 10 (API level 29) and above, we need to check if the permission exists
      if (Platform.Version >= 29) {
        const granted = await PermissionsAndroid.check(SCREEN_CAPTURE_PERMISSION);
        setHasScreenCapturePermission(granted);
        return granted;
      } else {
        // For older Android versions, we can't detect screen capture
        console.warn('Screen capture detection is not available on this Android version');
        setHasScreenCapturePermission(false);
        return false;
      }
    } catch (err) {
      console.warn('Error checking screen capture permission:', err);
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const requestScreenCapturePermission = async () => {
    if (Platform.OS !== 'android') {
      setHasScreenCapturePermission(true);
      return true;
    }

    // For Android 10 (API level 29) and above
    if (Platform.Version >= 29) {
      try {
        setIsCheckingPermission(true);
        const granted = await PermissionsAndroid.request(SCREEN_CAPTURE_PERMISSION, {
          title: 'Screen Capture Detection',
          message: 'This app needs screen capture detection permission to protect sensitive health information.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasScreenCapturePermission(isGranted);
        return isGranted;
      } catch (err) {
        console.warn('Error requesting screen capture permission:', err);
        return false;
      } finally {
        setIsCheckingPermission(false);
      }
    } else {
      // For older Android versions, show a message that it's not supported
      Alert.alert(
        'Not Supported',
        'Screen capture detection is not available on your Android version. Please update your device for better security.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  return {
    hasScreenCapturePermission,
    isCheckingPermission,
    requestScreenCapturePermission,
    checkScreenCapturePermission,
  };
}; 