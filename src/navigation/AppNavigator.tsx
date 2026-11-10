// =============================================================================
// COMMUNITY EVENTS APP - MAIN NAVIGATOR
// =============================================================================

import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { RootStackParamList, TabParamList, DeepLinkConfig } from './types';

// Import screens
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { ModalStack } from './ModalStack';
import { OnboardingStack } from './OnboardingStack';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// -----------------------------------------------------------------------------
// THEMES
// -----------------------------------------------------------------------------
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4285F4',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#202124',
    border: '#DADCE0',
    notification: '#EA4335',
  },
};

const DarkThemeCustom = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#8AB4F8',
    background: '#202124',
    card: '#292A2D',
    text: '#E8EAED',
    border: '#3C4043',
    notification: '#F28B82',
  },
};

// -----------------------------------------------------------------------------
// STACK NAVIGATORS
// -----------------------------------------------------------------------------
const RootStack = createNativeStackNavigator<RootStackParamList>();
const TabNavigator = createBottomTabNavigator<TabParamList>();
const DrawerNavigator = createDrawerNavigator<RootStackParamList>();

// -----------------------------------------------------------------------------
// AUTH STACK
// -----------------------------------------------------------------------------
export const AuthStack = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <RootStack.Screen name="auth/login" component={require('@/screens/auth/LoginScreen').LoginScreen} />
      <RootStack.Screen name="auth/register" component={require('@/screens/auth/RegisterScreen').RegisterScreen} />
      <RootStack.Screen name="auth/forgot-password" component={require('@/screens/auth/ForgotPasswordScreen').ForgotPasswordScreen} />
      <RootStack.Screen name="auth/verify-email" component={require('@/screens/auth/VerifyEmailScreen').VerifyEmailScreen} />
    </RootStack.Navigator>
  );
};

// -----------------------------------------------------------------------------
// APP TABS
// -----------------------------------------------------------------------------
export const AppTabs = () => {
  const { colors, isDark } = useTheme();
  const { unreadNotificationCount } = useApp();

  return (
    <TabNavigator.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarItemStyle: { paddingVertical: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      })}
    >
      <TabNavigator.Screen
        name="home"
        component={require('@/screens/events/EventsListScreen').EventsListScreen}
        options={{
          title: 'Events',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="calendar" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <TabNavigator.Screen
        name="map"
        component={require('@/screens/map/MapScreen').MapScreen}
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="map" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <TabNavigator.Screen
        name="search"
        component={require('@/screens/search/SearchScreen').SearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="search" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <TabNavigator.Screen
        name="saved"
        component={require('@/screens/saved/SavedEventsScreen').SavedEventsScreen}
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="bookmark" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <TabNavigator.Screen
        name="profile"
        component={require('@/screens/profile/ProfileScreen').ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="person" focused={focused} color={color} size={size} badge={unreadNotificationCount} />
          ),
        }}
      />
    </TabNavigator.Navigator>
  );
};

// Tab icon component
const TabIcon: React.FC<{ name: string; focused: boolean; color: string; size: number; badge?: number }> = ({
  name,
  focused,
  color,
  size,
  badge,
}) => {
  const { colors } = useTheme();
  // In a real app, you'd use a proper icon library like @expo/vector-icons
  // This is a placeholder
  return (
    <React.View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <React.Text style={{ fontSize: size * 0.8, color }}>{name}</React.Text>
      {badge && badge > 0 && (
        <React.View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.error,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <React.Text style={{ color: colors.errorText, fontSize: 10, fontWeight: 'bold' }}>
            {badge > 99 ? '99+' : badge}
          </React.Text>
        </React.View>
      )}
    </React.View>
  );
};

// -----------------------------------------------------------------------------
// MODAL STACK
// -----------------------------------------------------------------------------
export const ModalStack = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        presentation: 'modal',
        animation: 'slide_from_bottom',
        headerShown: false,
        cardOverlayEnabled: true,
        cardStyle: { backgroundColor: 'transparent' },
      }}
      mode="modal"
    >
      <RootStack.Screen name="modal/event-details" component={require('@/screens/modals/EventDetailsModal').EventDetailsModal} />
      <RootStack.Screen name="modal/rsvp" component={require('@/screens/modals/RSVPModal').RSVPModal} />
      <RootStack.Screen name="modal/share" component={require('@/screens/modals/ShareModal').ShareModal} />
      <RootStack.Screen name="modal/report" component={require('@/screens/modals/ReportModal').ReportModal} />
      <RootStack.Screen name="modal/filter" component={require('@/screens/modals/FilterModal').FilterModal} />
      <RootStack.Screen name="modal/calendar-sync" component={require('@/screens/modals/CalendarSyncModal').CalendarSyncModal} />
      <RootStack.Screen name="modal/image-picker" component={require('@/screens/modals/ImagePickerModal').ImagePickerModal} />
      <RootStack.Screen name="modal/location-picker" component={require('@/screens/modals/LocationPickerModal').LocationPickerModal} />
    </RootStack.Navigator>
  );
};

// -----------------------------------------------------------------------------
// ONBOARDING STACK
// -----------------------------------------------------------------------------
export const OnboardingStack = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <RootStack.Screen name="onboarding/welcome" component={require('@/screens/onboarding/WelcomeScreen').WelcomeScreen} />
      <RootStack.Screen name="onboarding/permissions" component={require('@/screens/onboarding/PermissionsScreen').PermissionsScreen} />
      <RootStack.Screen name="onboarding/interests" component={require('@/screens/onboarding/InterestsScreen').InterestsScreen} />
      <RootStack.Screen name="onboarding/complete" component={require('@/screens/onboarding/CompleteScreen').CompleteScreen} />
    </RootStack.Navigator>
  );
};

// -----------------------------------------------------------------------------
// MAIN APP NAVIGATOR
// =============================================================================

export const AppNavigator = () => {
  const { user, initializing, userProfile } = useAuth();
  const { isDark, colors } = useTheme();
  const { handleDeepLink } = useApp();

  // Handle deep links
  useEffect(() => {
    const handleLink = (url: string) => {
      handleDeepLink(url);
    };

    // Initial URL
    Linking.getInitialURL().then(url => {
      if (url) handleLink(url);
    });

    // Listener
    const subscription = Linking.addEventListener('url', ({ url }) => handleLink(url));
    return () => subscription.remove();
  }, [handleDeepLink]);

  // Show loading while initializing
  if (initializing) {
    return <LoadingScreen />;
  }

  // Determine theme
  const theme = isDark ? DarkThemeCustom : LightTheme;

  return (
    <ErrorBoundary>
      <NavigationContainer
        theme={theme}
        linking={DeepLinkConfig}
        onReady={() => console.log('Navigation ready')}
      >
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade',
          }}
        >
          {/* Auth Flow */}
          {!user && (
            <RootStack.Screen
              name="(auth)"
              component={AuthStack}
              options={{ animation: 'fade' }}
            />
          )}

          {/* Onboarding Flow */}
          {!userProfile?.onboardingComplete && user && (
            <RootStack.Screen name="onboarding" component={OnboardingStack} />
          )}

          {/* Main App Flow */}
          {user && userProfile?.onboardingComplete && (
            <>
              <RootStack.Screen
                name="(app)"
                component={AppTabs}
                options={{ gestureEnabled: false }}
              />
              <RootStack.Screen name="modal" component={ModalStack} />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default AppNavigator;