// =============================================================================
// COMMUNITY EVENTS APP - API SERVICE (Supabase)
// =============================================================================
// This API layer wraps the Supabase database adapter to provide a familiar
// interface for the app components. It uses the factory services which now
// point exclusively to Supabase.

import { getDatabaseService, getAuthService } from '@/services/factory';
import type {
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

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

const convertTimestamp = (timestamp: Date | string | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// -----------------------------------------------------------------------------
// EVENTS API
// -----------------------------------------------------------------------------
export const eventsApi = {
  // Get a single event by ID
  async getEvent(eventId: string): Promise<Event | null> {
    const db = await getDatabaseService();
    return db.getEvent(eventId);
  },

  // Get multiple events by IDs
  async getEvents(eventIds: string[]): Promise<Event[]> {
    if (eventIds.length === 0) return [];
    const db = await getDatabaseService();
    const results: Event[] = [];
    for (const id of eventIds) {
      const event = await db.getEvent(id);
      if (event) results.push(event);
    }
    return results;
  },

  // Search events with filters
  async searchEvents(params: SearchEventsParams): Promise<SearchEventsResult> {
    const db = await getDatabaseService();
    const { center, radiusKm, limit = 20 } = params;
    const region = center ? { center: { lat: center.lat, lng: center.lng }, radiusKm: radiusKm || 50 } : undefined;
    const result = await db.getApprovedEvents(region, limit);
    return {
      events: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },

  // Get events near a location
  async getEventsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limitCount: number = 20
  ): Promise<Event[]> {
    return this.searchEvents({
      center: { lat: latitude, lng: longitude },
      radiusKm,
      limit: limitCount,
    }).then(r => r.events);
  },

  // Get events by organizer
  async getEventsByOrganizer(organizerId: string, limitCount: number = 20): Promise<Event[]> {
    const db = await getDatabaseService();
    return db.getUserEvents(organizerId);
  },

  // Get events user is attending
  async getUserAttendingEvents(userId: string, limitCount: number = 20): Promise<Event[]> {
    const db = await getDatabaseService();
    return db.getUserEvents(userId, 'published'); // Filter by published events
  },

  // Create a new event
  async createEvent(data: CreateEventForm, userId: string): Promise<string> {
    const db = await getDatabaseService();
    return db.createEvent(data as any, userId);
  },

  // Update an event
  async updateEvent(eventId: string, data: Partial<CreateEventForm>): Promise<void> {
    const db = await getDatabaseService();
    const auth = await getAuthService();
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    await db.updateEvent(eventId, data as any, user.uid);
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    const db = await getDatabaseService();
    const auth = await getAuthService();
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    await db.deleteEvent(eventId, user.uid);
  },

  // RSVP to an event
  async rsvpEvent(eventId: string, status: RSVPStatus): Promise<void> {
    // This would need a specific database method - stub for now
    console.warn('rsvpEvent not yet implemented for Supabase');
  },

  // Get user's RSVP for an event
  async getUserRSVP(eventId: string): Promise<EventAttendee | null> {
    console.warn('getUserRSVP not yet implemented for Supabase');
    return null;
  },

  // Get event attendees
  async getEventAttendees(eventId: string, status?: RSVPStatus): Promise<EventAttendee[]> {
    console.warn('getEventAttendees not yet implemented for Supabase');
    return [];
  },

  // Save/unsave event
  async toggleSaveEvent(eventId: string): Promise<boolean> {
    console.warn('toggleSaveEvent not yet implemented for Supabase');
    return false;
  },

  // Check if event is saved
  async isEventSaved(eventId: string): Promise<boolean> {
    console.warn('isEventSaved not yet implemented for Supabase');
    return false;
  },

  // Get saved events
  async getSavedEvents(limitCount: number = 20): Promise<Event[]> {
    console.warn('getSavedEvents not yet implemented for Supabase');
    return [];
  },
};

// -----------------------------------------------------------------------------
// USERS API
// -----------------------------------------------------------------------------
export const usersApi = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = await getDatabaseService();
    return db.getUserProfile(userId);
  },

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const auth = await getAuthService();
    const user = await auth.getCurrentUser();
    if (!user) return null;
    return this.getUserProfile(user.uid);
  },

  // Update user profile
  async updateProfile(data: EditProfileForm): Promise<void> {
    const auth = await getAuthService();
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const db = await getDatabaseService();
    await db.updateUserProfile(user.uid, data);
  },

  // Search users
  async searchUsers(searchQuery: string, limitCount: number = 20): Promise<UserProfile[]> {
    console.warn('searchUsers not yet implemented for Supabase');
    return [];
  },

  // Follow/unfollow user
  async toggleFollow(targetUserId: string): Promise<boolean> {
    console.warn('toggleFollow not yet implemented for Supabase');
    return false;
  },

  // Get followers
  async getFollowers(userId: string, limitCount: number = 50): Promise<UserProfile[]> {
    console.warn('getFollowers not yet implemented for Supabase');
    return [];
  },

  // Get following
  async getFollowing(userId: string, limitCount: number = 50): Promise<UserProfile[]> {
    console.warn('getFollowing not yet implemented for Supabase');
    return [];
  },

  // Get multiple users
  async getUsers(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    const db = await getDatabaseService();
    const results: UserProfile[] = [];
    for (const id of userIds) {
      const user = await db.getUserProfile(id);
      if (user) results.push(user);
    }
    return results;
  },
};

// -----------------------------------------------------------------------------
// CATEGORIES API
// -----------------------------------------------------------------------------
export const categoriesApi = {
  async getAllCategories(): Promise<Category[]> {
    console.warn('getAllCategories not yet implemented for Supabase');
    return [];
  },

  async getCategory(categoryId: string): Promise<Category | null> {
    console.warn('getCategory not yet implemented for Supabase');
    return null;
  },
};

// -----------------------------------------------------------------------------
// VENUES API
// -----------------------------------------------------------------------------
export const venuesApi = {
  async searchVenues(searchQuery: string, location?: { latitude: number; longitude: number }): Promise<Venue[]> {
    console.warn('searchVenues not yet implemented for Supabase');
    return [];
  },

  async getVenue(venueId: string): Promise<Venue | null> {
    console.warn('getVenue not yet implemented for Supabase');
    return null;
  },
};

// -----------------------------------------------------------------------------
// NOTIFICATIONS API
// -----------------------------------------------------------------------------
export const notificationsApi = {
  async getNotifications(limitCount: number = 30, cursor?: string): Promise<PaginatedResponse<Notification>> {
    console.warn('getNotifications not yet implemented for Supabase');
    return { data: [], hasMore: false, nextCursor: cursor };
  },

  async markAsRead(notificationId: string): Promise<void> {
    console.warn('markAsRead not yet implemented for Supabase');
  },

  async markAllAsRead(): Promise<void> {
    console.warn('markAllAsRead not yet implemented for Supabase');
  },

  async getUnreadCount(): Promise<number> {
    console.warn('getUnreadCount not yet implemented for Supabase');
    return 0;
  },
};

// -----------------------------------------------------------------------------
// COMMENTS API
// -----------------------------------------------------------------------------
export const commentsApi = {
  async getEventComments(eventId: string, limitCount: number = 50, cursor?: string): Promise<PaginatedResponse<EventComment>> {
    console.warn('getEventComments not yet implemented for Supabase');
    return { data: [], hasMore: false, nextCursor: cursor };
  },

  async addComment(eventId: string, content: string): Promise<string> {
    console.warn('addComment not yet implemented for Supabase');
    return '';
  },

  async updateComment(eventId: string, commentId: string, content: string): Promise<void> {
    console.warn('updateComment not yet implemented for Supabase');
  },

  async deleteComment(eventId: string, commentId: string): Promise<void> {
    console.warn('deleteComment not yet implemented for Supabase');
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
    console.warn('createReport not yet implemented for Supabase');
    return '';
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