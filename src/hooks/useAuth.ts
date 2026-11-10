import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { auth, getIdToken } from '@/services/firebase/config';
import { authService } from '@/services/firebase/auth';
import { userService } from '@/services/firebase/firestore';
import type { UserProfile, UserRole } from '@/types';

// ============================================
// Auth Context Types
// ============================================

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  refreshToken: () => Promise<string>;
  clearError: () => void;
}

// ============================================
// Auth Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Auth Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Fetch user profile
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const userProfile = await userService.getUserProfile(uid);
      setProfile(userProfile);

      // Check admin status
      const adminStatus = userProfile?.role === 'admin';
      setIsAdmin(adminStatus);

      // Also check custom claims as backup
      if (!adminStatus) {
        const idTokenResult = await auth.currentUser?.getIdTokenResult();
        const customClaimsAdmin = idTokenResult?.claims?.admin === true;
        setIsAdmin(customClaimsAdmin);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await authService.login({ email, password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: { email: string; password: string; displayName: string }) => {
    setError(null);
    setLoading(true);
    try {
      await authService.register({ ...data, confirmPassword: data.password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null);
    try {
      await authService.sendPasswordReset(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (oobCode: string, newPassword: string) => {
    setError(null);
    try {
      await authService.confirmPasswordReset(oobCode, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    setError(null);
    try {
      await authService.updateProfile(data);
      // Refresh profile
      if (user) {
        await fetchProfile(user.uid);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  }, [user, fetchProfile]);

  const updateEmail = useCallback(async (newEmail: string, password: string) => {
    setError(null);
    try {
      await authService.updateEmail(newEmail, password);
      if (user) {
        await fetchProfile(user.uid);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update email';
      setError(message);
      throw err;
    }
  }, [user, fetchProfile]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setError(null);
    try {
      await authService.updatePassword(currentPassword, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
      throw err;
    }
  }, []);

  const sendEmailVerification = useCallback(async () => {
    setError(null);
    try {
      await authService.sendEmailVerification();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(message);
      throw err;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      return await authService.refreshToken();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh token';
      setError(message);
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    isAdmin,
    login,
    register,
    logout,
    sendPasswordReset,
    resetPassword,
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Custom Hooks
// ============================================

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user only (for components that don't need full auth)
 */
export function useUser() {
  const { user, profile, loading } = useAuth();
  return { user, profile, loading };
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { isAdmin, loading } = useAuth();
  return { isAdmin, loading };
}

/**
 * Hook to require authentication (redirects if not authenticated)
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  return { user, loading, isAuthenticated: !!user };
}

/**
 * Hook to require admin role
 */
export function useRequireAdmin() {
  const { isAdmin, loading, user } = useAuth();
  return { isAdmin, loading, isAuthorized: isAdmin && !!user };
}

export default useAuth;