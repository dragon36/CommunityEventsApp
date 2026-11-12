// =============================================================================
// COMMUNITY EVENTS APP - SERVICES FACTORY (Supabase Only)
// =============================================================================
// This factory provides Supabase services as the only backend provider.

import Constants from 'expo-constants';
import type { Services, BackendProvider } from '../interfaces';

// Backend provider is always Supabase
const getBackendProvider = (): BackendProvider => {
  return 'supabase';
};

// Lazy-loaded adapters
let supabaseAdapters: Services | null = null;

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

// Get the services (always Supabase)
export async function getServices(): Promise<Services> {
  return loadSupabaseAdapters();
}

// Synchronous getters for hooks that need immediate access
let currentServices: Services | null = null;

// Initialize services (for React Native where we can't await at top level)
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
// These will be initialized on first use
let authServicePromise: Promise<any> | null = null;
let databaseServicePromise: Promise<any> | null = null;
let storageServicePromise: Promise<any> | null = null;

async function initAuth() {
  if (authServicePromise) return authServicePromise;
  authServicePromise = getAuthService();
  return authServicePromise;
}

async function initDatabase() {
  if (databaseServicePromise) return databaseServicePromise;
  databaseServicePromise = getDatabaseService();
  return databaseServicePromise;
}

async function initStorage() {
  if (storageServicePromise) return storageServicePromise;
  storageServicePromise = getStorageService();
  return storageServicePromise;
}

// Export promise-based getters for synchronous-ish access
export const authService = {
  async getCurrentUser() { return (await initAuth()).getCurrentUser(); },
  async getCurrentSession() { return (await initAuth()).getCurrentSession(); },
  async onAuthStateChanged(cb: (user: any, session: any) => void) { return (await initAuth()).onAuthStateChanged(cb); },
  async login(data: any) { return (await initAuth()).login(data); },
  async register(data: any) { return (await initAuth()).register(data); },
  async logout() { return (await initAuth()).logout(); },
  async sendPasswordReset(email: string) { return (await initAuth()).sendPasswordReset(email); },
  async verifyResetCode(oobCode: string) { return (await initAuth()).verifyResetCode(oobCode); },
  async confirmPasswordReset(oobCode: string, newPassword: string) { return (await initAuth()).confirmPasswordReset(oobCode, newPassword); },
  async updateProfile(data: any) { return (await initAuth()).updateProfile(data); },
  async updateEmail(newEmail: string, password: string) { return (await initAuth()).updateEmail(newEmail, password); },
  async updatePassword(currentPassword: string, newPassword: string) { return (await initAuth()).updatePassword(currentPassword, newPassword); },
  async sendEmailVerification() { return (await initAuth()).sendEmailVerification(); },
  async checkAdminStatus() { return (await initAuth()).checkAdminStatus(); },
  async refreshToken() { return (await initAuth()).refreshToken(); },
  async validatePassword(password: string) { return (await initAuth()).validatePassword(password); },
  async getPasswordStrengthLabel(score: number) { return (await initAuth()).getPasswordStrengthLabel(score); },
  async getPasswordStrengthColor(score: number) { return (await initAuth()).getPasswordStrengthColor(score); },
};

export const databaseService = {
  async createUserProfile(uid: string, data: any) { return (await initDatabase()).createUserProfile(uid, data); },
  async getUserProfile(uid: string) { return (await initDatabase()).getUserProfile(uid); },
  async updateUserProfile(uid: string, data: any) { return (await initDatabase()).updateUserProfile(uid, data); },
  async updateLastLogin(uid: string) { return (await initDatabase()).updateLastLogin(uid); },
  async getUserByEmail(email: string) { return (await initDatabase()).getUserByEmail(email); },
  async getUsersPaginated(pageSize: number, lastDoc?: any, filters?: any) { return (await initDatabase()).getUsersPaginated(pageSize, lastDoc, filters); },
  async updateUserRole(uid: string, role: any, adminId: string) { return (await initDatabase()).updateUserRole(uid, role, adminId); },
  async toggleUserActive(uid: string, isActive: boolean, adminId: string) { return (await initDatabase()).toggleUserActive(uid, isActive, adminId); },
  async requestPasswordReset(email: string) { return (await initDatabase()).requestPasswordReset(email); },
  async createEvent(data: any, userId: string) { return (await initDatabase()).createEvent(data, userId); },
  async getEvent(eventId: string) { return (await initDatabase()).getEvent(eventId); },
  async updateEvent(eventId: string, data: any, userId: string, isAdmin?: boolean) { return (await initDatabase()).updateEvent(eventId, data, userId, isAdmin); },
  async deleteEvent(eventId: string, userId: string, isAdmin?: boolean) { return (await initDatabase()).deleteEvent(eventId, userId, isAdmin); },
  async getApprovedEvents(region?: any, pageSize?: number, lastDoc?: any) { return (await initDatabase()).getApprovedEvents(region, pageSize, lastDoc); },
  async getUserEvents(userId: string, status?: any) { return (await initDatabase()).getUserEvents(userId, status); },
  async getPendingEvents(pageSize?: number, lastDoc?: any) { return (await initDatabase()).getPendingEvents(pageSize, lastDoc); },
  async approveEvent(eventId: string, adminId: string) { return (await initDatabase()).approveEvent(eventId, adminId); },
  async rejectEvent(eventId: string, adminId: string, reason: string) { return (await initDatabase()).rejectEvent(eventId, adminId, reason); },
  async getAllEventsPaginated(pageSize: number, lastDoc?: any, statusFilter?: any) { return (await initDatabase()).getAllEventsPaginated(pageSize, lastDoc, statusFilter); },
  async getStats() { return (await initDatabase()).getStats(); },
  async updateStats(stats: any) { return (await initDatabase()).updateStats(stats); },
  async getHealth() { return (await initDatabase()).getHealth(); },
  async updateHealth(health: any) { return (await initDatabase()).updateHealth(health); },
  async getActionLog(pageSize?: number) { return (await initDatabase()).getActionLog(pageSize); },
  async calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) { return (await initDatabase()).calculateDistance(lat1, lon1, lat2, lon2); },
};

export const storageService = {
  async uploadFile(uri: string, options?: any) { return (await initStorage()).uploadFile(uri, options); },
  async uploadFiles(uris: string[], options?: any) { return (await initStorage()).uploadFiles(uris, options); },
  async deleteFile(path: string) { return (await initStorage()).deleteFile(path); },
  async deleteFiles(paths: string[]) { return (await initStorage()).deleteFiles(paths); },
  async getFileUrl(path: string) { return (await initStorage()).getFileUrl(path); },
  async uploadEventImages(uris: string[], eventId: string, onProgress?: any) { return (await initStorage()).uploadEventImages(uris, eventId, onProgress); },
  async uploadProfileImage(uri: string, userId: string) { return (await initStorage()).uploadProfileImage(uri, userId); },
  async deleteEventImages(imagePaths: string[]) { return (await initStorage()).deleteEventImages(imagePaths); },
};

// Re-export types
export type { Services, BackendProvider } from '../interfaces';

export default {
  getServices,
  initializeServices,
  getAuthService,
  getDatabaseService,
  getStorageService,
  getBackendProvider,
  authService,
  databaseService,
  storageService,
};