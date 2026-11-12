// Permission Utility Functions
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

export type PermissionType = 'location' | 'calendar' | 'camera' | 'photos' | 'notifications';

// Use string for status to avoid type conflicts between different expo modules
export type PermissionStatusValue = 'granted' | 'denied' | 'undetermined' | 'restricted' | 'limited';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionStatusValue;
}

/**
 * Request location permissions (foreground and background)
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
  try {
    // Request foreground permission
    const { status: foregroundStatus, canAskAgain: foregroundCanAsk } =
      await Location.requestForegroundPermissionsAsync();

    let backgroundStatus = foregroundStatus;
    let backgroundCanAsk = foregroundCanAsk;

    // On iOS, also request background permission
    if (Platform.OS === 'ios') {
      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
      backgroundStatus = status;
      backgroundCanAsk = canAskAgain;
    }

    const granted = foregroundStatus === 'granted' && backgroundStatus === 'granted';
    const canAskAgain = foregroundCanAsk || backgroundCanAsk;

    return {
      granted,
      canAskAgain,
      status: foregroundStatus,
    };
  } catch (error) {
    console.error('Location permission error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' as PermissionStatusValue };
  }
}

/**
 * Request calendar permissions
 */
export async function requestCalendarPermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Calendar.requestPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Calendar permission error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' as PermissionStatusValue };
  }
}

/**
 * Request camera permissions
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Camera permission error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
}

/**
 * Request photo library permissions
 */
export async function requestPhotosPermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Photos permission error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return {
      granted: status === 'granted',
      canAskAgain,
      status: status as PermissionStatusValue,
    };
  } catch (error) {
    console.error('Notification permission error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' as PermissionStatusValue };
  }
}

/**
 * Check current permission status
 */
export async function checkPermission(type: PermissionType): Promise<PermissionStatus> {
  try {
    switch (type) {
      case 'location': {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        return { granted: status === 'granted', canAskAgain, status: status as PermissionStatusValue };
      }
      case 'calendar': {
        const { status, canAskAgain } = await Calendar.getCalendarPermissionsAsync();
        return { granted: status === 'granted', canAskAgain, status: status as PermissionStatusValue };
      }
      case 'camera': {
        const { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
        return { granted: status === 'granted', canAskAgain, status: status as PermissionStatusValue };
      }
      case 'photos': {
        const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
        return { granted: status === 'granted', canAskAgain, status: status as PermissionStatusValue };
      }
      case 'notifications': {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        return { granted: status === 'granted', canAskAgain, status: status as PermissionStatusValue };
      }
      default:
        return { granted: false, canAskAgain: false, status: 'denied' as PermissionStatusValue };
    }
  } catch (error) {
    console.error(`Permission check error (${type}):`, error);
    return { granted: false, canAskAgain: false, status: 'denied' as PermissionStatusValue };
  }
}

/**
 * Request multiple permissions at once
 */
export async function requestPermissions(
  types: PermissionType[]
): Promise<Record<PermissionType, PermissionStatus>> {
  const results: Record<PermissionType, PermissionStatus> = {} as Record<PermissionType, PermissionStatus>;

  for (const type of types) {
    switch (type) {
      case 'location':
        results.location = await requestLocationPermission();
        break;
      case 'calendar':
        results.calendar = await requestCalendarPermission();
        break;
      case 'camera':
        results.camera = await requestCameraPermission();
        break;
      case 'photos':
        results.photos = await requestPhotosPermission();
        break;
      case 'notifications':
        results.notifications = await requestNotificationPermission();
        break;
    }
  }

  return results;
}

/**
 * Show permission rationale and open settings if denied
 */
export async function handlePermissionDenied(
  type: PermissionType,
  featureName: string
): Promise<boolean> {
  const { granted, canAskAgain } = await checkPermission(type);

  if (granted) return true;

  if (!canAskAgain) {
    // Permanently denied - show settings dialog
    Alert.alert(
      `${featureName} Permission Required`,
      `This app needs ${type} permission to ${featureName}. Please enable it in Settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => openAppSettings(),
        },
      ]
    );
    return false;
  }

  // Can ask again - show rationale
  Alert.alert(
    `${featureName} Permission`,
    `This app needs ${type} permission to ${featureName}. Would you like to grant permission?`,
    [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Grant Permission',
        onPress: async () => {
          await requestPermissions([type]);
        },
      },
    ]
  );

  return false;
}

/**
 * Open app settings
 */
export function openAppSettings(): void {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

/**
 * Get permission description for user-facing messages
 */
export function getPermissionDescription(type: PermissionType): string {
  const descriptions: Record<PermissionType, string> = {
    location: 'your location to show nearby events and provide directions',
    calendar: 'your calendar to add events to your personal schedule',
    camera: 'your camera to take photos for events',
    photos: 'your photo library to upload event images',
    notifications: 'notifications to alert you about event updates and reminders',
  };
  return descriptions[type];
}

/**
 * Check if all required permissions are granted
 */
export async function checkAllPermissions(required: PermissionType[]): Promise<{
  allGranted: boolean;
  missing: PermissionType[];
  statuses: Record<PermissionType, PermissionStatus>;
}> {
  const statuses: Record<PermissionType, PermissionStatus> = {} as Record<PermissionType, PermissionStatus>;
  const missing: PermissionType[] = [];

  for (const type of required) {
    statuses[type] = await checkPermission(type);
    if (!statuses[type].granted) {
      missing.push(type);
    }
  }

  return {
    allGranted: missing.length === 0,
    missing,
    statuses,
  };
}