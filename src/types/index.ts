// =============================================================================
// COMMUNITY EVENTS APP - TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// BASE TYPES
// -----------------------------------------------------------------------------
export type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type DocumentReference<T = unknown> = {
  id: string;
  path: string;
};

// -----------------------------------------------------------------------------
// USER TYPES
// -----------------------------------------------------------------------------
export type UserRole = 'user' | 'moderator' | 'admin';

export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newEventsNearby: boolean;
  eventReminders: boolean;
  eventUpdates: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showLocation: boolean;
  showAttendingEvents: boolean;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  coordinates?: GeoPoint;
  geohash?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: Location;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  role: UserRole;
  followerIds: string[];
  followingIds: string[];
  savedEventIds: string[];
  interestedCategories?: string[];
  fcmToken?: string;
  googleCalendarTokens?: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt?: Timestamp;
  suspended?: boolean;
  suspensionReason?: string;
}

// -----------------------------------------------------------------------------
// EVENT TYPES
// -----------------------------------------------------------------------------
export type EventVisibility = 'public' | 'private' | 'unlisted';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'removed';
export type RSVPStatus = 'going' | 'interested' | 'not_going';

export interface EventLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: GeoPoint;
  geohash: string;
  venueName?: string;
  venueId?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location: EventLocation;
  organizerId: string;
  coOrganizerIds: string[];
  category: string;
  tags: string[];
  visibility: EventVisibility;
  status: EventStatus;
  attendeeIds: string[];
  maxAttendees?: number;
  coverImageUrls?: string[];
  coverImageOriginal?: string;
  galleryImages?: string[];
  googleCalendarEventId?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  remindersSent?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  moderationFlagged?: boolean;
  moderationReason?: string;
}

export interface EventAttendee {
  userId: string;
  eventId: string;
  status: RSVPStatus;
  respondedAt: Timestamp;
  checkedInAt?: Timestamp;
  notificationSent?: boolean;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  hidden?: boolean;
  moderationFlagged?: boolean;
  moderationReason?: string;
}

// -----------------------------------------------------------------------------
// CATEGORY & VENUE TYPES
// -----------------------------------------------------------------------------
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: GeoPoint;
  geohash: string;
  description?: string;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  website?: string;
  phone?: string;
  email?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive' | 'removed';
}

// -----------------------------------------------------------------------------
// NOTIFICATION TYPES
// -----------------------------------------------------------------------------
export type NotificationType =
  | 'new_event'
  | 'event_reminder'
  | 'rsvp'
  | 'rsvp_update'
  | 'comment'
  | 'friend_request'
  | 'friend_accepted'
  | 'event_update'
  | 'event_cancelled'
  | 'moderation'
  | 'report_outcome'
  | 'weekly_digest'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string | number | boolean>;
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

// -----------------------------------------------------------------------------
// REPORT TYPES
// -----------------------------------------------------------------------------
export type ReportTargetType = 'event' | 'comment' | 'user' | 'venue';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportSeverity = 'low' | 'medium' | 'high';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reason: string;
  severity: ReportSeverity;
  status: ReportStatus;
  flaggedContent?: string[];
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  createdAt: Timestamp;
}

// -----------------------------------------------------------------------------
// ANALYTICS TYPES
// -----------------------------------------------------------------------------
export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventName: string;
  parameters: Record<string, string | number | boolean>;
  timestamp: Timestamp;
}

// -----------------------------------------------------------------------------
// FRIEND/SOCIAL TYPES
// -----------------------------------------------------------------------------
export type FriendStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  requestedAt: Timestamp;
  respondedAt?: Timestamp;
}

// -----------------------------------------------------------------------------
// SAVED EVENTS
// -----------------------------------------------------------------------------
export interface SavedEvent {
  userId: string;
  eventId: string;
  savedAt: Timestamp;
}

// -----------------------------------------------------------------------------
// SEARCH INDEX
// -----------------------------------------------------------------------------
export interface SearchIndexEvent {
  eventId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  city: string;
  state: string;
  country: string;
  geohash: string;
  coordinates: GeoPoint;
  startDate: Timestamp;
  endDate: Timestamp;
  organizerId: string;
  attendeeCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  searchText: string;
}

// -----------------------------------------------------------------------------
// DAILY METRICS
// -----------------------------------------------------------------------------
export interface DailyMetrics {
  date: Timestamp;
  newUsers: number;
  newEvents: number;
  totalEvents: number;
  totalUsers: number;
  rsvps: number;
  comments: number;
  activeUsers: number;
  categories: Record<string, number>;
  topCities: { city: string; count: number }[];
}

// -----------------------------------------------------------------------------
// NAVIGATION TYPES
// -----------------------------------------------------------------------------
export type RootStackParamList = {
  '(auth)': undefined;
  '(app)': undefined;
  '(modal)': undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'auth/forgot-password': undefined;
  'auth/verify-email': { email: string };
  'app/(tabs)': undefined;
  'app/events': undefined;
  'app/events/[id]': { id: string };
  'app/events/create': undefined;
  'app/events/edit': { id: string };
  'app/map': undefined;
  'app/search': undefined;
  'app/profile': { userId?: string };
  'app/profile/edit': undefined;
  'app/settings': undefined;
  'app/notifications': undefined;
  'app/saved': undefined;
  'app/friends': undefined;
  'app/categories': undefined;
  'modal/event-details': { eventId: string };
  'modal/rsvp': { eventId: string };
  'modal/share': { eventId: string };
  'modal/report': { targetType: ReportTargetType; targetId: string };
};

// -----------------------------------------------------------------------------
// API RESPONSE TYPES
// -----------------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

// -----------------------------------------------------------------------------
// FORM TYPES
// -----------------------------------------------------------------------------
export interface CreateEventForm {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: GeoPoint;
    venueName?: string;
    venueId?: string;
  };
  category: string;
  tags: string[];
  visibility: EventVisibility;
  maxAttendees?: number;
  isRecurring: boolean;
  recurrenceRule?: string;
}

export interface EditProfileForm {
  displayName: string;
  bio: string;
  location: Location;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
}

// -----------------------------------------------------------------------------
// UTILITY TYPES
// -----------------------------------------------------------------------------
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type NonEmptyArray<T> = [T, ...T[]];

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------
export const EVENT_CATEGORIES = [
  'music',
  'food',
  'arts',
  'sports',
  'tech',
  'business',
  'education',
  'health',
  'community',
  'nightlife',
  'outdoor',
  'family',
  'charity',
  'other'
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

export const EVENT_VISIBILITY_OPTIONS: { value: EventVisibility; label: string }[] = [
  { value: 'public', label: 'Public - Anyone can see and join' },
  { value: 'unlisted', label: 'Unlisted - Only people with link can see' },
  { value: 'private', label: 'Private - Invite only' }
];

export const RSVP_STATUS_OPTIONS: { value: RSVPStatus; label: string; color: string }[] = [
  { value: 'going', label: 'Going', color: '#4CAF50' },
  { value: 'interested', label: 'Interested', color: '#FF9800' },
  { value: 'not_going', label: 'Not Going', color: '#F44336' }
];