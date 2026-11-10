// =============================================================================
// COMMUNITY EVENTS APP - CONSTANTS
// =============================================================================

// -----------------------------------------------------------------------------
// APP CONFIGURATION
// -----------------------------------------------------------------------------
export const APP_CONFIG = {
  name: 'Community Events',
  version: '1.0.0',
  bundleId: 'com.communityevents.app',
  scheme: 'communityevents',
  supportEmail: 'support@communityevents.app',
  website: 'https://communityevents.app',
  privacyPolicyUrl: 'https://communityevents.app/privacy',
  termsOfServiceUrl: 'https://communityevents.app/terms',
} as const;

// -----------------------------------------------------------------------------
// FIREBASE COLLECTIONS
// -----------------------------------------------------------------------------
export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  EVENT_ATTENDEES: 'attendees',
  EVENT_COMMENTS: 'comments',
  CATEGORIES: 'categories',
  VENUES: 'venues',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  FRIENDS: 'friends',
  SAVED_EVENTS: 'savedEvents',
  SEARCH_INDEX: 'searchIndex',
  ARCHIVED_EVENTS: 'archivedEvents',
  DAILY_METRICS: 'dailyMetrics',
  NOTIFICATION_PREFERENCES: 'notificationPreferences',
} as const;

// -----------------------------------------------------------------------------
// STORAGE PATHS
// -----------------------------------------------------------------------------
export const STORAGE_PATHS = {
  EVENT_COVERS: 'events/covers',
  EVENT_GALLERY: 'events/gallery',
  PROFILE_AVATARS: 'users/avatars',
  VENUE_PHOTOS: 'venues/photos',
} as const;

// -----------------------------------------------------------------------------
// IMAGE SIZES
// -----------------------------------------------------------------------------
export const IMAGE_SIZES = {
  EVENT_COVER: {
    LARGE: { width: 1200, height: 600 },
    MEDIUM: { width: 800, height: 400 },
    SMALL: { width: 400, height: 200 },
    THUMB: { width: 200, height: 100 },
  },
  PROFILE_AVATAR: {
    LARGE: { width: 400, height: 400 },
    MEDIUM: { width: 200, height: 200 },
    SMALL: { width: 100, height: 100 },
    TINY: { width: 40, height: 40 },
  },
  VENUE_PHOTO: {
    LARGE: { width: 1200, height: 800 },
    MEDIUM: { width: 800, height: 600 },
    THUMB: { width: 300, height: 200 },
  },
} as const;

// -----------------------------------------------------------------------------
// PAGINATION
// -----------------------------------------------------------------------------
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  EVENTS_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 50,
  NOTIFICATIONS_PER_PAGE: 30,
  SEARCH_RESULTS_PER_PAGE: 20,
} as const;

// -----------------------------------------------------------------------------
// CACHE TIMEOUTS
// -----------------------------------------------------------------------------
export const CACHE_TIMEOUTS = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// -----------------------------------------------------------------------------
// ANIMATION DURATIONS
// -----------------------------------------------------------------------------
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SPRING: {
    damping: 15,
    stiffness: 150,
  },
} as const;

// -----------------------------------------------------------------------------
// MAP CONFIGURATION
// -----------------------------------------------------------------------------
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  MARKER_CLUSTER_RADIUS: 50,
  MAX_ZOOM: 20,
  MIN_ZOOM: 2,
} as const;

// -----------------------------------------------------------------------------
// LOCATION CONFIGURATION
// -----------------------------------------------------------------------------
export const LOCATION_CONFIG = {
  ACCURACY: 'high' as const,
  DISTANCE_FILTER: 100, // meters
  MAX_AGE: 10 * 60 * 1000, // 10 minutes
  TIMEOUT: 15000, // 15 seconds
  GEOHASH_PRECISION: 9,
} as const;

// -----------------------------------------------------------------------------
// NOTIFICATION CHANNELS (Android)
// -----------------------------------------------------------------------------
export const NOTIFICATION_CHANNELS = {
  DEFAULT: {
    id: 'default',
    name: 'Default',
    importance: 'high' as const,
  },
  EVENTS: {
    id: 'events',
    name: 'Events',
    importance: 'high' as const,
  },
  REMINDERS: {
    id: 'reminders',
    name: 'Reminders',
    importance: 'high' as const,
  },
  DIGEST: {
    id: 'digest',
    name: 'Weekly Digest',
    importance: 'default' as const,
  },
  SOCIAL: {
    id: 'social',
    name: 'Social',
    importance: 'default' as const,
  },
} as const;

// -----------------------------------------------------------------------------
// DEEP LINK PATHS
// -----------------------------------------------------------------------------
export const DEEP_LINKS = {
  EVENT: (eventId: string) => `/events/${eventId}`,
  PROFILE: (userId: string) => `/profile/${userId}`,
  CATEGORY: (categorySlug: string) => `/categories/${categorySlug}`,
  MAP: () => '/map',
  SEARCH: (query?: string) => `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
} as const;

// -----------------------------------------------------------------------------
// ERROR CODES
// -----------------------------------------------------------------------------
export const ERROR_CODES = {
  // Auth
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_INVALID_EMAIL: 'auth/invalid-email',
  AUTH_TOO_MANY_REQUESTS: 'auth/too-many-requests',
  AUTH_NETWORK_REQUEST_FAILED: 'auth/network-request-failed',

  // Firestore
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  UNAVAILABLE: 'unavailable',

  // Custom
  EVENT_FULL: 'event-full',
  EVENT_CANCELLED: 'event-cancelled',
  ALREADY_RSVPED: 'already-rsvped',
  NOT_ATTENDING: 'not-attending',
  SELF_RSVP_NOT_ALLOWED: 'self-rsvp-not-allowed',
  INVALID_RECURRENCE: 'invalid-recurrence',
  GEOHASH_GENERATION_FAILED: 'geohash-generation-failed',
  IMAGE_UPLOAD_FAILED: 'image-upload-failed',
  CALENDAR_SYNC_FAILED: 'calendar-sync-failed',
} as const;

// -----------------------------------------------------------------------------
// ANALYTICS EVENTS
// -----------------------------------------------------------------------------
export const ANALYTICS_EVENTS = {
  // Auth
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',

  // Events
  EVENT_VIEW: 'event_view',
  EVENT_CREATE: 'event_create',
  EVENT_EDIT: 'event_edit',
  EVENT_DELETE: 'event_delete',
  EVENT_SHARE: 'event_share',
  EVENT_SAVE: 'event_save',
  EVENT_UNSAVE: 'event_unsave',

  // RSVP
  RSVP_GOING: 'rsvp_going',
  RSVP_INTERESTED: 'rsvp_interested',
  RSVP_NOT_GOING: 'rsvp_not_going',
  RSVP_CHANGE: 'rsvp_change',

  // Social
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPT: 'friend_accept',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',

  // Navigation
  SCREEN_VIEW: 'screen_view',
  SEARCH: 'search',
  MAP_VIEW: 'map_view',
  CATEGORY_VIEW: 'category_view',

  // Notifications
  NOTIFICATION_OPEN: 'notification_open',
  NOTIFICATION_DISMISS: 'notification_dismiss',

  // Settings
  SETTINGS_CHANGE: 'settings_change',
  NOTIFICATION_TOGGLE: 'notification_toggle',
} as const;

// -----------------------------------------------------------------------------
// FEATURE FLAGS
// -----------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  ENABLE_FRIENDS: true,
  ENABLE_GROUPS: false,
  ENABLE_TICKETS: false,
  ENABLE_LIVE_STREAMING: false,
  ENABLE_AI_RECOMMENDATIONS: false,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_CALENDAR_SYNC: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_DARK_MODE: true,
} as const;

// -----------------------------------------------------------------------------
// REGEX PATTERNS
// -----------------------------------------------------------------------------
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// -----------------------------------------------------------------------------
// DATE FORMATS
// -----------------------------------------------------------------------------
export const DATE_FORMATS = {
  SHORT: 'MMM d',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'EEEE, MMMM d, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  INPUT: 'yyyy-MM-dd',
} as const;