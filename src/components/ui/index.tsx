// =============================================================================
// COMMUNITY EVENTS APP - UI COMPONENTS
// =============================================================================

import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, BorderRadius, Shadows, Typography } from '@/context/ThemeContext';

// -----------------------------------------------------------------------------
// STYLES (moved to top to avoid "used before declaration" errors)
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  // Button
  button: {
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
  buttonMd: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 48 },
  buttonLg: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 56 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600', textAlign: 'center' },
  textSm: { fontSize: 13 },
  textMd: { fontSize: 15 },
  textLg: { fontSize: 17 },
  spinner: { marginHorizontal: 8 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },

  // Button Variants
  buttonPrimary: { backgroundColor: '#4285F4' },
  buttonSecondary: { backgroundColor: '#34A853' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4285F4' },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDanger: { backgroundColor: '#EA4335' },

  textPrimary: { color: '#FFFFFF' },
  textSecondary: { color: '#FFFFFF' },
  textOutline: { color: '#4285F4' },
  textGhost: { color: '#4285F4' },
  textDanger: { color: '#FFFFFF' },

  // Input
  inputContainer: { width: '100%' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: { borderWidth: 2 },
  input: { flex: 1, height: 52, paddingHorizontal: 16, fontSize: 16 },
  inputIconLeft: { paddingLeft: 16 },
  inputIconRight: { paddingRight: 16 },
  errorText: { marginTop: 6, fontSize: 12 },
  helperText: { marginTop: 6, fontSize: 12 },

  // Card
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  // Avatar
  avatar: {
    borderRadius: 9999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { borderRadius: 9999 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontWeight: '600' },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center' },

  // Divider
  divider: { height: 1, marginVertical: 8 },
  dividerWithLabel: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { paddingHorizontal: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  // Icon Button
  iconButton: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDisabled: { opacity: 0.4 },
});

// Style lookup objects (defined after styles)
const sizeStyles = {
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
};

const sizeTextStyles = {
  sm: styles.textSm,
  md: styles.textMd,
  lg: styles.textLg,
};

const variantStyles = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  outline: styles.buttonOutline,
  ghost: styles.buttonGhost,
  danger: styles.buttonDanger,
};

const variantTextStyles = {
  primary: styles.textPrimary,
  secondary: styles.textSecondary,
  outline: styles.textOutline,
  ghost: styles.textGhost,
  danger: styles.textDanger,
};

// -----------------------------------------------------------------------------
// BUTTON
// -----------------------------------------------------------------------------
export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      style,
      onPress,
      ...props
    },
    ref
  ) => {
    const { colors, spacing, typography, shadows } = useTheme();

    const isDisabled = disabled || loading;

    const baseStyles = [
      styles.button,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      style,
    ];

    const textStyles = [
      styles.text,
      sizeTextStyles[size],
      variantTextStyles[variant],
    ];

    const content = (
      <>
        {loading ? (
          <ActivityIndicator
            size={size === 'sm' ? 'small' : 'large'}
            color={variant === 'primary' || variant === 'danger' ? colors.primaryText : colors.primary}
            style={styles.spinner}
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={textStyles}>{children}</Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </>
    );

    return (
      <TouchableOpacity
        ref={ref}
        style={baseStyles}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

// -----------------------------------------------------------------------------
// INPUT
// -----------------------------------------------------------------------------
export interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
  inputStyle?: any;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      style,
      ...props
    },
    ref
  ) => {
    const { colors, spacing, typography } = useTheme();

    return (
      <View style={[styles.inputContainer, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            error ? styles.inputWrapperError : null,
            { borderColor: error ? colors.error : colors.border },
          ]}
        >
          {leftIcon && <View style={styles.inputIconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              { color: colors.textPrimary, placeholderTextColor: colors.textTertiary },
              inputStyle,
              style,
            ]}
            {...props}
          />
          {rightIcon && <View style={styles.inputIconRight}>{rightIcon}</View>}
        </View>
        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
        {helperText && !error && <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

// -----------------------------------------------------------------------------
// CARD
// -----------------------------------------------------------------------------
export interface CardProps {
  children: React.ReactNode;
  style?: any;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'md',
  onPress,
  activeOpacity = 0.8,
}) => {
  const { colors, shadows } = useTheme();

  const shadowStyle = elevation === 'none' ? shadows.none : shadows[elevation];

  const isPressable = !!onPress;
  const Component = isPressable ? Pressable : View;

  const pressableProps = isPressable
    ? {
        onPress,
        android_ripple: { color: colors.primaryLight },
        activeOpacity,
      }
    : {};

  return (
    <Component
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        shadowStyle,
        style,
      ]}
      {...pressableProps}
    >
      {children}
    </Component>
  );
};

// -----------------------------------------------------------------------------
// AVATAR
// -----------------------------------------------------------------------------
export interface AvatarProps {
  source?: { uri: string } | number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  style?: any;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'md',
  name,
  style,
}) => {
  const { colors, spacing } = useTheme();

  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const diameter = sizeMap[size];
  const fontSize = diameter * 0.4;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const bgColor = name
    ? `hsl(${name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360}, 70%, 50%)`
    : colors.primary;

  return (
    <View style={[styles.avatar, { width: diameter, height: diameter }, style]}>
      {source ? (
        <Image
          source={source}
          style={[{ width: diameter, height: diameter, borderRadius: diameter / 2 }, styles.avatarImage]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: bgColor }]}>
          <Text style={[styles.avatarText, { fontSize, color: colors.primaryText }]}>
            {name ? getInitials(name) : '?'}
          </Text>
        </View>
      )}
    </View>
  );
};

// -----------------------------------------------------------------------------
// BADGE
// -----------------------------------------------------------------------------
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md', style }) => {
  const { colors } = useTheme();

  const variantStyles = {
    default: { backgroundColor: colors.backgroundTertiary, color: colors.textSecondary },
    primary: { backgroundColor: colors.primaryLight, color: colors.primary },
    secondary: { backgroundColor: colors.secondaryLight, color: colors.secondary },
    success: { backgroundColor: colors.success + '20', color: colors.success },
    warning: { backgroundColor: colors.warningLight, color: colors.warningDark },
    danger: { backgroundColor: colors.accentLight, color: colors.accent },
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontSize: 10 },
    md: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12 },
  };

  return (
    <View style={[styles.badge, sizeStyles[size], variantStyles[variant], style]}>
      <Text style={{ color: variantStyles[variant].color }}>{children}</Text>
    </View>
  );
};

// -----------------------------------------------------------------------------
// DIVIDER
// -----------------------------------------------------------------------------
export interface DividerProps {
  style?: any;
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ style, label }) => {
  const { colors } = useTheme();

  if (label) {
    return (
      <View style={[styles.dividerWithLabel, style]}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>{label}</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return <View style={[styles.divider, { backgroundColor: colors.border }, style]} />;
};

// -----------------------------------------------------------------------------
// SPINNER
// -----------------------------------------------------------------------------
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: any;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color, style }) => {
  const { colors } = useTheme();

  return (
    <ActivityIndicator
      size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : undefined}
      color={color || colors.primary}
      style={style}
    />
  );
};

// -----------------------------------------------------------------------------
// ICON BUTTON
// -----------------------------------------------------------------------------
export interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: any;
  accessibilityLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const { colors, spacing } = useTheme();

  const sizeMap = { sm: 36, md: 44, lg: 52 };
  const diameter = sizeMap[size];

  const variantStyles = {
    default: { backgroundColor: 'transparent' },
    primary: { backgroundColor: colors.primaryLight },
    danger: { backgroundColor: colors.accentLight },
  };

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { width: diameter, height: diameter },
        variantStyles[variant],
        disabled && styles.iconButtonDisabled,
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {icon}
    </TouchableOpacity>
  );
};

export default {
  Button,
  Input,
  Card,
  Avatar,
  Badge,
  Divider,
  Spinner,
  IconButton,
};