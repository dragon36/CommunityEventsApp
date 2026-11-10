import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const auth = admin.auth();

interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  bio?: string;
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: admin.firestore.GeoPoint;
  };
  notificationSettings: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    newEventsNearby: boolean;
    eventReminders: boolean;
    eventUpdates: boolean;
    friendActivity: boolean;
    weeklyDigest: boolean;
  };
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showLocation: boolean;
    showAttendingEvents: boolean;
  };
  role: 'user' | 'moderator' | 'admin';
  followerIds: string[];
  followingIds: string[];
  savedEventIds: string[];
  fcmToken?: string;
}

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  try {
    // Check if user already has a profile (might have been created via custom signup)
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      functions.logger.info(`User profile already exists for ${uid}`);
      return;
    }

    // Create default user profile
    const profile: UserProfile = {
      displayName: displayName || email?.split('@')[0] || 'User',
      email: email || '',
      photoURL: photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationSettings: {
        pushEnabled: true,
        emailEnabled: true,
        newEventsNearby: true,
        eventReminders: true,
        eventUpdates: true,
        friendActivity: true,
        weeklyDigest: true
      },
      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showLocation: true,
        showAttendingEvents: true
      },
      role: 'user',
      followerIds: [],
      followingIds: [],
      savedEventIds: []
    };

    await userRef.set(profile);

    // Create default notification preferences document
    await db.collection('notificationPreferences').doc(uid).set({
      userId: uid,
      channels: {
        push: { enabled: true, events: ['all'] },
        email: { enabled: true, events: ['important'] },
        inApp: { enabled: true, events: ['all'] }
      },
      frequency: 'immediate',
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Set custom claims for role-based access
    await auth.setCustomUserClaims(uid, { role: 'user' });

    functions.logger.info(`Created profile for new user ${uid}`);
  } catch (error) {
    functions.logger.error(`Error creating profile for user ${uid}:`, error);
    throw error;
  }
});