// =============================================================================
// COMMUNITY EVENTS APP - FORGOT PASSWORD SCREEN
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
import type { NativeStackNavigationProp } from '@/navigation/types';
import type { RootStackParamList } from '@/navigation/types';
import { REGEX } from '@/constants';

export const ForgotPasswordScreen = () => {
  const { resetPassword, loading: authLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>>();
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { values, errors, handleChange, handleBlur, setFieldError, validate } = useForm({
    email: '',
  });

  const handleSubmit = async () => {
    const isValid = validate({
      email: (value) => !value ? 'Email is required' : !REGEX.EMAIL.test(value) ? 'Invalid email format' : undefined,
    });

    if (!isValid) return;

    setLoading(true);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (error: any) {
      let message = 'Failed to send reset email. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          setFieldError('email', message);
          break;
        case 'auth/invalid-email':
          message = 'Invalid email format.';
          setFieldError('email', message);
          break;
        case 'auth/too-many-requests':
          message = 'Too many requests. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>← Back</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.primary }]}>🔐</Text>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Community Events</Text>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          {sent ? (
            <>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Check Your Email</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                We've sent a password reset link to <Text style={{ fontWeight: '600' }}>{values.email}</Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your email and we'll send you a link to reset your password
              </Text>
            </>
          )}
        </View>

        {!sent && (
          <>
            {/* Form */}
            <View style={styles.formContainer}>
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
                  returnKeyType="go"
                  textContentType="emailAddress"
                  editable={!loading}
                  onSubmitEditing={handleSubmit}
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
                )}
              </View>

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
                  <Text style={styles.submitButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {sent && (
          <View style={styles.successContainer}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('auth/login', undefined)}
            >
              <Text style={styles.submitButtonText}>Back to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendContainer} onPress={() => setSent(false)}>
              <Text style={[styles.resendText, { color: colors.primary }]}>Didn't receive it? Resend</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={[styles.helpText, { color: colors.textTertiary }]}>Need help? </Text>
          <TouchableOpacity>
            <Text style={[styles.helpLink, { color: colors.primary }]}>Contact Support</Text>
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
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 16,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 24,
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
  successContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendContainer: {
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  helpText: {
    fontSize: 14,
  },
  helpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;