// =============================================================================
// COMMUNITY EVENTS APP - FORM COMPONENTS
// =============================================================================

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Switch, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Input, Button } from '@/components/ui';
import { Spacing, BorderRadius, Typography } from '@/context/ThemeContext';

// -----------------------------------------------------------------------------
// FORM FIELD WRAPPER
// -----------------------------------------------------------------------------
export interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required = false,
  children,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>
        {label} {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      {children}
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>}
    </View>
  );
};

// -----------------------------------------------------------------------------
// SELECT / DROPDOWN
// -----------------------------------------------------------------------------
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View style={[
        styles.selectWrapper,
        error ? styles.selectWrapperError : null,
        disabled ? styles.selectWrapperDisabled : null,
        { borderColor: error ? colors.error : colors.border },
      ]}>
        <Text style={[
          styles.selectText,
          value ? { color: colors.textPrimary } : { color: colors.textTertiary },
          disabled && { color: colors.textTertiary },
        ]}>
          {value ? options.find(o => o.value === value)?.label : placeholder}
        </Text>
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>}
    </View>
  );
};

// -----------------------------------------------------------------------------
// CHECKBOX
// -----------------------------------------------------------------------------
export interface CheckboxProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  style?: any;
  labelStyle?: any;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  style,
  labelStyle,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.checkboxContainer, style]}
      onPress={() => !disabled && onChange(!value)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View style={[
        styles.checkboxBox,
        value ? styles.checkboxChecked : null,
        disabled ? styles.checkboxDisabled : null,
        { backgroundColor: value ? colors.primary : 'transparent', borderColor: value ? colors.primary : colors.border },
      ]}>
        {value && <Text style={styles.checkboxCheck}>✓</Text>}
      </View>
      <Text style={[styles.checkboxLabel, { color: colors.textPrimary }, disabled ? styles.checkboxLabelDisabled : null, labelStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// -----------------------------------------------------------------------------
// SWITCH FIELD
// -----------------------------------------------------------------------------
export interface SwitchFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  style?: any;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  description,
  value,
  onChange,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.switchContainer, style]}>
      <View style={styles.switchLabelContainer}>
        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>{label}</Text>
        {description && <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.primary : colors.background}
      />
    </View>
  );
};

// -----------------------------------------------------------------------------
// TEXTAREA
// -----------------------------------------------------------------------------
export interface TextareaProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  disabled?: boolean;
  style?: any;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  value,
  onChangeText,
  placeholder = 'Enter text...',
  maxLength,
  minHeight = 100,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View style={[
        styles.textareaWrapper,
        error ? styles.textareaWrapperError : null,
        { borderColor: error ? colors.error : colors.border },
      ]}>
        <TextInput
          style={[styles.textarea, { color: colors.textPrimary, minHeight }, disabled ? styles.textareaDisabled : null]}
          value={value}
          onChangeText={disabled ? undefined : onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={maxLength}
          editable={!disabled}
        />
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>}
      {maxLength && !error && (
        <Text style={[styles.charCount, { color: colors.textTertiary }]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

// -----------------------------------------------------------------------------
// DATE/TIME PICKER FIELD
// -----------------------------------------------------------------------------
export interface DatePickerFieldProps {
  label?: string;
  error?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode?: 'date' | 'time' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  style?: any;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  error,
  value,
  onChange,
  mode = 'date',
  minDate,
  maxDate,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const { format } = require('date-fns');

  const formatDate = (date: Date) => {
    switch (mode) {
      case 'time': return format(date, 'h:mm a');
      case 'datetime': return format(date, 'MMM d, yyyy h:mm a');
      default: return format(date, 'MMM d, yyyy');
    }
  };

  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.datePickerWrapper,
          error ? styles.datePickerWrapperError : null,
          disabled ? styles.datePickerWrapperDisabled : null,
          { borderColor: error ? colors.error : colors.border },
        ]}
        onPress={() => !disabled && onChange(value)} // Would open date picker modal
        disabled={disabled}
      >
        <Text style={[
          styles.datePickerText,
          value ? { color: colors.textPrimary } : { color: colors.textTertiary },
          disabled ? { color: colors.textTertiary } : null,
        ]}>
          {value ? formatDate(value) : 'Select date'}
        </Text>
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  requiredStar: {
    color: '#EA4335',
  },
  errorText: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  helperText: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  // Select
  selectWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  selectWrapperError: { borderWidth: 2 },
  selectWrapperDisabled: { backgroundColor: '#F5F5F5' },
  selectText: { fontSize: 16 },
  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {},
  checkboxDisabled: { opacity: 0.5 },
  checkboxCheck: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16, flex: 1 },
  checkboxLabelDisabled: { color: '#9AA0A6' },
  // Switch
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  switchLabelContainer: { flex: 1 },
  switchLabel: { fontSize: 16, fontWeight: '500' },
  switchDescription: { fontSize: 13, marginTop: 2 },
  // Textarea
  textareaWrapper: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textareaWrapperError: { borderWidth: 2 },
  textarea: { fontSize: 16 },
  textareaDisabled: { backgroundColor: '#F5F5F5' },
  charCount: { textAlign: 'right', marginTop: 4, fontSize: 12 },
  // Date Picker
  datePickerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  datePickerWrapperError: { borderWidth: 2 },
  datePickerWrapperDisabled: { backgroundColor: '#F5F5F5' },
  datePickerText: { fontSize: 16 },
});

export default {
  FormField,
  Select,
  Checkbox,
  SwitchField,
  Textarea,
  DatePickerField,
};