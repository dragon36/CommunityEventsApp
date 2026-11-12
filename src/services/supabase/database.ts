// =============================================================================
// COMMUNITY EVENTS APP - SUPABASE DATABASE ADAPTER
// =============================================================================

import { supabase } from './config';
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
} from '@/types';
import type { DatabaseService } from '../interfaces';

// Helper to convert Supabase timestamps to Date
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const converted = { ...data };
  for (const key of Object.keys(converted)) {
    const value = converted[key];
    if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      converted[key] = new Date(value);
    }
  }
  return converted;
}

// Helper to convert Dates to ISO strings for Supabase
function toSupabaseTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const converted = { ...data };
  for (const key of Object.keys(converted)) {
    const value = converted[key];
    if (value instanceof Date) {
      converted[key] = value.toISOString();
    }
  }
  return converted;
}

// Calculate distance using Haversine formula
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

export const supabaseDatabaseAdapter: DatabaseService = {
  // User Profile Operations
  async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: uid,
        role: 'user',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        is_active: true,
        email_verified: false,
        events_created: [],
        events_attending: [],
        notification_settings: {
          event_approved: true,
          event_rejected: true,
          event_reminder: true,
          new_events_nearby: true,
          admin_announcements: true,
        },
        ...toSupabaseTimestamps(data as Record<string, unknown>),
      });

    if (error) throw new Error(error.message);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }

    return { uid: data.id, ...convertTimestamps(data) } as UserProfile;
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...toSupabaseTimestamps(data as Record<string, unknown>),
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);

    if (error) throw new Error(error.message);
  },

  async updateLastLogin(uid: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', uid);

    if (error) throw new Error(error.message);
  },

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return { uid: data.id, ...convertTimestamps(data) } as UserProfile;
  },

  // User Management (Admin)
  async getUsersPaginated(
    pageSize: number = 20,
    lastDoc?: unknown,
    filters?: { role?: UserRole; isActive?: boolean; search?: string }
  ): Promise<PaginatedResponse<AdminUser>> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, pageSize);

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.search) {
      query = query.or(`display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (lastDoc) {
      // For cursor-based pagination, we'd use the last item's created_at
      query = query.lt('created_at', (lastDoc as any).created_at);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    const users = (data || []).map((user) => ({
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      role: user.role,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
      eventsCreated: user.events_created?.length || 0,
      eventsAttending: user.events_attending?.length || 0,
      suspended: user.suspended,
    })) as AdminUser[];

    const lastVisible = users[users.length - 1];
    const hasMore = count !== null && count > (lastDoc ? pageSize + 1 : pageSize);

    return { data: users, lastDoc: lastVisible, hasMore };
  },

  async updateUserRole(uid: string, role: UserRole, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', uid);

    if (error) throw new Error(error.message);

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action: role === 'admin' ? 'enable_user' : 'disable_user',
      target_type: 'user',
      target_id: uid,
      timestamp: new Date().toISOString(),
    });
  },

  async toggleUserActive(uid: string, isActive: boolean, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', uid);

    if (error) throw new Error(error.message);

    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action: isActive ? 'enable_user' : 'disable_user',
      target_type: 'user',
      target_id: uid,
      timestamp: new Date().toISOString(),
    });
  },

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  // Event Operations
  async createEvent(data: EventFormData, userId: string): Promise<string> {
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: data.title,
        description: data.description,
        type: data.type,
        location: {
          address: data.location.address,
          city: data.location.city || '',
          state: data.location.state || '',
          country: data.location.country || '',
          coordinates: data.location.coordinates,
          geohash: '', // Would be generated by trigger or function
          venue_name: data.location.name,
        },
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending',
        images: [],
        attendees_count: 0,
        is_public: data.isPublic ?? true,
        tags: data.tags ?? [],
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    // Update user's events_created array
    const { data: profile } = await supabase
      .from('profiles')
      .select('events_created')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ events_created: [...(profile.events_created || []), event.id] })
        .eq('id', userId);
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: 'system',
      action: 'create_event',
      target_type: 'event',
      target_id: event.id,
      target_name: data.title,
      timestamp: new Date().toISOString(),
    });

    return event.id;
  },

  async getEvent(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return { id: data.id, ...convertTimestamps(data) } as Event;
  },

  async updateEvent(eventId: string, data: Partial<EventFormData>, userId: string, isAdmin = false): Promise<void> {
    // Check permissions
    const { data: event } = await supabase.from('events').select('created_by').eq('id', eventId).single();
    if (!event) throw new Error('Event not found');
    if (!isAdmin && event.created_by !== userId) {
      throw new Error('Unauthorized to update this event');
    }

    // Admin-only fields that shouldn't be in updateData
    const { status, approvedBy, approvedAt, rejectionReason, ...updateData } = data as Partial<EventFormData> & { status?: string; approvedBy?: string; approvedAt?: string; rejectionReason?: string };

    const { error } = await supabase
      .from('events')
      .update({
        ...toSupabaseTimestamps(updateData as Record<string, unknown>),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw new Error(error.message);
  },

  async deleteEvent(eventId: string, userId: string, isAdmin = false): Promise<void> {
    const { data: event } = await supabase.from('events').select('created_by').eq('id', eventId).single();
    if (!event) throw new Error('Event not found');
    if (!isAdmin && event.created_by !== userId) {
      throw new Error('Unauthorized to delete this event');
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw new Error(error.message);

    // Remove from user's events_created
    const { data: profile } = await supabase
      .from('profiles')
      .select('events_created')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ events_created: (profile.events_created || []).filter((id: string) => id !== eventId) })
        .eq('id', userId);
    }
  },

  // Event Queries
  async getApprovedEvents(
    region?: { center: { lat: number; lng: number }; radiusKm: number },
    pageSize: number = 50,
    lastDoc?: unknown
  ): Promise<PaginatedResponse<Event>> {
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('start_date', { ascending: true })
      .range(0, pageSize - 1);

    if (lastDoc) {
      query = query.gt('start_date', (lastDoc as any).start_date);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    let events = (data || []).map((event) => ({ id: event.id, ...convertTimestamps(event) })) as Event[];

    // Filter by region if provided
    if (region) {
      events = events.filter((event) => {
        const coords = event.location.coordinates;
        if (!coords) return false;
        const distance = calculateDistance(
          region.center.lat,
          region.center.lng,
          coords.latitude,
          coords.longitude
        );
        return distance <= region.radiusKm;
      });
    }

    const lastVisible = events[events.length - 1];
    const hasMore = count !== null && count > pageSize;

    return { data: events, lastDoc: lastVisible, hasMore };
  },

  async getUserEvents(userId: string, status?: EventStatus): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return (data || []).map((event) => ({ id: event.id, ...convertTimestamps(event) })) as Event[];
  },

  // Admin Event Operations
  async getPendingEvents(pageSize: number = 20, lastDoc?: unknown): Promise<PaginatedResponse<AdminEvent>> {
    let query = supabase
      .from('events')
      .select('*, profiles!events_created_by_fkey(display_name, email)', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(0, pageSize - 1);

    if (lastDoc) {
      query = query.gt('created_at', (lastDoc as any).created_at);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    const events = (data || []).map((event) => ({
      ...event,
      ...convertTimestamps(event),
      creatorName: event.profiles?.display_name || 'Unknown',
      creatorEmail: event.profiles?.email || 'Unknown',
      organizerName: event.profiles?.display_name || 'Unknown',
      organizerEmail: event.profiles?.email || 'Unknown',
      attendeeCount: event.attendees_count || 0,
    })) as AdminEvent[];

    const lastVisible = events[events.length - 1];
    const hasMore = count !== null && count > pageSize;

    return { data: events, lastDoc: lastVisible, hasMore };
  },

  async approveEvent(eventId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw new Error(error.message);

    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action: 'approve_event',
      target_type: 'event',
      target_id: eventId,
      timestamp: new Date().toISOString(),
    });
  },

  async rejectEvent(eventId: string, adminId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'rejected',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw new Error(error.message);

    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action: 'reject_event',
      target_type: 'event',
      target_id: eventId,
      target_name: reason,
      timestamp: new Date().toISOString(),
    });
  },

  async getAllEventsPaginated(
    pageSize: number = 20,
    lastDoc?: unknown,
    statusFilter?: EventStatus
  ): Promise<PaginatedResponse<AdminEvent>> {
    let query = supabase
      .from('events')
      .select('*, profiles!events_created_by_fkey(display_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, pageSize - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    if (lastDoc) {
      query = query.lt('created_at', (lastDoc as any).created_at);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    const events = (data || []).map((event) => ({
      ...event,
      ...convertTimestamps(event),
      creatorName: event.profiles?.display_name || 'Unknown',
      creatorEmail: event.profiles?.email || 'Unknown',
      organizerName: event.profiles?.display_name || 'Unknown',
      organizerEmail: event.profiles?.email || 'Unknown',
      attendeeCount: event.attendees_count || 0,
    })) as AdminEvent[];

    const lastVisible = events[events.length - 1];
    const hasMore = count !== null && count > pageSize;

    return { data: events, lastDoc: lastVisible, hasMore };
  },

  // Admin Stats & Health
  async getStats(): Promise<AdminStats | null> {
    const { data, error } = await supabase
      .from('admin_stats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return convertTimestamps(data) as unknown as AdminStats;
  },

  async updateStats(stats: Partial<AdminStats>): Promise<void> {
    const { error } = await supabase
      .from('admin_stats')
      .upsert({
        ...toSupabaseTimestamps(stats as Record<string, unknown>),
        updated_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);
  },

  async getHealth(): Promise<AppHealth | null> {
    const { data, error } = await supabase
      .from('app_health')
      .select('*')
      .order('last_checked', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return convertTimestamps(data) as unknown as AppHealth;
  },

  async updateHealth(health: Partial<AppHealth>): Promise<void> {
    const { error } = await supabase
      .from('app_health')
      .upsert({
        ...toSupabaseTimestamps(health as Record<string, unknown>),
        last_checked: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);
  },

  async getActionLog(pageSize: number = 50): Promise<AdminAction[]> {
    const { data, error } = await supabase
      .from('admin_actions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(pageSize);

    if (error) throw new Error(error.message);

    return (data || []).map((action) => ({ id: action.id, ...convertTimestamps(action) })) as AdminAction[];
  },

  // Utility
  calculateDistance,
};

export default supabaseDatabaseAdapter;