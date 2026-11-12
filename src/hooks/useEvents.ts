// =============================================================================
// COMMUNITY EVENTS APP - EVENTS HOOK (Using Factory)
// =============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Event, EventFormData, EventStatus, PaginatedResponse, AdminEvent } from '@/types';
import { getAuthService, getDatabaseService } from '@/services/factory';

// ============================================
// Events Hook Types
// ============================================

interface UseEventsReturn {
  // Events data
  events: Event[];
  approvedEvents: Event[];
  userEvents: Event[];
  pendingEvents: AdminEvent[];
  allEvents: AdminEvent[];

  // Loading states
  loading: boolean;
  loadingApproved: boolean;
  loadingUser: boolean;
  loadingPending: boolean;
  loadingAll: boolean;

  // Pagination
  hasMoreApproved: boolean;
  hasMoreUser: boolean;
  hasMorePending: boolean;
  hasMoreAll: boolean;

  // Error states
  error: string | null;

  // Actions
  createEvent: (data: EventFormData) => Promise<string>;
  updateEvent: (eventId: string, data: Partial<EventFormData>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  fetchApprovedEvents: (region?: { center: { lat: number; lng: number }; radiusKm: number }) => Promise<void>;
  fetchUserEvents: (userId: string, status?: EventStatus) => Promise<void>;
  fetchPendingEvents: () => Promise<void>;
  fetchAllEvents: (statusFilter?: EventStatus) => Promise<void>;
  loadMoreApproved: () => Promise<void>;
  loadMoreUser: () => Promise<void>;
  loadMorePending: () => Promise<void>;
  loadMoreAll: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Events Hook
// ============================================

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const [hasMoreApproved, setHasMoreApproved] = useState(true);
  const [hasMoreUser, setHasMoreUser] = useState(true);
  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreAll, setHasMoreAll] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Pagination cursors (using refs to avoid re-renders)
  const approvedLastDocRef = useRef<unknown | null>(null);
  const userLastDocRef = useRef<unknown | null>(null);
  const pendingLastDocRef = useRef<unknown | null>(null);
  const allLastDocRef = useRef<unknown | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Create event
  const createEvent = useCallback(async (data: EventFormData): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const authService = await getAuthService();
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const dbService = await getDatabaseService();
      const eventId = await dbService.createEvent(data, user.uid);
      return eventId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update event
  const updateEvent = useCallback(async (eventId: string, data: Partial<EventFormData>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const authService = await getAuthService();
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const isAdmin = await authService.checkAdminStatus();
      const dbService = await getDatabaseService();
      await dbService.updateEvent(eventId, data, user.uid, isAdmin);

      // Update local state
      setApprovedEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...data, location: data.location as any } : event))
      );
      setUserEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...data, location: data.location as any } : event))
      );
      setAllEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...data, location: data.location as any } : event))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete event
  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const authService = await getAuthService();
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const isAdmin = await authService.checkAdminStatus();
      const dbService = await getDatabaseService();
      await dbService.deleteEvent(eventId, user.uid, isAdmin);

      // Update local state
      setApprovedEvents((prev) => prev.filter((event) => event.id !== eventId));
      setUserEvents((prev) => prev.filter((event) => event.id !== eventId));
      setAllEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch approved events (for map/list)
  const fetchApprovedEvents = useCallback(
    async (region?: { center: { lat: number; lng: number }; radiusKm: number }) => {
      setLoadingApproved(true);
      setError(null);
      try {
        const dbService = await getDatabaseService();
        const response = await dbService.getApprovedEvents(region);
        setApprovedEvents(response.data);
        setHasMoreApproved(response.hasMore);
        approvedLastDocRef.current = response.lastDoc;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch events';
        setError(message);
      } finally {
        setLoadingApproved(false);
      }
    },
    []
  );

  // Fetch user's events
  const fetchUserEvents = useCallback(async (userId: string, status?: EventStatus) => {
    setLoadingUser(true);
    setError(null);
    try {
      const dbService = await getDatabaseService();
      const events = await dbService.getUserEvents(userId, status);
      setUserEvents(events);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch your events';
      setError(message);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Fetch pending events (admin)
  const fetchPendingEvents = useCallback(async () => {
    setLoadingPending(true);
    setError(null);
    try {
      const dbService = await getDatabaseService();
      const response = await dbService.getPendingEvents();
      setPendingEvents(response.data);
      setHasMorePending(response.hasMore);
      pendingLastDocRef.current = response.lastDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pending events';
      setError(message);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // Fetch all events (admin)
  const fetchAllEvents = useCallback(async (statusFilter?: EventStatus) => {
    setLoadingAll(true);
    setError(null);
    try {
      const dbService = await getDatabaseService();
      const response = await dbService.getAllEventsPaginated(20, allLastDocRef.current, statusFilter);
      setAllEvents(response.data);
      setHasMoreAll(response.hasMore);
      allLastDocRef.current = response.lastDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(message);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  // Load more approved events
  const loadMoreApproved = useCallback(async () => {
    if (!hasMoreApproved || loadingApproved) return;
    setLoadingApproved(true);
    try {
      const dbService = await getDatabaseService();
      const response = await dbService.getApprovedEvents(undefined, 20, approvedLastDocRef.current);
      setApprovedEvents((prev) => [...prev, ...response.data]);
      setHasMoreApproved(response.hasMore);
      approvedLastDocRef.current = response.lastDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more events';
      setError(message);
    } finally {
      setLoadingApproved(false);
    }
  }, [hasMoreApproved, loadingApproved]);

  // Load more user events
  const loadMoreUser = useCallback(async () => {
    if (!hasMoreUser || loadingUser) return;
    // Implementation would use the stored lastDoc cursor
  }, [hasMoreUser, loadingUser]);

  // Load more pending events
  const loadMorePending = useCallback(async () => {
    if (!hasMorePending || loadingPending) return;
    setLoadingPending(true);
    try {
      const dbService = await getDatabaseService();
      const response = await dbService.getPendingEvents(20, pendingLastDocRef.current);
      setPendingEvents((prev) => [...prev, ...response.data]);
      setHasMorePending(response.hasMore);
      pendingLastDocRef.current = response.lastDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more events';
      setError(message);
    } finally {
      setLoadingPending(false);
    }
  }, [hasMorePending, loadingPending]);

  // Load more all events
  const loadMoreAll = useCallback(async () => {
    if (!hasMoreAll || loadingAll) return;
    await fetchAllEvents();
  }, [hasMoreAll, loadingAll, fetchAllEvents]);

  // Refresh all data
  const refresh = useCallback(async () => {
    const authService = await getAuthService();
    const user = await authService.getCurrentUser();
    if (user) {
      await fetchUserEvents(user.uid);
    }
    await fetchApprovedEvents();
  }, [fetchUserEvents, fetchApprovedEvents]);

  return {
    events,
    approvedEvents,
    userEvents,
    pendingEvents,
    allEvents,
    loading,
    loadingApproved,
    loadingUser,
    loadingPending,
    loadingAll,
    hasMoreApproved,
    hasMoreUser,
    hasMorePending,
    hasMoreAll,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchApprovedEvents,
    fetchUserEvents,
    fetchPendingEvents,
    fetchAllEvents,
    loadMoreApproved,
    loadMoreUser,
    loadMorePending,
    loadMoreAll,
    refresh,
    clearError,
  };
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * Hook for map screen - fetches approved events for a region
 */
export function useMapEvents(region?: { center: { lat: number; lng: number }; radiusKm: number }) {
  const { approvedEvents, loadingApproved, error, fetchApprovedEvents, clearError } = useEvents();

  useEffect(() => {
    fetchApprovedEvents(region);
  }, [region, fetchApprovedEvents]);

  return {
    events: approvedEvents,
    loading: loadingApproved,
    error,
    refresh: () => fetchApprovedEvents(region),
    clearError,
  };
}

/**
 * Hook for user's events list
 */
export function useUserEvents(userId: string | null, status?: EventStatus) {
  const { userEvents, loadingUser, error, fetchUserEvents, clearError } = useEvents();

  useEffect(() => {
    if (userId) {
      fetchUserEvents(userId, status);
    }
  }, [userId, status, fetchUserEvents]);

  return {
    events: userEvents,
    loading: loadingUser,
    error,
    refresh: () => userId && fetchUserEvents(userId, status),
    clearError,
  };
}

/**
 * Hook for admin event management
 */
export function useAdminEvents() {
  const {
    pendingEvents,
    allEvents,
    loadingPending,
    loadingAll,
    error,
    fetchPendingEvents,
    fetchAllEvents,
    clearError,
  } = useEvents();

  return {
    pendingEvents,
    allEvents,
    loadingPending,
    loadingAll,
    error,
    fetchPendingEvents,
    fetchAllEvents,
    clearError,
  };
}

export default useEvents;