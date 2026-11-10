// =============================================================================
// COMMUNITY EVENTS APP - AUTH CONTEXT
// =============================================================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, initializeFirebase } from '@/services/firebase';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  UserCredential,
} from 'firebase/auth';
import { api } from '@/services/api';
import { UserProfile } from '@/types';
import { Alert } from 'react-native';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// -----------------------------------------------------------------------------
// AUTH PROVIDER
// -----------------------------------------------------------------------------
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Firebase and listen to auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        initializeFirebase();
        setInitializing(false);
      } catch (err) {
        console.error('Firebase init error:', err);
        setInitializing(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      setUser(firebaseUser);
      setLoading(true);

      if (firebaseUser) {
        try {
          // Fetch user profile
          const profile = await api.users.getUserProfile(firebaseUser.uid);
          if (mounted) {
            setUserProfile(profile);
            setError(null);
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          if (mounted) setError(err as Error);
        }
      } else {
        if (mounted) setUserProfile(null);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      await updateProfile(result.user, { displayName });

      // Send email verification
      await sendEmailVerification(result.user);

      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Send password reset email
  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Send email verification
  const verifyEmail = async (): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    try {
      await sendEmailVerification(user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Update user profile (display name, photo)
  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    try {
      await updateProfile(user, data);
      // Refresh profile
      await refreshProfile();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !user.email) throw new Error('No user logged in');
    setError(null);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Change email
  const changeEmail = async (currentPassword: string, newEmail: string): Promise<void> => {
    if (!user || !user.email) throw new Error('No user logged in');
    setError(null);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update email
      await updateEmail(user, newEmail);
      // Send verification to new email
      await sendEmailVerification(user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Delete account
  const deleteAccount = async (password: string): Promise<void> => {
    if (!user || !user.email) throw new Error('No user logged in');
    setError(null);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      // Delete user
      await deleteUser(user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Refresh user profile
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    try {
      const profile = await api.users.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    initializing,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    verifyEmail,
    updateUserProfile,
    changePassword,
    changeEmail,
    deleteAccount,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;