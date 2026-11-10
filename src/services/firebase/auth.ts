import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile as firebaseUpdateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  User,
  UserCredential,
  Auth,
} from 'firebase/auth';
import { auth } from './config';
import { userService } from './firestore';
import type { RegisterFormData, LoginFormData, UpdateProfileFormData } from '@/types';

// ============================================
// Auth Service
// ============================================

export const authService = {
  // Register new user
  async register(data: RegisterFormData): Promise<UserCredential> {
    // Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    // Update profile with display name
    await firebaseUpdateProfile(userCredential.user, {
      displayName: data.displayName,
    });

    // Send email verification
    await sendEmailVerification(userCredential.user);

    // Create user profile in Firestore
    await userService.createUserProfile(userCredential.user.uid, {
      email: data.email,
      displayName: data.displayName,
    });

    return userCredential;
  },

  // Login user
  async login(data: LoginFormData): Promise<UserCredential> {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);

    // Update last login
    await userService.updateLastLogin(userCredential.user.uid);

    return userCredential;
  },

  // Logout user
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Send password reset email
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  // Verify password reset code
  async verifyResetCode(oobCode: string): Promise<string> {
    return await verifyPasswordResetCode(auth, oobCode);
  },

  // Confirm password reset
  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }
    await confirmPasswordReset(auth, oobCode, newPassword);
  },

  // Update user profile
  async updateProfile(data: UpdateProfileFormData): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const updates: { displayName?: string; photoURL?: string } = {};
    if (data.displayName) updates.displayName = data.displayName;
    if (data.photoURL) updates.photoURL = data.photoURL;

    if (Object.keys(updates).length > 0) {
      await firebaseUpdateProfile(user, updates);
    }

    // Update Firestore profile
    await userService.updateUserProfile(user.uid, {
      ...data,
      // notificationSettings is handled separately
    });
  },

  // Update email
  async updateEmail(newEmail: string, password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Re-authenticate for sensitive operation
    const credential = EmailAuthProvider.credential(user.email!, password);
    await reauthenticateWithCredential(user, credential);

    await updateEmail(user, newEmail);

    // Update Firestore
    await userService.updateUserProfile(user.uid, { email: newEmail });
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Re-authenticate for sensitive operation
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);
  },

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await sendEmailVerification(user);
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Check if user is admin (via custom claims)
  async checkAdminStatus(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims.admin === true;
    } catch {
      return false;
    }
  },

  // Refresh ID token (forces custom claims refresh)
  async refreshToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return await user.getIdToken(true);
  },
};

// ============================================
// Password Validation
// ============================================

interface PasswordValidationResult {
  valid: boolean;
  message: string;
  score: number; // 0-4
}

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.min(passedChecks, 4);

  if (!checks.length) {
    return { valid: false, message: 'Password must be at least 8 characters', score };
  }
  if (!checks.uppercase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter', score };
  }
  if (!checks.lowercase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter', score };
  }
  if (!checks.number) {
    return { valid: false, message: 'Password must contain at least one number', score };
  }
  if (!checks.special) {
    return { valid: false, message: 'Password must contain at least one special character', score };
  }

  return { valid: true, message: 'Password is strong', score };
}

export function getPasswordStrengthLabel(score: number): string {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return labels[Math.min(score, 4)];
}

export function getPasswordStrengthColor(score: number): string {
  const colors = ['#E71D36', '#FF6B35', '#FFA500', '#2EC4B6', '#00C851'];
  return colors[Math.min(score, 4)];
}

// ============================================
// Auth State Helpers
// ============================================

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  return auth.onAuthStateChanged(callback);
};

export const getIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
};

export default authService;