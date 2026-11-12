// =============================================================================
// COMMUNITY EVENTS APP - FILTER MODAL (Placeholder)
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal = ({ visible, onClose }: FilterModalProps) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
      <View style={[styles.modal, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Filter Events
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Filter functionality coming soon
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
});