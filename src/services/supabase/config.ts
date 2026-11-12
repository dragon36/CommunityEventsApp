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

// Validate config - throw if missing to fail fast with clear message
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-supabase')) {
  const error = new Error(
    'Supabase configuration missing or using placeholder values.\n' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.\n' +
    'Get these from Supabase Dashboard > Settings > API'
  );
  // Store error for later retrieval
  (globalThis as any).__SUPABASE_CONFIG_ERROR__ = error;
  console.error('[Supabase] Configuration Error:', error.message);
}

// Create Supabase client (only if config is valid)
let supabaseClient: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw (globalThis as any).__SUPABASE_CONFIG_ERROR__ || new Error('Supabase config not available');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}

// Lazy getter for Supabase client
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
};

// Export for backward compatibility - throws if config missing
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project') && !supabaseAnonKey.includes('your-supabase'));
};

// Get config error if any
export const getSupabaseConfigError = (): Error | null => {
  return (globalThis as any).__SUPABASE_CONFIG_ERROR__ || null;
};

// Helper to get current user ID
export const getCurrentUserId = (): string | null => {
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
  return getSupabaseClient();
};

export { supabase as default };