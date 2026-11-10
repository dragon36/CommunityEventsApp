import React, { forwardRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import type { TouchableOpacityProps, TextStyle, ViewStyle } from 'react-native';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children' | 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonProps['variant'], ViewStyle> = {
  primary: {
    backgroundColor: '#2EC4B6',
  },
  secondary: {
    backgroundColor: '#FF6B35',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2EC4B6',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#E71D36',
  },
};

const sizeStyles: Record<ButtonProps['size'], { paddingVertical: number; paddingHorizontal: number; borderRadius: number }> = {
  small: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  medium: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  large: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 10 },
};

const textVariantStyles: Record<ButtonProps['variant'], TextStyle> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: '#FFFFFF' },
  outline: { color: '#2EC4B6' },
  ghost: { color: '#2EC4B6' },
  danger: { color: '#FFFFFF' },
};

const textSizeStyles: Record<ButtonProps['size'], TextStyle> = {
  small: { fontSize: 14, fontWeight: '600' },
  medium: { fontSize: 16, fontWeight: '600' },
  large: { fontSize: 18, fontWeight: '700' },
};

export const Button = forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      style,
      textStyle,
      onPress,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseButtonStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: isDisabled ? 0.6 : 1,
    };

    const baseTextStyle: TextStyle = {
      ...textSizeStyles[size],
      ...textVariantStyles[variant],
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          baseButtonStyle,
          fullWidth && { width: '100%' },
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? '#2EC4B6' : '#FFFFFF'}
          />
        ) : (
          <>
            {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
            <Text style={[baseTextStyle, textStyle]}>{title}</Text>
            {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

export default Button;