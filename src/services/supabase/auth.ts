// =============================================================================
// COMMUNITY EVENTS APP - SUPABASE AUTH ADAPTER
// =============================================================================

import { supabase } from './config';
import type {
  RegisterFormData,
  LoginFormData,
  UpdateProfileFormData,
  AuthUser,
  AuthSession,
  PasswordValidationResult,
  AuthService,
} from '../interfaces';

// Convert Supabase User to our AuthUser interface
function convertSupabaseUser(supabaseUser: User): AuthUser {
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name || null,
    photoURL: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
    emailVerified: supabaseUser.email_confirmed_at !== null,
    isAnonymous: supabaseUser.is_anonymous,
    metadata: {
      creationTime: supabaseUser.created_at,
      lastSignInTime: supabaseUser.last_sign_in_at || supabaseUser.created_at,
    },
  };
}

// Convert Supabase Session to our AuthSession interface
function convertSupabaseSession(supabaseSession: Session | null): AuthSession | null {
  if (!supabaseSession) return null;

  return {
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresIn: supabaseSession.expires_in || 3600,
    tokenType: supabaseSession.token_type,
    user: convertSupabaseUser(supabaseSession.user),
  };
}

export const supabaseAuthAdapter: AuthService = {
  // Register new user
  async register(data: RegisterFormData): Promise<{ user: AuthUser; session: AuthSession }> {
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName,
        },
        emailRedirectTo: undefined, // Use default
      },
    });

    if (error) throw new Error(error.message);
    if (!authData.user) throw new Error('Registration failed');

    // Create user profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        display_name: data.displayName,
        role: 'user',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        is_active: true,
        email_verified: false,
        events_created: [],
        events_attending: [],
        notification_settings: {
          event_approved: true,
          event_rejected: true,
          event_reminder: true,
          new_events_nearby: true,
          admin_announcements: true,
        },
      });

    if (profileError) throw new Error(profileError.message);

    const user = convertSupabaseUser(authData.user);
    const session = authData.session ? convertSupabaseSession(authData.session) : null;

    if (!session) {
      // If no session (email confirmation required), return a minimal session
      return {
        user,
        session: {
          accessToken: '',
          refreshToken: '',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user,
        },
      };
    }

    return { user, session };
  },

  // Login user
  async login(data: LoginFormData): Promise<{ user: AuthUser; session: AuthSession }> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw new Error(error.message);
    if (!authData.user || !authData.session) throw new Error('Login failed');

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    const user = convertSupabaseUser(authData.user);
    const session = convertSupabaseSession(authData.session)!;

    return { user, session };
  },

  // Logout user
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  // Send password reset email
  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // Use default
    });
    if (error) throw new Error(error.message);
  },

  // Verify password reset code (not directly supported in Supabase client, use session)
  async verifyResetCode(oobCode: string): Promise<string> {
    // In Supabase, the reset code is handled via the session
    // The user clicks the link which restores the session
    // We just return the code as the email for verification
    return oobCode;
  },

  // Confirm password reset
  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // In Supabase, we need to set the session from the reset link first
    // This is typically done by the redirect URL restoring the session
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  },

  // Update user profile
  async updateProfile(data: UpdateProfileFormData): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('No authenticated user');

    // Update auth metadata
    const updates: { data: Record<string, string> } = { data: {} };
    if (data.displayName) updates.data.display_name = data.displayName;
    if (data.photoURL) updates.data.avatar_url = data.photoURL;

    if (Object.keys(updates.data).length > 0) {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw new Error(error.message);
    }

    // Update profile in database
    const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.displayName) profileUpdates.display_name = data.displayName;
    if (data.photoURL) profileUpdates.photo_url = data.photoURL;
    if (data.bio) profileUpdates.bio = data.bio;
    if (data.location) profileUpdates.location = data.location;

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (profileError) throw new Error(profileError.message);
  },

  // Update email
  async updateEmail(newEmail: string, password: string): Promise<void> {
    // Reauthenticate by signing in again
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) throw new Error('No authenticated user');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (signInError) throw new Error('Invalid current password');

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw new Error(error.message);

    // Update profile email
    await supabase
      .from('profiles')
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) throw new Error('No authenticated user');

    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Reauthenticate
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    if (signInError) throw new Error('Invalid current password');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: (await supabase.auth.getUser()).data.user?.email || '',
    });
    if (error) throw new Error(error.message);
  },

  // Get current user
  getCurrentUser(): AuthUser | null {
    // This is synchronous - in practice, use onAuthStateChanged or getUser()
    const { data: { user } } = supabase.auth.getUser();
    return user ? convertSupabaseUser(user) : null;
  },

  // Get current session
  getCurrentSession(): AuthSession | null {
    const { data: { session } } = supabase.auth.getSession();
    return session ? convertSupabaseSession(session) : null;
  },

  // Check if user is admin
  async checkAdminStatus(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Check JWT claims
    if (session.user.app_metadata?.role === 'admin') {
      return true;
    }

    // Fallback to profile lookup
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    return profile?.role === 'admin';
  },

  // Refresh access token
  async refreshToken(): Promise<string> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(error.message);
    return data.session?.access_token || '';
  },

  // Auth state observer
  onAuthStateChanged(callback: (user: AuthUser | null, session: AuthSession | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = convertSupabaseUser(session.user);
        const authSession = convertSupabaseSession(session);
        callback(user, authSession);
      } else {
        callback(null, null);
      }
    });

    return () => subscription.unsubscribe();
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

export default supabaseAuthAdapter;