// =============================================================================
// COMMUNITY EVENTS APP - FIREBASE AUTH ADAPTER
// =============================================================================
// This file wraps the existing Firebase auth service to conform to the AuthService interface.

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
  User as FirebaseUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';
import { userService } from './firestore';
import type { RegisterFormData, LoginFormData, UpdateProfileFormData } from '@/types';
import type { AuthService, AuthUser, AuthSession, PasswordValidationResult } from '../interfaces';

// Convert Firebase User to our AuthUser interface
function convertFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    isAnonymous: firebaseUser.isAnonymous,
    metadata: {
      creationTime: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime,
    },
  };
}

// Get session from user (async)
async function getSessionFromUser(firebaseUser: FirebaseUser): Promise<AuthSession> {
  const accessToken = await firebaseUser.getIdToken();
  return {
    accessToken,
    refreshToken: '', // Not available in client SDK
    expiresIn: 3600,
    tokenType: 'Bearer',
    user: convertFirebaseUser(firebaseUser),
  };
}

export const firebaseAuthAdapter: AuthService = {
  // Register new user
  async register(data: RegisterFormData): Promise<{ user: AuthUser; session: AuthSession }> {
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    await firebaseUpdateProfile(userCredential.user, {
      displayName: data.displayName,
    });

    await sendEmailVerification(userCredential.user);

    // Create user profile in Firestore
    await userService.createUserProfile(userCredential.user.uid, {
      email: data.email,
      displayName: data.displayName,
    });

    const user = convertFirebaseUser(userCredential.user);
    const session = await getSessionFromUser(userCredential.user);

    return { user, session };
  },

  // Login user
  async login(data: LoginFormData): Promise<{ user: AuthUser; session: AuthSession }> {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);

    await userService.updateLastLogin(userCredential.user.uid);

    const user = convertFirebaseUser(userCredential.user);
    const session = await getSessionFromUser(userCredential.user);

    return { user, session };
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
    const passwordValidation = this.validatePassword(newPassword);
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
    await userService.updateUserProfile(user.uid, data);
  },

  // Update email
  async updateEmail(newEmail: string, password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const credential = EmailAuthProvider.credential(user.email!, password);
    await reauthenticateWithCredential(user, credential);
    await updateEmail(user, newEmail);

    await userService.updateUserProfile(user.uid, { email: newEmail });
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

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
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? convertFirebaseUser(user) : null;
  },

  // Get current session
  getCurrentSession(): AuthSession | null {
    const user = auth.currentUser;
    if (!user) return null;
    return {
      accessToken: '',
      refreshToken: '',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: convertFirebaseUser(user),
    };
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

  // Refresh ID token
  async refreshToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return await user.getIdToken(true);
  },

  // Auth state observer
  onAuthStateChanged(callback: (user: AuthUser | null, session: AuthSession | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = convertFirebaseUser(firebaseUser);
        const session = await getSessionFromUser(firebaseUser);
        callback(user, session);
      } else {
        callback(null, null);
      }
    });
  },

  // Password Validation
  validatePassword(password: string): PasswordValidationResult {
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
  },

  getPasswordStrengthLabel(score: number): string {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return labels[Math.min(score, 4)];
  },

  getPasswordStrengthColor(score: number): string {
    const colors = ['#E71D36', '#FF6B35', '#FFA500', '#2EC4B6', '#00C851'];
    return colors[Math.min(score, 4)];
  },
};

export default firebaseAuthAdapter;