// =============================================================================
// COMMUNITY EVENTS APP - CONFIG ERROR SCREEN
// =============================================================================
// Standalone component for showing configuration errors without theme/context dependencies

import React from 'react';
import { View, Text, StyleSheet, Button, Linking, Platform } from 'react-native';

interface ConfigErrorScreenProps {
  error: Error;
  onRetry: () => void;
}

export const ConfigErrorScreen: React.FC<ConfigErrorScreenProps> = ({ error, onRetry }) => {
  const openEnvFile = () => {
    // This is just for reference - user needs to edit their .env.development file
    console.log('Please edit .env.development with your Supabase credentials');
  };

  const handleRetry = () => {
    // In React Native, we can't programmatically reload easily
    // User needs to manually reload (Cmd+R on iOS Simulator, Shake → Reload on device)
    console.log('Please reload the app after updating .env.development');
    onRetry();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚙️</Text>
        <Text style={styles.title}>Configuration Required</Text>
        <Text style={styles.message}>
          The app needs Supabase credentials to connect to the backend.
        </Text>

        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>To fix this:</Text>
          <Text style={styles.instructionText}>
            1. Open your Supabase Dashboard at supabase.com
          </Text>
          <Text style={styles.instructionText}>
            2. Go to Settings → API
          </Text>
          <Text style={styles.instructionText}>
            3. Copy your Project URL and anon/public key
          </Text>
          <Text style={styles.instructionText}>
            4. Edit .env.development in the project root
          </Text>
          <Text style={styles.instructionText}>
            5. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
          </Text>
          <Text style={styles.instructionText}>
            6. Restart the app (Cmd+R or shake device → Reload)
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Retry Connection" onPress={onRetry} color="#4285F4" />
          <Button title="Open Supabase Dashboard" onPress={() => Linking.openURL('https://supabase.com/dashboard')} color="#34A853" />
        </View>

        {__DEV__ && (
          <View style={styles.devInfo}>
            <Text style={styles.devText}>Development Mode</Text>
            <Text style={styles.devText}>
              File: .env.development
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#202124',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: '#5F6368',
  },
  errorBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FCE8E6',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EA4335',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#D93025',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#D93025',
  },
  instructions: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1A73E8',
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
    color: '#1A73E8',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  devInfo: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
  },
  devText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#5F6368',
    marginBottom: 2,
  },
});

export default ConfigErrorScreen;