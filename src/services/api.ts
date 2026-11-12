// =============================================================================
// COMMUNITY EVENTS APP - API SERVICE
// =============================================================================

import {
  getFunctionsInstance,
  getFirestoreInstance,
  getAuthInstance,
  collections,
  subCollections,
  callableFunctions,
} from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  GeoPoint,
  FieldValue,
  arrayRemove,
  arrayUnion,
} from 'firebase/firestore';
import {
  Event,
  EventAttendee,
  EventComment,
  UserProfile,
  Category,
  Venue,
  Notification,
  Report,
  RSVPStatus,
  EventVisibility,
  SearchEventsParams,
  SearchEventsResult,
  PaginatedResponse,
  CreateEventForm,
  EditProfileForm,
} from '@/types';

const functions = getFunctionsInstance();
const db = getFirestoreInstance();
const auth = getAuthInstance();

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

const convertToTimestamp = (date: Date | undefined): Timestamp | undefined => {
  if (!date) return undefined;
  return Timestamp.fromDate(date);
};

const mapEventDoc = (doc: DocumentSnapshot | QueryDocumentSnapshot): Event => {
  const data = doc.data()!;
  return {
    id: doc.id,
    type: data['type'] || 'special_event',
    title: data['title'],
    description: data['description'],
    startDate: convertTimestamp(data['startDate'])!,
    endDate: convertTimestamp(data['endDate'])!,
    location: {
      ...data['location'],
      coordinates: new GeoPoint(
        data['location'].coordinates.latitude,
        data['location'].coordinates.longitude
      ),
    },
    organizerId: data['organizerId'],
    coOrganizerIds: data['coOrganizerIds'] || [],
    category: data['category'],
    tags: data['tags'] || [],
    visibility: data['visibility'],
    status: data['status'] || 'published',
    attendeeIds: data['attendeeIds'] || [],
    maxAttendees: data['maxAttendees'],
    coverImageUrls: data['coverImageUrls'],
    coverImageOriginal: data['coverImageOriginal'],
    galleryImages: data['galleryImages'],
    googleCalendarEventId: data['googleCalendarEventId'],
    isRecurring: data['isRecurring'] || false,
    recurrenceRule: data['recurrenceRule'],
    remindersSent: data['remindersSent'],
    createdAt: convertTimestamp(data['createdAt'])!,
    updatedAt: convertTimestamp(data['updatedAt'])!,
    cancelledAt: convertTimestamp(data['cancelledAt']),
    cancellationReason: data['cancellationReason'],
    moderationFlagged: data['moderationFlagged'],
    moderationReason: data['moderationReason'],
  };
};

const mapUserDoc = (doc: DocumentSnapshot | QueryDocumentSnapshot): UserProfile => {
  const data = doc.data()!;
  return {
    uid: doc.id,
    displayName: data['displayName'],
    email: data['email'],
    photoURL: data['photoURL'],
    bio: data['bio'],
    location: data['location'],
    notificationSettings: data['notificationSettings'],
    privacySettings: data['privacySettings'],
    role: data['role'] || 'user',
    followerIds: data['followerIds'] || [],
    followingIds: data['followingIds'] || [],
    savedEventIds: data['savedEventIds'] || [],
    interestedCategories: data['interestedCategories'],
    fcmToken: data['fcmToken'],
    googleCalendarTokens: data['googleCalendarTokens'],
    createdAt: convertTimestamp(data['createdAt'])!,
    updatedAt: convertTimestamp(data['updatedAt'])!,
    lastActiveAt: convertTimestamp(data['lastActiveAt']),
    suspended: data['suspended'],
    suspensionReason: data['suspensionReason'],
  };
};

// -----------------------------------------------------------------------------
// EVENTS API
// -----------------------------------------------------------------------------
export const eventsApi = {
  // Get a single event by ID
  async getEvent(eventId: string): Promise<Event | null> {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (!eventDoc.exists()) return null;
    return mapEventDoc(eventDoc);
  },

  // Get multiple events by IDs
  async getEvents(eventIds: string[]): Promise<Event[]> {
    if (eventIds.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < eventIds.length; i += 30) {
      chunks.push(eventIds.slice(i, i + 30));
    }

    const results: Event[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, 'events'), where('__name__', 'in', chunk));
      const snapshot = await getDocs(q);
      results.push(...snapshot.docs.map(mapEventDoc));
    }
    return results;
  },

  // Search events with filters
  async searchEvents(params: SearchEventsParams): Promise<SearchEventsResult> {
    const {
      query: searchQuery,
      category,
      city,
      state,
      startDate,
      endDate,
      center,
      radiusKm = 50,
      limit: limitCount = 20,
      cursor,
    } = params;

    let q = query(collection(db, 'events'), orderBy('startDate', 'asc'));

    // Apply filters
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (city) {
      q = query(q, where('location.city', '==', city));
    }
    if (state) {
      q = query(q, where('location.state', '==', state));
    }
    if (startDate) {
      q = query(q, where('startDate', '>=', convertToTimestamp(startDate)!));
    }
    if (endDate) {
      q = query(q, where('startDate', '<=', convertToTimestamp(endDate)!));
    }
    // Only public events by default
    q = query(q, where('visibility', '==', 'public'));
    q = query(q, where('status', '==', 'published'));

    if (cursor) {
      const cursorDoc = await getDoc(doc(db, 'events', cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    q = query(q, limit(limitCount + 1));

    const snapshot = await getDocs(q);
    const events = snapshot.docs.slice(0, limitCount).map(mapEventDoc);
    const hasMore = snapshot.docs.length > limitCount;
    const nextCursor = hasMore && snapshot.docs[limitCount] ? snapshot.docs[limitCount].id : undefined;

    return { events, nextCursor, hasMore };
  },

  // Get events near a location (using geohash)
  async getEventsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limitCount: number = 20
  ): Promise<Event[]> {
    // This would use the geohash index - simplified for now
    return this.searchEvents({
      center: { lat: latitude, lng: longitude },
      radiusKm,
      limit: limitCount,
    }).then(r => r.events);
  },

  // Get events by organizer
  async getEventsByOrganizer(organizerId: string, limitCount: number = 20): Promise<Event[]> {
    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', organizerId),
      orderBy('startDate', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapEventDoc);
  },

  // Get events user is attending
  async getUserAttendingEvents(userId: string, limitCount: number = 20): Promise<Event[]> {
    const q = query(
      collection(db, 'events'),
      where('attendeeIds', 'array-contains', userId),
      where('status', '==', 'published'),
      orderBy('startDate', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapEventDoc);
  },

  // Create a new event
  async createEvent(data: CreateEventForm, userId: string): Promise<string> {
    const eventRef = doc(collection(db, 'events'));
    const now = serverTimestamp();

    const eventData = {
      title: data.title,
      description: data.description,
      startDate: convertToTimestamp(data.startDate),
      endDate: convertToTimestamp(data.endDate),
      location: {
        ...data.location,
        coordinates: new GeoPoint(
          data.location.coordinates.latitude,
          data.location.coordinates.longitude
        ),
        geohash: '', // Will be set by Cloud Function
      },
      organizerId: userId,
      coOrganizerIds: [],
      category: data.category,
      tags: data.tags,
      visibility: data.visibility,
      status: 'published',
      attendeeIds: [userId],
      maxAttendees: data.maxAttendees,
      isRecurring: data.isRecurring,
      recurrenceRule: data.recurrenceRule,
      createdAt: now,
      updatedAt: now,
    };

    await addDoc(collection(db, 'events'), eventData);
    return eventRef.id;
  },

  // Update an event
  async updateEvent(eventId: string, data: Partial<CreateEventForm>): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data['title']) updateData['title'] = data['title'];
    if (data['description']) updateData['description'] = data['description'];
    if (data['startDate']) updateData['startDate'] = convertToTimestamp(data['startDate']);
    if (data['endDate']) updateData['endDate'] = convertToTimestamp(data['endDate']);
    if (data['location']) {
      updateData['location'] = {
        ...data['location'],
        coordinates: new GeoPoint(
          data['location'].coordinates.latitude,
          data['location'].coordinates.longitude
        ),
      };
    }
    if (data['category']) updateData['category'] = data['category'];
    if (data['tags']) updateData['tags'] = data['tags'];
    if (data['visibility']) updateData['visibility'] = data['visibility'];
    if (data['maxAttendees'] !== undefined) updateData['maxAttendees'] = data['maxAttendees'];

    await updateDoc(eventRef, updateData);
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId));
  },

  // RSVP to an event
  async rsvpEvent(eventId: string, status: RSVPStatus): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const batch = writeBatch(db);
    const eventRef = doc(db, 'events', eventId);
    const attendeeRef = doc(collection(db, 'events', eventId, 'attendees'), userId);

    // Check current RSVP
    const attendeeDoc = await getDoc(attendeeRef);
    const data = attendeeDoc.data();
    const previousStatus = data ? data['status'] : null;

    // Update attendee record
    batch.set(attendeeRef, {
      userId,
      eventId,
      status,
      respondedAt: serverTimestamp(),
    });

    // Update event attendee list
    if (previousStatus === 'going' && status !== 'going') {
      batch.update(eventRef, {
        attendeeIds: arrayRemove(userId),
      });
    } else if (previousStatus !== 'going' && status === 'going') {
      batch.update(eventRef, {
        attendeeIds: arrayUnion(userId),
      });
    }

    await batch.commit();
  },

  // Get user's RSVP for an event
  async getUserRSVP(eventId: string): Promise<EventAttendee | null> {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;

    const attendeeDoc = await getDoc(doc(db, 'events', eventId, 'attendees', userId));
    if (!attendeeDoc.exists()) return null;

    const data = attendeeDoc.data()!;
    return {
      userId: data['userId'],
      eventId: data['eventId'],
      status: data['status'],
      respondedAt: convertTimestamp(data['respondedAt'])!,
      checkedInAt: convertTimestamp(data['checkedInAt']),
    };
  },

  // Get event attendees
  async getEventAttendees(eventId: string, status?: RSVPStatus): Promise<EventAttendee[]> {
    let q = query(
      collection(db, 'events', eventId, 'attendees'),
      orderBy('respondedAt', 'desc')
    );
    if (status) {
      q = query(q, where('status', '==', status));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data['userId'],
        eventId: data['eventId'],
        status: data['status'],
        respondedAt: convertTimestamp(data['respondedAt'])!,
        checkedInAt: convertTimestamp(data['checkedInAt']),
      };
    });
  },

  // Save/unsave event
  async toggleSaveEvent(eventId: string): Promise<boolean> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const savedRef = doc(db, 'users', userId, 'savedEvents', eventId);
    const savedDoc = await getDoc(savedRef);

    if (savedDoc.exists()) {
      await deleteDoc(savedRef);
      return false; // unsaved
    } else {
      await setDoc(savedRef, { savedAt: serverTimestamp() });
      return true; // saved
    }
  },

  // Check if event is saved
  async isEventSaved(eventId: string): Promise<boolean> {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;

    const savedDoc = await getDoc(doc(db, 'users', userId, 'savedEvents', eventId));
    return savedDoc.exists();
  },

  // Get saved events
  async getSavedEvents(limitCount: number = 20): Promise<Event[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const q = query(
      collection(db, 'users', userId, 'savedEvents'),
      orderBy('savedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const eventIds = snapshot.docs.map(d => d.id);
    return this.getEvents(eventIds);
  },
};

// -----------------------------------------------------------------------------
// USERS API
// -----------------------------------------------------------------------------
export const usersApi = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    return mapUserDoc(userDoc);
  },

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    return this.getUserProfile(userId);
  },

  // Update user profile
  async updateProfile(data: EditProfileForm): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', userId);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data['displayName']) updateData['displayName'] = data['displayName'];
    if (data['bio'] !== undefined) updateData['bio'] = data['bio'];
    if (data['location']) updateData['location'] = data['location'];
    if (data['notificationSettings']) updateData['notificationSettings'] = data['notificationSettings'];
    if (data['privacySettings']) updateData['privacySettings'] = data['privacySettings'];

    await updateDoc(userRef, updateData);
  },

  // Search users
  async searchUsers(searchQuery: string, limitCount: number = 20): Promise<UserProfile[]> {
    // This would need a search index - simplified
    const q = query(
      collection(db, 'users'),
      where('displayName', '>=', searchQuery),
      where('displayName', '<=', searchQuery + ''),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapUserDoc);
  },

  // Follow/unfollow user
  async toggleFollow(targetUserId: string): Promise<boolean> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    if (userId === targetUserId) throw new Error('Cannot follow yourself');

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    const targetRef = doc(db, 'users', targetUserId);

    const userDoc = await getDoc(userRef);
    const isFollowing = userDoc.data()?.['followingIds']?.includes(targetUserId) || false;

    if (isFollowing) {
      batch.update(userRef, {
        followingIds: arrayRemove(targetUserId),
      });
      batch.update(targetRef, {
        followerIds: arrayRemove(userId),
      });
    } else {
      batch.update(userRef, {
        followingIds: arrayUnion(targetUserId),
      });
      batch.update(targetRef, {
        followerIds: arrayUnion(userId),
      });
    }

    await batch.commit();
    return !isFollowing;
  },

  // Get followers
  async getFollowers(userId: string, limitCount: number = 50): Promise<UserProfile[]> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const followerIds = userDoc.data()?.['followerIds'] || [];
    return this.getUsers(followerIds.slice(0, limitCount));
  },

  // Get following
  async getFollowing(userId: string, limitCount: number = 50): Promise<UserProfile[]> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const followingIds = userDoc.data()?.['followingIds'] || [];
    return this.getUsers(followingIds.slice(0, limitCount));
  },

  // Get multiple users
  async getUsers(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
      chunks.push(userIds.slice(i, i + 30));
    }

    const results: UserProfile[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
      const snapshot = await getDocs(q);
      results.push(...snapshot.docs.map(mapUserDoc));
    }
    return results;
  },
};

// -----------------------------------------------------------------------------
// CATEGORIES API
// -----------------------------------------------------------------------------
export const categoriesApi = {
  async getAllCategories(): Promise<Category[]> {
    const q = query(
      collection(db, 'categories'),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Category));
  },

  async getCategory(categoryId: string): Promise<Category | null> {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (!categoryDoc.exists()) return null;
    return { id: categoryDoc.id, ...categoryDoc.data() } as Category;
  },
};

// -----------------------------------------------------------------------------
// VENUES API
// -----------------------------------------------------------------------------
export const venuesApi = {
  async searchVenues(searchQuery: string, location?: { latitude: number; longitude: number }): Promise<Venue[]> {
    // Simplified - would use geohash for location-based search
    const q = query(
      collection(db, 'venues'),
      where('status', '==', 'active'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(venueDoc => ({ id: venueDoc.id, ...venueDoc.data() } as Venue));
  },

  async getVenue(venueId: string): Promise<Venue | null> {
    const venueDoc = await getDoc(doc(db, 'venues', venueId));
    if (!venueDoc.exists()) return null;
    return { id: venueDoc.id, ...venueDoc.data() } as Venue;
  },
};

// -----------------------------------------------------------------------------
// NOTIFICATIONS API
// -----------------------------------------------------------------------------
export const notificationsApi = {
  async getNotifications(limitCount: number = 30, cursor?: string): Promise<PaginatedResponse<Notification>> {
    const userId = auth.currentUser?.uid;
    if (!userId) return { data: [], hasMore: false };

    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(db, 'notifications', cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.slice(0, limitCount).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data['createdAt'])!,
        readAt: convertTimestamp(data['readAt']),
      } as Notification;
    });

    const hasMore = snapshot.docs.length > limitCount;
    const nextCursor = hasMore && snapshot.docs[limitCount] ? snapshot.docs[limitCount].id : undefined;

    return { data: notifications, nextCursor, hasMore };
  },

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });
  },

  async markAllAsRead(): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      limit(500)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true, readAt: serverTimestamp() });
    });
    await batch.commit();
  },

  async getUnreadCount(): Promise<number> {
    const userId = auth.currentUser?.uid;
    if (!userId) return 0;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },
};

// -----------------------------------------------------------------------------
// COMMENTS API
// -----------------------------------------------------------------------------
export const commentsApi = {
  async getEventComments(eventId: string, limitCount: number = 50, cursor?: string): Promise<PaginatedResponse<EventComment>> {
    let q = query(
      collection(db, 'events', eventId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(db, 'events', eventId, 'comments', cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.slice(0, limitCount).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventId,
        userId: data['userId'],
        content: data['content'],
        createdAt: convertTimestamp(data['createdAt'])!,
        updatedAt: convertTimestamp(data['updatedAt']),
        hidden: data['hidden'],
        moderationFlagged: data['moderationFlagged'],
        moderationReason: data['moderationReason'],
      };
    });

    const hasMore = snapshot.docs.length > limitCount;
    const nextCursor = hasMore && snapshot.docs[limitCount] ? snapshot.docs[limitCount].id : undefined;

    return { data: comments, nextCursor, hasMore };
  },

  async addComment(eventId: string, content: string): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const commentRef = doc(collection(db, 'events', eventId, 'comments'));
    await setDoc(commentRef, {
      eventId,
      userId,
      content,
      createdAt: serverTimestamp(),
    });
    return commentRef.id;
  },

  async updateComment(eventId: string, commentId: string, content: string): Promise<void> {
    await updateDoc(doc(db, 'events', eventId, 'comments', commentId), {
      content,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteComment(eventId: string, commentId: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId, 'comments', commentId));
  },
};

// -----------------------------------------------------------------------------
// REPORTS API
// -----------------------------------------------------------------------------
export const reportsApi = {
  async createReport(
    targetType: 'event' | 'comment' | 'user' | 'venue',
    targetId: string,
    reason: string
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const reportRef = doc(collection(db, 'reports'));
    await setDoc(reportRef, {
      targetType,
      targetId,
      reporterId: userId,
      reason,
      severity: 'medium',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return reportRef.id;
  },
};

// Export all APIs
export const api = {
  events: eventsApi,
  users: usersApi,
  categories: categoriesApi,
  venues: venuesApi,
  notifications: notificationsApi,
  comments: commentsApi,
  reports: reportsApi,
};

export default api;