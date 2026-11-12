// =============================================================================
// COMMUNITY EVENTS APP - SUPABASE ADAPTERS
// =============================================================================
// These adapters implement the common interfaces using Supabase.

import { supabaseAuthAdapter } from './auth';
import { supabaseDatabaseAdapter } from './database';
import { supabaseStorageService } from './storage';

export { supabaseAuthAdapter };
export { supabaseDatabaseAdapter };
export { supabaseStorageService as supabaseStorageAdapter };

// Export all Supabase adapters
export const supabaseAdapters = {
  auth: supabaseAuthAdapter,
  database: supabaseDatabaseAdapter,
  storage: supabaseStorageService,
};

export default supabaseAdapters;