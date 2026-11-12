import React, { forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface InputProps extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value' | 'onBlur' | 'onFocus'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
}

export const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      secureTextEntry = false,
      showPasswordToggle = false,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      helperStyle,
      value = '',
      onChangeText,
      onBlur,
      onFocus,
      ...props
    },
    ref
  ) => {
    const [isSecure, setIsSecure] = React.useState(secureTextEntry);
    const [focused, setFocused] = React.useState(false);
    const [touched, setTouched] = React.useState(false);

    const hasError = error && touched;

    const containerStyles: ViewStyle = {
      width: '100%',
      marginBottom: 16,
      ...containerStyle,
    };

    const inputContainerStyles: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: hasError ? '#E71D36' : focused ? '#2EC4B6' : '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 12,
      ...(focused && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
    };

    const labelStyles: TextStyle = {
      fontSize: 14,
      fontWeight: '500',
      color: '#333333',
      marginBottom: 6,
      ...labelStyle,
    };

    const inputStyles: TextStyle = {
      flex: 1,
      fontSize: 16,
      color: '#333333',
      paddingVertical: 14,
      ...inputStyle,
    };

    const handleBlur = (e: any) => {
      setFocused(false);
      setTouched(true);
      onBlur?.(e);
    };

    const handleFocus = (e: any) => {
      setFocused(true);
      onFocus?.(e);
    };

    const togglePasswordVisibility = () => {
      setIsSecure(!isSecure);
    };

    return (
      <View style={containerStyles}>
        {label && <Text style={labelStyles}>{label}</Text>}
        <View style={inputContainerStyles}>
          {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            secureTextEntry={isSecure}
            style={inputStyles}
            placeholderTextColor="#999999"
            {...props}
          />
          {showPasswordToggle && (
            <TouchableOpacity onPress={togglePasswordVisibility} style={{ padding: 4 }}>
              <Ionicons
                name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#999999"
              />
            </TouchableOpacity>
          )}
          {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
        </View>
        {hasError && (
          <Text style={[{ fontSize: 12, color: '#E71D36', marginTop: 4 }, errorStyle]}>{error}</Text>
        )}
        {!hasError && helperText && (
          <Text style={[{ fontSize: 12, color: '#999999', marginTop: 4 }, helperStyle]}>{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;