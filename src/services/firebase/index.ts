// =============================================================================
// COMMUNITY EVENTS APP - FIREBASE ADAPTERS
// =============================================================================
// These adapters wrap the existing Firebase services to conform to the
// common interfaces defined in src/services/interfaces.

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
  getAuth,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { userService, eventService, adminService, calculateDistance } from '../firebase/firestore';
import { firebaseStorageService as storageService } from './storage';
import type {
  RegisterFormData,
  LoginFormData,
  UpdateProfileFormData,
  UserProfile,
  Event,
  EventFormData,
  EventStatus,
  UserRole,
  AdminStats,
  AppHealth,
  AdminUser,
  AdminEvent,
  AdminAction,
  PaginatedResponse,
  LocationData,
} from '@/types';
import type { AuthService, AuthUser, AuthSession, PasswordValidationResult, DatabaseService, StorageService } from '../interfaces';

// ============================================
// FIREBASE AUTH ADAPTER
// ============================================

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
      creationTime: firebaseUser.metadata.creationTime || '',
      lastSignInTime: firebaseUser.metadata.lastSignInTime || '',
    },
  };
}

// Convert Firebase UserCredential to our AuthSession
function convertAuthSession(userCredential: { user: FirebaseUser }): AuthSession {
  // Note: Firebase Web SDK doesn't expose refresh token directly
  // In React Native with @react-native-firebase/auth, we can get it
  return {
    accessToken: '', // Will be populated via getIdToken
    refreshToken: '', // Not directly accessible
    expiresIn: 3600,
    tokenType: 'Bearer',
    user: convertFirebaseUser(userCredential.user),
  };
}

// Get session from user (helper)
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

    // Update Firestore profile - convert UpdateProfileFormData to Partial<UserProfile>
    const profileUpdates: Partial<UserProfile> = {};
    if (data.displayName) profileUpdates.displayName = data.displayName;
    if (data.photoURL) profileUpdates.photoURL = data.photoURL;
    if (data.bio !== undefined) profileUpdates.bio = data.bio;
    if (data.location) profileUpdates.location = data.location;
    if (data.notificationSettings) profileUpdates.notificationSettings = data.notificationSettings as any;
    if (data.privacySettings) profileUpdates.privacySettings = data.privacySettings as any;

    await userService.updateUserProfile(user.uid, profileUpdates);
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
  async getCurrentUser(): Promise<AuthUser | null> {
    const user = auth.currentUser;
    return user ? convertFirebaseUser(user) : null;
  },

  // Get current session
  async getCurrentSession(): Promise<AuthSession | null> {
    const user = auth.currentUser;
    if (!user) return null;
    // This is a synchronous approximation - real session would be async
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
      return idTokenResult.claims['admin'] === true;
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

  // Password Validation (shared with existing implementation)
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
    const labels: readonly string[] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return labels[Math.min(score, 4)] ?? 'Very Weak';
  },

  getPasswordStrengthColor(score: number): string {
    const colors: readonly string[] = ['#E71D36', '#FF6B35', '#FFA500', '#2EC4B6', '#00C851'];
    return colors[Math.min(score, 4)] ?? '#E71D36';
  },
};

// ============================================
// FIREBASE DATABASE ADAPTER
// ============================================

export const firebaseDatabaseAdapter: DatabaseService = {
  // User Profile Operations
  createUserProfile: userService.createUserProfile,
  getUserProfile: userService.getUserProfile,
  updateUserProfile: userService.updateUserProfile,
  updateLastLogin: userService.updateLastLogin,
  getUserByEmail: userService.getUserByEmail,

  // User Management (Admin)
  getUsersPaginated: userService.getUsersPaginated,
  updateUserRole: userService.updateUserRole,
  toggleUserActive: userService.toggleUserActive,
  requestPasswordReset: userService.requestPasswordReset,

  // Event Operations
  createEvent: eventService.createEvent,
  getEvent: eventService.getEvent,
  updateEvent: eventService.updateEvent,
  deleteEvent: eventService.deleteEvent,

  // Event Queries
  getApprovedEvents: eventService.getApprovedEvents,
  getUserEvents: eventService.getUserEvents,

  // Admin Event Operations
  getPendingEvents: eventService.getPendingEvents,
  approveEvent: eventService.approveEvent,
  rejectEvent: eventService.rejectEvent,
  getAllEventsPaginated: eventService.getAllEventsPaginated,

  // Admin Stats & Health
  getStats: adminService.getStats,
  updateStats: adminService.updateStats,
  getHealth: adminService.getHealth,
  updateHealth: adminService.updateHealth,
  getActionLog: adminService.getActionLog,

  // Utility
  calculateDistance,
};

// ============================================
// FIREBASE STORAGE ADAPTER
// ============================================

export const firebaseStorageAdapter: StorageService = {
  uploadFile: storageService.uploadFile,
  uploadFiles: storageService.uploadFiles,
  deleteFile: storageService.deleteFile,
  deleteFiles: storageService.deleteFiles,
  getFileUrl: storageService.getFileUrl,
  uploadEventImages: storageService.uploadEventImages,
  uploadProfileImage: storageService.uploadProfileImage,
  deleteEventImages: storageService.deleteEventImages,
};

// ============================================
// EXPORT ALL FIREBASE ADAPTERS
// ============================================

export const firebaseAdapters = {
  auth: firebaseAuthAdapter,
  database: firebaseDatabaseAdapter,
  storage: firebaseStorageAdapter,
};

export default firebaseAdapters;