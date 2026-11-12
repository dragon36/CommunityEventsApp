// =============================================================================
// COMMUNITY EVENTS APP - APP CONTENT (Inner App)
// =============================================================================
// This component is rendered inside AuthProvider so it can access auth context

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';

// Inner component that has access to auth context
const AppInnerContent: React.FC = () => {
  const { configError, initializing } = useAuth();

  // Show config error screen if Supabase is not configured
  if (configError) {
    return (
      <ConfigErrorScreen
        error={configError}
        onRetry={() => {
          // In React Native, user must manually reload after updating .env
          // Cmd+R on iOS Simulator, or Shake device → Reload
          console.log('Please reload the app after updating .env.development');
        }}
      />
    );
  }

  // Show loading while initializing
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#5F6368',
  },
});

export { AppInnerContent };