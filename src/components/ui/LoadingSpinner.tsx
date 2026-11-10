import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text, ViewStyle } from 'react-native';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
  fullScreen?: boolean;
  overlay?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = '#2EC4B6',
  text,
  style,
  fullScreen = false,
  overlay = false,
}: LoadingSpinnerProps) {
  const spinnerStyle = {
    ...styles.container,
    ...(fullScreen && styles.fullScreen),
    ...(overlay && styles.overlay),
    ...style,
  };

  return (
    <View style={spinnerStyle}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

export function LoadingOverlay({ visible, text = 'Loading...' }: { visible: boolean; text?: string }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color="#2EC4B6" />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

export function SkeletonLoader({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  skeleton: {
    backgroundColor: '#F0F0F0',
  },
});

export default LoadingSpinner;