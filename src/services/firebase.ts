// =============================================================================
// COMMUNITY EVENTS APP - FIREBASE CONFIGURATION
// =============================================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';
import {
  getFunctions,
  Functions,
  connectFunctionsEmulator,
  httpsCallable,
} from 'firebase/functions';
import { getAnalytics, Analytics, isSupported, logEvent } from 'firebase/analytics';
import { Platform } from 'react-native';
import { COLLECTIONS } from '@/constants';

// -----------------------------------------------------------------------------
// FIREBASE CONFIGURATION
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env['EXPO_PUBLIC_FIREBASE_API_KEY'],
  authDomain: process.env['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['EXPO_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['EXPO_PUBLIC_FIREBASE_APP_ID'],
  measurementId: process.env['EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'],
};

// -----------------------------------------------------------------------------
// INITIALIZE FIREBASE APP
// -----------------------------------------------------------------------------
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let analytics: Analytics | null = null;

export const initializeFirebase = (): FirebaseApp => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize services
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');

  // Configure auth persistence
  if (Platform.OS === 'web') {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  } else {
    // React Native uses AsyncStorage via @react-native-firebase/auth
    // Persistence is handled automatically
  }

  // Initialize analytics (web only)
  if (Platform.OS === 'web') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }

  return app;
};

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    return initializeFirebase();
  }
  return app;
};

export const getAuthInstance = (): Auth => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirestoreInstance = (): Firestore => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
};

export const getFunctionsInstance = (): Functions => {
  if (!functions) {
    initializeFirebase();
  }
  return functions;
};

export const getAnalyticsInstance = (): Analytics | null => {
  return analytics;
};

// -----------------------------------------------------------------------------
// EMULATOR CONNECTION (Development)
// -----------------------------------------------------------------------------
export const connectEmulators = (): void => {
  if (__DEV__ && process.env['EXPO_PUBLIC_USE_EMULATORS'] === 'true') {
    const host = process.env['EXPO_PUBLIC_EMULATOR_HOST'] || 'localhost';

    try {
      connectAuthEmulator(getAuthInstance(), `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(getFirestoreInstance(), host, 8080);
      connectStorageEmulator(getStorageInstance(), host, 9199);
      connectFunctionsEmulator(getFunctionsInstance(), host, 5001);
      console.log('Connected to Firebase emulators');
    } catch (error) {
      console.error('Failed to connect to emulators:', error);
    }
  }
};

// -----------------------------------------------------------------------------
// COLLECTION REFERENCES
// -----------------------------------------------------------------------------
export const collections = {
  users: () => db.collection(COLLECTIONS.USERS),
  events: () => db.collection(COLLECTIONS.EVENTS),
  categories: () => db.collection(COLLECTIONS.CATEGORIES),
  venues: () => db.collection(COLLECTIONS.VENUES),
  notifications: () => db.collection(COLLECTIONS.NOTIFICATIONS),
  reports: () => db.collection(COLLECTIONS.REPORTS),
  analytics: () => db.collection(COLLECTIONS.ANALYTICS),
  searchIndex: () => db.collection(COLLECTIONS.SEARCH_INDEX),
  dailyMetrics: () => db.collection(COLLECTIONS.DAILY_METRICS),
  notificationPreferences: () => db.collection(COLLECTIONS.NOTIFICATION_PREFERENCES),
} as const;

// -----------------------------------------------------------------------------
// SUB-COLLECTION HELPERS
// -----------------------------------------------------------------------------
export const subCollections = {
  eventAttendees: (eventId: string) => collections.events().doc(eventId).collection(COLLECTIONS.EVENT_ATTENDEES),
  eventComments: (eventId: string) => collections.events().doc(eventId).collection(COLLECTIONS.EVENT_COMMENTS),
  userFriends: (userId: string) => collections.users().doc(userId).collection(COLLECTIONS.FRIENDS),
  userSavedEvents: (userId: string) => collections.users().doc(userId).collection(COLLECTIONS.SAVED_EVENTS),
} as const;

// -----------------------------------------------------------------------------
// CALLABLE FUNCTIONS
// -----------------------------------------------------------------------------
export const callableFunctions = {
  createEvent: httpsCallable<{ data: CreateEventParams }, { eventId: string }>(functions, 'createEvent'),
  updateEvent: httpsCallable<{ eventId: string; data: Partial<CreateEventParams> }, void>(functions, 'updateEvent'),
  deleteEvent: httpsCallable<{ eventId: string }, void>(functions, 'deleteEvent'),
  rsvpEvent: httpsCallable<{ eventId: string; status: RSVPStatus }, void>(functions, 'rsvpEvent'),
  sendFriendRequest: httpsCallable<{ friendId: string }, void>(functions, 'sendFriendRequest'),
  acceptFriendRequest: httpsCallable<{ friendId: string }, void>(functions, 'acceptFriendRequest'),
  reportContent: httpsCallable<{ targetType: string; targetId: string; reason: string }, void>(functions, 'reportContent'),
  searchEvents: httpsCallable<SearchEventsParams, SearchEventsResult>(functions, 'searchEvents'),
  getRecommendations: httpsCallable<{ limit?: number }, Event[]>(functions, 'getRecommendations'),
  syncCalendar: httpsCallable<{ eventId: string }, void>(functions, 'syncCalendar'),
  uploadImage: httpsCallable<UploadImageParams, { urls: string[] }>(functions, 'uploadImage'),
} as const;

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS FOR FUNCTIONS
// -----------------------------------------------------------------------------
interface CreateEventParams {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    venueName?: string;
    venueId?: string;
  };
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  maxAttendees?: number;
  isRecurring: boolean;
  recurrenceRule?: string;
}

interface RSVPStatus {
  status: 'going' | 'interested' | 'not_going';
}

interface SearchEventsParams {
  query?: string;
  category?: string;
  city?: string;
  state?: string;
  startDate?: Date;
  endDate?: Date;
  location?: { latitude: number; longitude: number };
  radius?: number; // km
  limit?: number;
  cursor?: string;
}

interface SearchEventsResult {
  events: Event[];
  nextCursor?: string;
  hasMore: boolean;
}

interface UploadImageParams {
  type: 'event_cover' | 'event_gallery' | 'profile_avatar' | 'venue_photo';
  eventId?: string;
  base64: string;
  fileName: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    geohash: string;
    venueName?: string;
  };
  organizerId: string;
  coOrganizerIds: string[];
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  attendeeIds: string[];
  coverImageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// ANALYTICS HELPERS
// -----------------------------------------------------------------------------
export const analytics = {
  logEvent: (eventName: string, parameters?: Record<string, string | number | boolean>) => {
    if (analytics) {
      logEvent(analytics, eventName, parameters);
    }
    // Also log to Firestore for server-side analytics
    collections.analytics().add({
      eventName,
      parameters: parameters || {},
      timestamp: new Date(),
      userId: auth.currentUser?.uid,
    }).catch(console.error);
  },

  logScreenView: (screenName: string, screenClass?: string) => {
    analytics.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  },

  logEventView: (eventId: string, eventTitle: string) => {
    analytics.logEvent('event_view', { event_id: eventId, event_title: eventTitle });
  },

  logEventCreate: (eventId: string, category: string) => {
    analytics.logEvent('event_create', { event_id: eventId, category });
  },

  logRSVP: (eventId: string, status: string) => {
    analytics.logEvent('rsvp', { event_id: eventId, status });
  },

  logSearch: (query: string, resultsCount: number) => {
    analytics.logEvent('search', { query, results_count: resultsCount });
  },

  logShare: (eventId: string, method: string) => {
    analytics.logEvent('share', { event_id: eventId, method });
  },
};

// -----------------------------------------------------------------------------
// EXPORT DEFAULT
// -----------------------------------------------------------------------------
export default {
  app: getFirebaseApp,
  auth: getAuthInstance,
  db: getFirestoreInstance,
  storage: getStorageInstance,
  functions: getFunctionsInstance,
  analytics: getAnalyticsInstance,
  connectEmulators,
  collections,
  subCollections,
  callableFunctions,
  analytics: analytics,
};