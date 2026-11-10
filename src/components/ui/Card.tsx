import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevation?: number;
  padding?: number;
  borderRadius?: number;
  backgroundColor?: string;
  onPress?: () => void;
}

export function Card({
  children,
  style,
  elevation = 2,
  padding = 16,
  borderRadius = 12,
  backgroundColor = '#FFFFFF',
  onPress,
}: CardProps) {
  const containerStyle: ViewStyle = {
    backgroundColor,
    borderRadius,
    padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: 0.1,
    shadowRadius: elevation * 2,
    elevation,
    ...style,
  };

  const content = <View style={containerStyle}>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return content;
}

import { TouchableOpacity } from 'react-native';

export interface CardSectionProps {
  children: ReactNode;
  style?: ViewStyle;
  divider?: boolean;
}

export function CardSection({ children, style, divider = false }: CardSectionProps) {
  return (
    <View style={[{ paddingVertical: 8 }, style]}>
      {children}
      {divider && <View style={styles.divider} />}
    </View>
  );
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ title, subtitle, action, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: -16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
});

export default Card;