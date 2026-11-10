// =============================================================================
// COMMUNITY EVENTS APP - LOADING SCREEN
// =============================================================================

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { APP_CONFIG } from '@/constants';

export const LoadingScreen = () => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{APP_CONFIG.name}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Loading...</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginTop: spacing.md,
  },
});

export default LoadingScreen;