// =============================================================================
// COMMUNITY EVENTS APP - SUPABASE ADAPTERS
// =============================================================================
// These adapters implement the common interfaces using Supabase.

export { supabaseAuthAdapter } from './auth';
export { supabaseDatabaseAdapter } from './database';
export { supabaseStorageService as supabaseStorageAdapter } from './storage';

// Export all Supabase adapters
export const supabaseAdapters = {
  auth: supabaseAuthAdapter,
  database: supabaseDatabaseAdapter,
  storage: supabaseStorageService,
};

export default supabaseAdapters;