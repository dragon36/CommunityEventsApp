// =============================================================================
// COMMUNITY EVENTS APP - REGISTER SCREEN
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { REGEX } from '@/constants';

export const RegisterScreen = () => {
  const { signUp, loading: authLoading } = useAuth();
  const navigation = useNavigation();
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(false);

  const { values, errors, handleChange, handleBlur, setFieldError, validate } = useForm({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const isValid = validate({
      displayName: (value) => !value ? 'Display name is required' : value.length < 2 ? 'Name must be at least 2 characters' : undefined,
      email: (value) => !value ? 'Email is required' : !REGEX.EMAIL.test(value) ? 'Invalid email format' : undefined,
      password: (value) => !value ? 'Password is required' : value.length < 8 ? 'Password must be at least 8 characters' : undefined,
      confirmPassword: (value) => !value ? 'Please confirm your password' : value !== values.password ? 'Passwords do not match' : undefined,
    });
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp(values.email, values.password, values.displayName);
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('auth/login') }]
      );
    } catch (error: any) {
      let message = 'Registration failed. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists.';
          setFieldError('email', message);
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Please use at least 8 characters.';
          setFieldError('password', message);
          break;
        case 'auth/invalid-email':
          message = 'Invalid email format.';
          setFieldError('email', message);
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
      }
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('auth/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.primary }]}>📅</Text>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Community Events</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Discover events near you</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Join the community</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Display Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
              value={values.displayName}
              onChangeText={handleChange('displayName')}
              onBlur={handleBlur('displayName')}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              textContentType="name"
              editable={!loading}
            />
            {errors.displayName && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.displayName}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              textContentType="emailAddress"
              editable={!loading}
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="Create a password (min 8 chars)"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
              textContentType="newPassword"
              editable={!loading}
            />
            {errors.password && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Confirm Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="go"
              textContentType="newPassword"
              editable={!loading}
              onSubmitEditing={handleSubmit}
            />
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Terms */}
          <TouchableOpacity style={styles.termsContainer} onPress={() => Alert.alert('Terms of Service', 'By creating an account, you agree to our Terms of Service and Privacy Policy.')}>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              By creating an account, you agree to our{' '}
              <Text style={{ color: colors.primary }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || authLoading}
            activeOpacity={0.8}
          >
            {loading || authLoading ? (
              <ActivityIndicator color={colors.primaryText} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={handleGoToLogin}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 60,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    color: '#202124',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
  },
  termsContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;