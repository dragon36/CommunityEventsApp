// =============================================================================
// COMMUNITY EVENTS APP - SERVICES FACTORY
// =============================================================================
// This factory selects the appropriate backend (Firebase or Supabase) based on
// the EXPO_PUBLIC_BACKEND_PROVIDER environment variable.

import Constants from 'expo-constants';
import type { Services, BackendProvider } from '../interfaces';

// Get backend provider from environment
const getBackendProvider = (): BackendProvider => {
  // Check Expo Constants (set in app.config.ts extra)
  const provider = Constants.expoConfig?.extra?.['backendProvider'] as BackendProvider;
  if (provider === 'firebase' || provider === 'supabase') {
    return provider;
  }

  // Fallback to process.env (for web/build time)
  const envProvider = process.env['EXPO_PUBLIC_BACKEND_PROVIDER'] as BackendProvider;
  if (envProvider === 'firebase' || envProvider === 'supabase') {
    return envProvider;
  }

  // Default to Firebase
  return 'firebase';
};

// Lazy-loaded adapters to avoid circular dependencies
let firebaseAdapters: Services | null = null;
let supabaseAdapters: Services | null = null;

async function loadFirebaseAdapters(): Promise<Services> {
  if (firebaseAdapters) return firebaseAdapters;

  // Dynamic import to avoid loading Firebase if not needed
  const { firebaseAdapters: adapters } = await import('../firebase/index');

  firebaseAdapters = adapters;
  return firebaseAdapters;
}

async function loadSupabaseAdapters(): Promise<Services> {
  if (supabaseAdapters) return supabaseAdapters;

  // Dynamic import to avoid loading Supabase if not needed
  const { supabaseAuthAdapter } = await import('../supabase/auth');
  const { supabaseDatabaseAdapter } = await import('../supabase/database');
  const { supabaseStorageService } = await import('../supabase/storage');

  supabaseAdapters = {
    auth: supabaseAuthAdapter,
    database: supabaseDatabaseAdapter,
    storage: supabaseStorageService,
  };

  return supabaseAdapters;
}

// Get the appropriate services based on configuration
export async function getServices(): Promise<Services> {
  const provider = getBackendProvider();

  switch (provider) {
    case 'firebase':
      return loadFirebaseAdapters();
    case 'supabase':
      return loadSupabaseAdapters();
    default:
      console.warn(`Unknown backend provider: ${provider}, defaulting to Firebase`);
      return loadFirebaseAdapters();
  }
}

// Synchronous getters for hooks that need immediate access
// These will initialize on first call
let currentServices: Services | null = null;
let currentProvider: BackendProvider | null = null;

export function getCurrentProvider(): BackendProvider {
  if (!currentProvider) {
    currentProvider = getBackendProvider();
  }
  return currentProvider;
}

// Initialize services synchronously (for React Native where we can't await at top level)
// This should be called early in app startup
export async function initializeServices(): Promise<Services> {
  if (currentServices) return currentServices;

  currentServices = await getServices();
  return currentServices;
}

// Get services (async, waits for initialization if needed)
export async function getInitializedServices(): Promise<Services> {
  if (currentServices) return currentServices;
  return initializeServices();
}

// Export individual service getters for convenience
export async function getAuthService() {
  const services = await getInitializedServices();
  return services.auth;
}

export async function getDatabaseService() {
  const services = await getInitializedServices();
  return services.database;
}

export async function getStorageService() {
  const services = await getInitializedServices();
  return services.storage;
}

// For backward compatibility and synchronous access in hooks
// These return the Firebase adapters as default (will be overridden after init)
import { firebaseAuthAdapter } from '../firebase/auth';
import { firebaseDatabaseAdapter } from '../firebase/database';
import { firebaseStorageService as firebaseStorageAdapter } from '../firebase/storage';

export const authService = firebaseAuthAdapter;
export const databaseService = firebaseDatabaseAdapter;
export const storageService = firebaseStorageAdapter;

// Re-export types
export type { Services, BackendProvider } from '../interfaces';

export default {
  getServices,
  initializeServices,
  getAuthService,
  getDatabaseService,
  getStorageService,
  getCurrentProvider,
  authService,
  databaseService,
  storageService,
};