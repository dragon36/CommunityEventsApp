// App Configuration Constants

export const APP_CONFIG = {
  name: 'Community Events',
  scheme: 'communityevents',
  version: '1.0.0',

  // Map defaults
  defaultRegion: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },

  // Event limits
  maxEventImages: 5,
  maxImageSizeMB: 5,
  maxTags: 10,
  maxDescriptionLength: 2000,
  maxTitleLength: 100,

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 50,

  // Cache
  eventCacheTime: 5 * 60 * 1000, // 5 minutes
  userCacheTime: 10 * 60 * 1000, // 10 minutes

  // Notifications
  reminderHoursBefore: 24,

  // Cleanup
  eventRetentionDays: 30,
  notificationRetentionDays: 30,
} as const;

// Event Types Configuration
export const EVENT_TYPES = [
  { value: 'parade', label: 'Parade', icon: 'musical-notes-outline', color: '#FF6B35' },
  { value: 'trick_or_treat', label: 'Trick-Or-Treat Route', icon: 'leaf-outline', color: '#FF9F1C' },
  { value: 'special_event', label: 'Special Event', icon: 'sparkles-outline', color: '#2EC4B6' },
] as const;

export type EventType = typeof EVENT_TYPES[number]['value'];

// Event Status Configuration
export const EVENT_STATUSES = [
  { value: 'pending', label: 'Pending Approval', color: '#FFA500' },
  { value: 'approved', label: 'Approved', color: '#2EC4B6' },
  { value: 'rejected', label: 'Rejected', color: '#E71D36' },
  { value: 'cancelled', label: 'Cancelled', color: '#6C757D' },
] as const;

export type EventStatus = typeof EVENT_STATUSES[number]['value'];

// User Roles
export const USER_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
] as const;

export type UserRole = typeof USER_ROLES[number]['value'];

// Password Requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
} as const;

// Image Types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

// Google Places Types
export const PLACE_TYPES = [
  '(regions)',
  '(cities)',
  'geocode',
  'establishment',
  'address',
] as const;

// Date Formats
export const DATE_FORMATS = {
  short: 'MMM d, yyyy',
  long: 'EEEE, MMMM d, yyyy',
  time: 'h:mm a',
  dateTime: 'MMM d, yyyy h:mm a',
  iso: 'yyyy-MM-dd',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'Please sign in to continue.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  server: 'Server error. Please try again later.',
  unknown: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  eventCreated: 'Event submitted for approval!',
  eventUpdated: 'Event updated successfully.',
  eventDeleted: 'Event deleted.',
  profileUpdated: 'Profile saved.',
  passwordReset: 'Password reset email sent.',
  passwordChanged: 'Password updated successfully.',
  emailVerified: 'Verification email sent.',
  userApproved: 'User approved.',
  userRejected: 'User rejected.',
} as const;