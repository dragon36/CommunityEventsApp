// =============================================================================
// COMMUNITY EVENTS APP - SUPABASE CONFIGURATION
// =============================================================================

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get Supabase config from Expo Constants (set in app.config.ts extra)
const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
const supabaseConfig = extra?.['supabase'] as Record<string, string> | undefined;
const supabaseUrl = supabaseConfig?.['url'];
const supabaseAnonKey = supabaseConfig?.['anonKey'];

// Validate config
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase config missing. Check your .env and app.config.ts');
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    // Use AsyncStorage for React Native
    storage: Platform.OS === 'web' ? undefined : undefined, // Will use @react-native-async-storage/async-storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Export for testing
export { supabase as default };

// Helper to get current user ID
export const getCurrentUserId = (): string | null => {
  // This would be called from auth state listener
  return null; // Will be populated by auth state
};

// Helper to check if user is admin (via Supabase JWT claims or profile)
export const isAdminUser = async (supabaseClient: SupabaseClient, uid?: string): Promise<boolean> => {
  let userId = uid ?? null;
  if (!userId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId) return false;

  // Option 1: Check custom claims in JWT
  const { data: { session } } = await supabaseClient.auth.getSession();
  const appMetadata = session?.user.app_metadata as Record<string, unknown> | undefined;
  if (appMetadata?.['role'] === 'admin') {
    return true;
  }

  // Option 2: Fallback to profile lookup
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.['role'] === 'admin';
};

// Initialize Supabase (call this early in app startup)
export const initializeSupabase = (): SupabaseClient => {
  return supabase;
};

export const getSupabaseClient = (): SupabaseClient => {
  return supabase;
};