import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventType } from '@/types';

// ============================================
// Types
// ============================================

interface EventTypeOption {
  value: EventType;
  label: string;
  icon: string;
  color: string;
}

interface EventTypeSelectorProps {
  value: EventType;
  onChange: (value: EventType) => void;
  options?: EventTypeOption[];
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  selectedOptionStyle?: ViewStyle;
  textStyle?: TextStyle;
  selectedTextStyle?: TextStyle;
  disabled?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
}

// ============================================
// Default Options
// ============================================

const DEFAULT_OPTIONS: EventTypeOption[] = [
  { value: 'parade', label: 'Parade', icon: 'musical-notes-outline', color: '#FF6B35' },
  { value: 'trick_or_treat', label: 'Trick-Or-Treat', icon: 'leaf-outline', color: '#FF9F1C' },
  { value: 'special_event', label: 'Special Event', icon: 'sparkles-outline', color: '#2EC4B6' },
];

// ============================================
// Event Type Selector Component
// ============================================

export function EventTypeSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  style,
  containerStyle,
  optionStyle,
  selectedOptionStyle,
  textStyle,
  selectedTextStyle,
  disabled = false,
  label,
  error,
  helperText,
}: EventTypeSelectorProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.optionsContainer, style]}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                isSelected && { borderColor: option.color },
                optionStyle,
                isSelected && selectedOptionStyle,
              ]}
              onPress={() => !disabled && onChange(option.value)}
              disabled={disabled}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && { backgroundColor: option.color },
                  !isSelected && { borderColor: option.color },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={isSelected ? '#FFFFFF' : option.color}
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                  isSelected && { color: option.color },
                  textStyle,
                  isSelected && selectedTextStyle,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    gap: 8,
  },
  optionSelected: {
    backgroundColor: 'rgba(46, 196, 182, 0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#E71D36',
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
  },
});

export default EventTypeSelector;