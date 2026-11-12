// =============================================================================
// COMMUNITY EVENTS APP - APP CONTEXT (Supabase Only)
// =============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { api } from '@/services/api';
import { UserProfile, Notification } from '@/types';
import * as Notifications from 'expo-notifications';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface AppContextType {
  // App state
  isOnline: boolean;
  appState: AppStateStatus;
  isBackground: boolean;

  // User data (cached)
  currentUserProfile: UserProfile | null;

  // Notifications
  unreadNotificationCount: number;
  fcmToken: string | null;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Actions
  refreshUserData: () => Promise<void>;
  registerForPushNotifications: () => Promise<string | null>;
  handleNotificationOpen: (notification: any) => void;
  handleDeepLink: (url: string) => void;
}

interface AppSettings {
  // UI
  theme: 'light' | 'dark' | 'system';
  language: string;
  reduceMotion: boolean;

  // Notifications
  pushEnabled: boolean;
  emailEnabled: boolean;
  newEventsNearby: boolean;
  eventReminders: boolean;
  eventUpdates: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;

  // Privacy
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showLocation: boolean;
  showAttendingEvents: boolean;

  // Data
  autoDownloadImages: boolean;
  cacheSize: number;
  offlineMode: boolean;
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  reduceMotion: false,
  pushEnabled: true,
  emailEnabled: true,
  newEventsNearby: true,
  eventReminders: true,
  eventUpdates: true,
  friendActivity: true,
  weeklyDigest: true,
  profileVisibility: 'public',
  showEmail: false,
  showLocation: true,
  showAttendingEvents: true,
  autoDownloadImages: true,
  cacheSize: 100 * 1024 * 1024, // 100MB
  offlineMode: false,
};

const SETTINGS_KEY = '@community_events_settings';
const USER_PROFILE_KEY = '@community_events_user_profile';

const AppContext = createContext<AppContextType | null>(null);

// -----------------------------------------------------------------------------
// APP PROVIDER
// -----------------------------------------------------------------------------
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user, userProfile, refreshProfile } = useAuth();

  // State
  const [isOnline, setIsOnline] = useState(true);
  const [appState, setAppState] = useState<AppStateStatus>((AppState.currentState ?? 'active') as AppStateStatus);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadUserProfile();
  }, []);

  // Sync with auth user profile
  useEffect(() => {
    if (userProfile) {
      setCurrentUserProfile(userProfile);
      // Update settings from user profile
      setSettings(prev => ({
        ...prev,
        pushEnabled: userProfile.notificationSettings.pushEnabled,
        emailEnabled: userProfile.notificationSettings.emailEnabled,
        newEventsNearby: userProfile.notificationSettings.newEventsNearby,
        eventReminders: userProfile.notificationSettings.eventReminders,
        eventUpdates: userProfile.notificationSettings.eventUpdates,
        friendActivity: userProfile.notificationSettings.friendActivity,
        weeklyDigest: userProfile.notificationSettings.weeklyDigest,
        profileVisibility: userProfile.privacySettings.profileVisibility,
        showEmail: userProfile.privacySettings.showEmail,
        showLocation: userProfile.privacySettings.showLocation,
        showAttendingEvents: userProfile.privacySettings.showAttendingEvents,
      }));
    } else {
      setCurrentUserProfile(null);
    }
  }, [userProfile]);

  // Network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // App state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // FCM/Expo Push token
  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  // Unread notification count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    setAppState(nextAppState);
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      refreshUserData();
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        setCurrentUserProfile(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);

    // If user is logged in, sync to Supabase
    if (user) {
      try {
        await api.users.updateProfile({
          notificationSettings: {
            pushEnabled: updated.pushEnabled,
            emailEnabled: updated.emailEnabled,
            newEventsNearby: updated.newEventsNearby,
            eventReminders: updated.eventReminders,
            eventUpdates: updated.eventUpdates,
            friendActivity: updated.friendActivity,
            weeklyDigest: updated.weeklyDigest,
          },
          privacySettings: {
            profileVisibility: updated.profileVisibility,
            showEmail: updated.showEmail,
            showLocation: updated.showLocation,
            showAttendingEvents: updated.showAttendingEvents,
          },
        } as any);
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    }
  }, [settings, user]);

  const refreshUserData = useCallback(async () => {
    if (user) {
      await refreshProfile();
      await fetchUnreadCount();
    }
  }, [user, refreshProfile]);

  const fetchUnreadCount = async () => {
    try {
      const count = await api.notifications.getUnreadCount();
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const getExpoPushToken = async (): Promise<string | null> => {
    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setFcmToken(token);

      // Save to Supabase
      if (user) {
        await api.users.updateProfile({ fcmToken: token } as any);
      }
      return token;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
    }
    return null;
  };

  const registerForPushNotifications = useCallback(async () => {
    return getExpoPushToken();
  }, [user]);

  const handleNotificationOpen = useCallback((notification: any) => {
    // Handle notification tap
    const data = notification.data;
    if (data?.eventId) {
      // Navigate to event
      console.log('Navigate to event:', data.eventId);
    }
  }, []);

  const handleDeepLink = useCallback((url: string) => {
    // Handle deep links
    console.log('Deep link:', url);
    // Navigation logic would go here
  }, []);

  const value: AppContextType = {
    isOnline,
    appState,
    isBackground: appState === 'background',
    currentUserProfile,
    unreadNotificationCount,
    fcmToken,
    settings,
    updateSettings,
    refreshUserData,
    registerForPushNotifications,
    handleNotificationOpen,
    handleDeepLink,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppProvider;