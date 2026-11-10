import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { DateTimePickerAndroid, DateTimePickerIOS } from '@react-native-community/datetimepicker';

// ============================================
// Types
// ============================================

export interface DateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  showIcon?: boolean;
  iconName?: string;
  placeholder?: string;
  format?: (date: Date) => string;
}

// ============================================
// Date Time Picker Component
// ============================================

export function DateTimePicker({
  label,
  value,
  onChange,
  mode = 'datetime',
  minDate,
  maxDate,
  style,
  containerStyle,
  buttonStyle,
  textStyle,
  error,
  helperText,
  disabled = false,
  showIcon = true,
  iconName = 'calendar-outline',
  placeholder = 'Select date & time',
  format,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<any>(null);

  // Default formatting
  const defaultFormat = (date: Date): string => {
    if (mode === 'date') {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (mode === 'time') {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return (
      date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) +
      ', ' +
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    );
  };

  const formattedValue = format ? format(value) : defaultFormat(value);

  // Handle date change from native picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onChange(selectedDate);
    }
    setShowPicker(false);
  };

  // Render native picker based on platform
  const renderNativePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <DateTimePickerIOS
          ref={pickerRef}
          value={value}
          onChange={handleDateChange}
          mode={mode}
          minimumDate={minDate}
          maximumDate={maxDate}
          display="inline"
          locale="en-US"
        />
      );
    }

    return (
      <DateTimePickerAndroid
        ref={pickerRef}
        value={value}
        onChange={handleDateChange}
        mode={mode}
        minDate={minDate?.getTime()}
        maxDate={maxDate?.getTime()}
        display="spinner"
      />
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
          error && styles.buttonError,
          buttonStyle,
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {showIcon && (
          <Ionicons
            name={iconName}
            size={22}
            color={disabled ? '#999999' : error ? '#E71D36' : '#2EC4B6'}
            style={styles.icon}
          />
        )}
        <Text style={[styles.buttonText, textStyle]}>{formattedValue || placeholder}</Text>
        <Ionicons
          name="chevron-down-outline"
          size={22}
          color="#999999"
          style={styles.chevron}
        />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close-outline" size={26} color="#333333" />
              </TouchableOpacity>
            </View>
            {renderNativePicker()}
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.pickerCancel}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerConfirm}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.pickerConfirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

// ============================================
// Calendar Event Picker (for adding to device calendar)
// ============================================

export interface CalendarEventPickerProps {
  onAddToCalendar: (event: Calendar.Event) => Promise<void>;
  disabled?: boolean;
  style?: ViewStyle;
}

export function CalendarEventPicker({ onAddToCalendar, disabled = false, style }: CalendarEventPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.calendarButton, style]}
      onPress={() => !disabled && setShowPicker(true)}
      disabled={disabled}
    >
      <Ionicons name="calendar-plus-outline" size={22} color="#2EC4B6" />
      <Text style={styles.calendarButtonText}>Add to Calendar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  buttonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  buttonError: {
    borderColor: '#E71D36',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  chevron: {
    marginLeft: 10,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pickerCancel: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#666666',
  },
  pickerConfirm: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2EC4B6',
    borderRadius: 8,
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calendarButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2EC4B6',
  },
});

export default DateTimePicker;