// =============================================================================
// COMMUNITY EVENTS APP - WELCOME SCREEN (Placeholder)
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export const WelcomeScreen = ({ onNext }: { onNext: () => void }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Welcome to AroundTown
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Discover community events near you
      </Text>
      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onNext}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});