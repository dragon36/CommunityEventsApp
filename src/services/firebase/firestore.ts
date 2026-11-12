import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  limitToLast,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
  CollectionReference,
  DocumentReference,
  DocumentData,
  Firestore,
} from 'firebase/firestore';
import { firestore } from './config';
import type {
  Event,
  EventFormData,
  UserProfile,
  AdminStats,
  AppHealth,
  AdminUser,
  AdminEvent,
  AdminAction,
  PaginatedResponse,
  EventStatus,
  UserRole,
  EventLocation,
} from '@/types';

// ============================================
// Collection References
// ============================================

const USERS_COLLECTION = 'users';
const EVENTS_COLLECTION = 'events';
const ADMIN_STATS_DOC = 'admin/stats';
const ADMIN_HEALTH_DOC = 'admin/health';
const ADMIN_ACTIONS_COLLECTION = 'admin/actions';

const usersCollection = collection(firestore, USERS_COLLECTION);
const eventsCollection = collection(firestore, EVENTS_COLLECTION);
const adminActionsCollection = collection(firestore, ADMIN_ACTIONS_COLLECTION);

// ============================================
// Helper Functions
// ============================================

const convertTimestamps = <T extends DocumentData>(data: T): T => {
  const converted = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(converted)) {
    const value = converted[key];
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    } else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      converted[key] = new Timestamp((value as { seconds: number; nanoseconds: number }).seconds, (value as { seconds: number; nanoseconds: number }).nanoseconds).toDate();
    }
  }
  return converted as T;
};

const toFirestoreTimestamps = (data: Record<string, unknown>): Record<string, unknown> => {
  const converted = { ...data };
  for (const key of Object.keys(converted)) {
    const value = converted[key];
    if (value instanceof Date) {
      converted[key] = Timestamp.fromDate(value);
    }
  }
  return converted;
};

// ============================================
// User Profile Service
// ============================================

export const userService = {
  // Create user profile after registration
  async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(usersCollection, uid);
    await setDoc(userRef, {
      uid,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      emailVerified: false,
      eventsCreated: [],
      eventsAttending: [],
      notificationSettings: {
        eventApproved: true,
        eventRejected: true,
        eventReminder: true,
        newEventsNearby: true,
        adminAnnouncements: true,
      },
      ...data,
    });
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(usersCollection, uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) return null;
    return { uid: snapshot.id, ...convertTimestamps(snapshot.data()) } as UserProfile;
  },

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(usersCollection, uid);
    await updateDoc(userRef, {
      ...toFirestoreTimestamps(data as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  },

  // Update last login
  async updateLastLogin(uid: string): Promise<void> {
    const userRef = doc(usersCollection, uid);
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
  },

  // Get user by email (admin only)
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const q = query(usersCollection, where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const userDoc = snapshot.docs[0]!;
    return { uid: userDoc.id, ...convertTimestamps(userDoc.data()) } as UserProfile;
  },

  // Admin: Get paginated users
  async getUsersPaginated(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    filters?: { role?: UserRole; isActive?: boolean; search?: string }
  ): Promise<PaginatedResponse<AdminUser>> {
    let q = query(usersCollection, orderBy('createdAt', 'desc'), limit(pageSize + 1));

    if (filters?.role) {
      q = query(q, where('role', '==', filters.role));
    }
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const lastVisible = docs[docs.length - 1];

    const data = docs.map((doc) => ({
      uid: doc.id,
      ...convertTimestamps(doc.data()),
    })) as AdminUser[];

    return { data, lastDoc: lastVisible, hasMore };
  },

  // Admin: Update user role
  async updateUserRole(uid: string, role: UserRole, adminId: string): Promise<void> {
    const userRef = doc(usersCollection, uid);
    await runTransaction(firestore, async (transaction) => {
      transaction.update(userRef, { role });
      // Log admin action
      const actionRef = doc(adminActionsCollection);
      transaction.set(actionRef, {
        adminId,
        action: role === 'admin' ? 'enable_user' : 'disable_user',
        targetType: 'user',
        targetId: uid,
        timestamp: serverTimestamp(),
      });
    });
  },

  // Admin: Toggle user active status
  async toggleUserActive(uid: string, isActive: boolean, adminId: string): Promise<void> {
    const userRef = doc(usersCollection, uid);
    await runTransaction(firestore, async (transaction) => {
      transaction.update(userRef, { isActive });
      const actionRef = doc(adminActionsCollection);
      transaction.set(actionRef, {
        adminId,
        action: isActive ? 'enable_user' : 'disable_user',
        targetType: 'user',
        targetId: uid,
        timestamp: serverTimestamp(),
      });
    });
  },

  // Admin: Reset user password (sends reset email)
  async requestPasswordReset(email: string): Promise<void> {
    // This would typically call a Cloud Function to use Firebase Admin SDK
    // For now, we'll use the client SDK which requires the user to be logged in
    // In production, implement a Cloud Function for this
    const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
    const { auth } = await import('./config');
    await sendPasswordResetEmail(auth, email);
  },
};

// ============================================
// Event Service
// ============================================

export const eventService = {
  // Create new event (status: pending)
  async createEvent(data: EventFormData, userId: string): Promise<string> {
    const eventRef = doc(eventsCollection);
    const eventData: Omit<Event, 'id'> = {
      ...data,
      startDate: Timestamp.fromDate(data.startDate) as any,
      endDate: Timestamp.fromDate(data.endDate) as any,
      location: {
        ...data.location,
        coordinates: data.location.coordinates,
        geohash: '', // Will be generated by Cloud Function
      } as EventLocation,
      organizerId: userId,
      coOrganizerIds: [],
      category: data.type, // Use type as category for now
      tags: data.tags ?? [],
      visibility: data.isPublic ? 'public' : 'private',
      status: 'pending',
      attendeeIds: [],
      maxAttendees: data.maxAttendees,
      isRecurring: false,
      remindersSent: [],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: userId,
      isPublic: data.isPublic ?? true,
      images: data.images ?? [],
      attendeesCount: 0,
    };

    await setDoc(eventRef, eventData);

    // Update user's eventsCreated array
    const userRef = doc(usersCollection, userId);
    const userSnap = await getDoc(userRef);
    const existingEventsCreated = userSnap.exists() ? userSnap.data()?.['eventsCreated'] || [] : [];
    await updateDoc(userRef, {
      ['eventsCreated']: [...existingEventsCreated, eventRef.id],
    });

    // Log admin action for tracking
    const actionRef = doc(adminActionsCollection);
    await setDoc(actionRef, {
      adminId: 'system',
      action: 'create_event',
      targetType: 'event',
      targetId: eventRef.id,
      targetName: data.title,
      timestamp: serverTimestamp(),
    });

    return eventRef.id;
  },

  // Get event by ID
  async getEvent(eventId: string): Promise<Event | null> {
    const eventRef = doc(eventsCollection, eventId);
    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...convertTimestamps(snapshot.data()) } as Event;
  },

  // Update event (owner or admin)
  async updateEvent(eventId: string, data: Partial<EventFormData>, userId: string, isAdmin = false): Promise<void> {
    const eventRef = doc(eventsCollection, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    const event = eventSnap.data() as Event;

    // Check permissions
    if (!isAdmin && event.createdBy !== userId) {
      throw new Error('Unauthorized to update this event');
    }

    // Don't allow status changes unless admin
    const { status, approvedBy, approvedAt, rejectionReason, ...updateData } = data as Partial<Event>;

    await updateDoc(eventRef, {
      ...toFirestoreTimestamps(updateData as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  },

  // Delete event (owner or admin)
  async deleteEvent(eventId: string, userId: string, isAdmin = false): Promise<void> {
    const eventRef = doc(eventsCollection, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    const event = eventSnap.data() as Event;

    if (!isAdmin && event.createdBy !== userId) {
      throw new Error('Unauthorized to delete this event');
    }

    await deleteDoc(eventRef);

    // Remove from user's eventsCreated
    const userRef = doc(usersCollection, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const eventsCreated = userSnap.data()?.['eventsCreated'] || [];
      await updateDoc(userRef, {
        ['eventsCreated']: eventsCreated.filter((id: string) => id !== eventId),
      });
    }
  },

  // Get approved events for map/list (public)
  async getApprovedEvents(
    region?: { center: { lat: number; lng: number }; radiusKm: number },
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<PaginatedResponse<Event>> {
    let q = query(
      eventsCollection,
      where('status', '==', 'approved'),
      orderBy('startDate', 'asc'),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const lastVisible = docs[docs.length - 1];

    let data = docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Event[];

    // Filter by region if provided (client-side for simplicity, use GeoFire for production)
    if (region) {
      data = data.filter((event) => {
        const distance = calculateDistance(
          region.center.lat,
          region.center.lng,
          event.location.coordinates.latitude,
          event.location.coordinates.longitude
        );
        return distance <= region.radiusKm;
      });
    }

    return { data, lastDoc: lastVisible, hasMore };
  },

  // Get user's events
  async getUserEvents(userId: string, status?: EventStatus): Promise<Event[]> {
    let q = query(
      eventsCollection,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Event[];
  },

  // Admin: Get pending events for approval
  async getPendingEvents(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<PaginatedResponse<AdminEvent>> {
    let q = query(
      eventsCollection,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const lastVisible = docs[docs.length - 1];

    // Get creator info for each event
    const events = await Promise.all(
      docs.map(async (doc) => {
        const eventData = { id: doc.id, ...convertTimestamps(doc.data()) } as Event;
        const creator = eventData.createdBy ? await userService.getUserProfile(eventData.createdBy) : null;
        return {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          status: eventData.status,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          location: eventData.location,
          organizerId: eventData.organizerId,
          organizerName: creator?.displayName || 'Unknown',
          organizerEmail: creator?.email || 'Unknown',
          creatorName: creator?.displayName || 'Unknown',
          attendeeCount: eventData.attendeesCount || 0,
          createdAt: eventData.createdAt,
          approvedAt: eventData.approvedAt,
          approvedBy: eventData.approvedBy,
          rejectionReason: eventData.rejectionReason,
          images: eventData.images,
        } as AdminEvent;
      })
    );

    return { data: events, lastDoc: lastVisible, hasMore };
  },

  // Admin: Approve event
  async approveEvent(eventId: string, adminId: string): Promise<void> {
    const eventRef = doc(eventsCollection, eventId);
    await runTransaction(firestore, async (transaction) => {
      transaction.update(eventRef, {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const actionRef = doc(adminActionsCollection);
      transaction.set(actionRef, {
        adminId,
        action: 'approve_event',
        targetType: 'event',
        targetId: eventId,
        timestamp: serverTimestamp(),
      });
    });
  },

  // Admin: Reject event
  async rejectEvent(eventId: string, adminId: string, reason: string): Promise<void> {
    const eventRef = doc(eventsCollection, eventId);
    await runTransaction(firestore, async (transaction) => {
      transaction.update(eventRef, {
        status: 'rejected',
        approvedBy: adminId,
        approvedAt: serverTimestamp(),
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      const actionRef = doc(adminActionsCollection);
      transaction.set(actionRef, {
        adminId,
        action: 'reject_event',
        targetType: 'event',
        targetId: eventId,
        targetName: reason,
        timestamp: serverTimestamp(),
      });
    });
  },

  // Admin: Get all events with pagination
  async getAllEventsPaginated(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    statusFilter?: EventStatus
  ): Promise<PaginatedResponse<AdminEvent>> {
    let q = query(eventsCollection, orderBy('createdAt', 'desc'), limit(pageSize + 1));

    if (statusFilter) {
      q = query(q, where('status', '==', statusFilter));
    }
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const lastVisible = docs[docs.length - 1];

    const events = await Promise.all(
      docs.map(async (doc) => {
        const eventData = { id: doc.id, ...convertTimestamps(doc.data()) } as Event;
        const creator = eventData.createdBy ? await userService.getUserProfile(eventData.createdBy) : null;
        return {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          status: eventData.status,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          location: eventData.location,
          organizerId: eventData.organizerId,
          organizerName: creator?.displayName || 'Unknown',
          organizerEmail: creator?.email || 'Unknown',
          creatorName: creator?.displayName || 'Unknown',
          attendeeCount: eventData.attendeesCount || 0,
          createdAt: eventData.createdAt,
          approvedAt: eventData.approvedAt,
          approvedBy: eventData.approvedBy,
          rejectionReason: eventData.rejectionReason,
          images: eventData.images,
        } as AdminEvent;
      })
    );

    return { data: events, lastDoc: lastVisible, hasMore };
  },
};

// ============================================
// Admin Service
// ============================================

export const adminService = {
  // Get admin stats
  async getStats(): Promise<AdminStats | null> {
    const statsRef = doc(firestore, ADMIN_STATS_DOC);
    const snapshot = await getDoc(statsRef);
    if (!snapshot.exists()) return null;
    return convertTimestamps(snapshot.data()) as AdminStats;
  },

  // Update stats (called by Cloud Functions)
  async updateStats(stats: Partial<AdminStats>): Promise<void> {
    const statsRef = doc(firestore, ADMIN_STATS_DOC);
    await setDoc(statsRef, { ...stats, updatedAt: serverTimestamp() }, { merge: true });
  },

  // Get app health
  async getHealth(): Promise<AppHealth | null> {
    const healthRef = doc(firestore, ADMIN_HEALTH_DOC);
    const snapshot = await getDoc(healthRef);
    if (!snapshot.exists()) return null;
    return convertTimestamps(snapshot.data()) as AppHealth;
  },

  // Update health (called by Cloud Functions)
  async updateHealth(health: Partial<AppHealth>): Promise<void> {
    const healthRef = doc(firestore, ADMIN_HEALTH_DOC);
    await setDoc(healthRef, { ...health, lastChecked: serverTimestamp() }, { merge: true });
  },

  // Get admin action log
  async getActionLog(pageSize: number = 50): Promise<AdminAction[]> {
    const q = query(adminActionsCollection, orderBy('timestamp', 'desc'), limit(pageSize));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as AdminAction[];
  },
};

// ============================================
// Utility Functions
// ============================================

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export { calculateDistance };