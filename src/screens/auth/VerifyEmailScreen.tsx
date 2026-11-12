// =============================================================================
// COMMUNITY EVENTS APP - VERIFY EMAIL SCREEN
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, ScreenRouteProp } from '@/navigation/types';
import type { RootStackParamList } from '@/navigation/types';

export const VerifyEmailScreen = () => {
  const { user, verifyEmail, refreshProfile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>>();
  const route = useRoute<ScreenRouteProp<RootStackParamList, 'auth/verify-email'>>();
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const email = route.params?.email || user?.email || '';

  // Check verification status periodically
  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        await refreshProfile();
        if (user.emailVerified) {
          setVerified(true);
        }
      }
    };

    const interval = setInterval(checkVerification, 5000);
    checkVerification(); // Check immediately

    return () => clearInterval(interval);
  }, [user, refreshProfile]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await verifyEmail();
      Alert.alert('Email Sent', 'A new verification email has been sent to your inbox.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('(app)', undefined);
  };

  if (verified) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <Text style={[styles.successIcon, { color: colors.success }]}>✅</Text>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Email Verified!</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            Your email has been verified. Welcome to Community Events!
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        {/* Icon */}
        <Text style={styles.icon}>📧</Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Verify Your Email</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          We've sent a verification email to <Text style={{ fontWeight: '600' }}>{email}</Text>.
          Please check your inbox and click the link to verify your account.
        </Text>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { color: colors.primary }]}>1</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>Check your email inbox</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { color: colors.primary }]}>2</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>Click the verification link</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { color: colors.primary }]}>3</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>Return here to continue</Text>
          </View>
        </View>

        {/* Resend Button */}
        <TouchableOpacity
          style={[styles.resendButton, { borderColor: colors.primary }]}
          onPress={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.resendButtonText, { color: colors.primary }]}>Resend Email</Text>
          )}
        </TouchableOpacity>

        {/* Change Email */}
        <TouchableOpacity style={styles.changeEmailContainer}>
          <Text style={[styles.changeEmailText, { color: colors.textSecondary }]}>Wrong email? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.changeEmailLink, { color: colors.primary }]}>Change Email</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity style={styles.helpContainer}>
          <Text style={[styles.helpText, { color: colors.textTertiary }]}>Not receiving the email? </Text>
          <TouchableOpacity onPress={() => Alert.alert('Help', 'Check your spam folder or contact support@communityevents.app')}>
            <Text style={[styles.helpLink, { color: colors.primary }]}>Get Help</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    marginVertical: 32,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
  },
  resendButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeEmailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeEmailText: {
    fontSize: 14,
  },
  changeEmailLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  helpText: {
    fontSize: 14,
  },
  helpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VerifyEmailScreen;