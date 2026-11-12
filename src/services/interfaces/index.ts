// =============================================================================
// COMMUNITY EVENTS APP - SERVICE INTERFACES
// =============================================================================
// These interfaces define the contract that both Firebase and Supabase adapters must implement.
// The app code uses these interfaces, not the concrete implementations directly.

import type {
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
  RegisterFormData,
  LoginFormData,
  UpdateProfileFormData,
} from '@/types';

// Re-export form types for adapters
export type { RegisterFormData, LoginFormData, UpdateProfileFormData };

// ============================================
// AUTH SERVICE INTERFACE
// ============================================

export interface AuthService {
  // Registration & Login
  register(data: RegisterFormData): Promise<{ user: AuthUser; session: AuthSession }>;
  login(data: LoginFormData): Promise<{ user: AuthUser; session: AuthSession }>;
  logout(): Promise<void>;

  // Password Management
  sendPasswordReset(email: string): Promise<void>;
  verifyResetCode(oobCode: string): Promise<string>;
  confirmPasswordReset(oobCode: string, newPassword: string): Promise<void>;

  // Profile Management
  updateProfile(data: UpdateProfileFormData): Promise<void>;
  updateEmail(newEmail: string, password: string): Promise<void>;
  updatePassword(currentPassword: string, newPassword: string): Promise<void>;
  sendEmailVerification(): Promise<void>;

  // User Info
  getCurrentUser(): Promise<AuthUser | null>;
  getCurrentSession(): Promise<AuthSession | null>;

  // Admin & Claims
  checkAdminStatus(): Promise<boolean>;
  refreshToken(): Promise<string>;

  // Auth State Observer
  onAuthStateChanged(callback: (user: AuthUser | null, session: AuthSession | null) => void): () => void;

  // Password Validation (shared utility)
  validatePassword(password: string): PasswordValidationResult;
  getPasswordStrengthLabel(score: number): string;
  getPasswordStrengthColor(score: number): string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  score: number; // 0-4
}

// ============================================
// DATABASE SERVICE INTERFACE
// ============================================

export interface DatabaseService {
  // User Profile Operations
  createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>;
  getUserProfile(uid: string): Promise<UserProfile | null>;
  updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>;
  updateLastLogin(uid: string): Promise<void>;
  getUserByEmail(email: string): Promise<UserProfile | null>;

  // User Management (Admin)
  getUsersPaginated(
    pageSize: number,
    lastDoc?: unknown,
    filters?: { role?: UserRole; isActive?: boolean; search?: string }
  ): Promise<PaginatedResponse<AdminUser>>;
  updateUserRole(uid: string, role: UserRole, adminId: string): Promise<void>;
  toggleUserActive(uid: string, isActive: boolean, adminId: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;

  // Event Operations
  createEvent(data: EventFormData, userId: string): Promise<string>;
  getEvent(eventId: string): Promise<Event | null>;
  updateEvent(eventId: string, data: Partial<EventFormData>, userId: string, isAdmin?: boolean): Promise<void>;
  deleteEvent(eventId: string, userId: string, isAdmin?: boolean): Promise<void>;

  // Event Queries
  getApprovedEvents(
    region?: { center: { lat: number; lng: number }; radiusKm: number },
    pageSize?: number,
    lastDoc?: unknown
  ): Promise<PaginatedResponse<Event>>;
  getUserEvents(userId: string, status?: EventStatus): Promise<Event[]>;

  // Admin Event Operations
  getPendingEvents(pageSize?: number, lastDoc?: unknown): Promise<PaginatedResponse<AdminEvent>>;
  approveEvent(eventId: string, adminId: string): Promise<void>;
  rejectEvent(eventId: string, adminId: string, reason: string): Promise<void>;
  getAllEventsPaginated(
    pageSize: number,
    lastDoc?: unknown,
    statusFilter?: EventStatus
  ): Promise<PaginatedResponse<AdminEvent>>;

  // Admin Stats & Health
  getStats(): Promise<AdminStats | null>;
  updateStats(stats: Partial<AdminStats>): Promise<void>;
  getHealth(): Promise<AppHealth | null>;
  updateHealth(health: Partial<AppHealth>): Promise<void>;
  getActionLog(pageSize?: number): Promise<AdminAction[]>;

  // Utility
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
}

// ============================================
// STORAGE SERVICE INTERFACE
// ============================================

export interface StorageService {
  uploadFile(uri: string, options?: ImageUploadOptions): Promise<UploadResult>;
  uploadFiles(uris: string[], options?: ImageUploadOptions): Promise<UploadResult[]>;
  deleteFile(path: string): Promise<void>;
  deleteFiles(paths: string[]): Promise<void>;
  getFileUrl(path: string): Promise<string>;

  // Specialized uploads
  uploadEventImages(
    uris: string[],
    eventId: string,
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]>;
  uploadProfileImage(uri: string, userId: string): Promise<UploadResult>;
  deleteEventImages(imagePaths: string[]): Promise<void>;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

export interface ImageUploadOptions {
  folder?: string; // 'events', 'profiles', etc.
  fileName?: string;
  onProgress?: (progress: UploadProgress) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

// ============================================
// SERVICES FACTORY INTERFACE
// ============================================

export interface Services {
  auth: AuthService;
  database: DatabaseService;
  storage: StorageService;
}

// Provider type
export type BackendProvider = 'supabase';