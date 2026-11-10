import { useState, useCallback, useEffect } from 'react';
import { eventService } from '@/services/firebase/firestore';
import { authService } from '@/services/firebase/auth';
import type { Event, EventFormData, EventStatus, PaginatedResponse, AdminEvent } from '@/types';

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

  // Pagination cursors
  const approvedLastDocRef = useState<unknown | null>(null);
  const userLastDocRef = useState<unknown | null>(null);
  const pendingLastDocRef = useState<unknown | null>(null);
  const allLastDocRef = useState<unknown | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Create event
  const createEvent = useCallback(async (data: EventFormData): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const eventId = await eventService.createEvent(data, user.uid);
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
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const isAdmin = await authService.checkAdminStatus();
      await eventService.updateEvent(eventId, data, user.uid, isAdmin);

      // Update local state
      setApprovedEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...data } : event))
      );
      setUserEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...data } : event))
      );
      setAllEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...data } : event))
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
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const isAdmin = await authService.checkAdminStatus();
      await eventService.deleteEvent(eventId, user.uid, isAdmin);

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

  // Fetch approved events (for map/public view)
  const fetchApprovedEvents = useCallback(
    async (region?: { center: { lat: number; lng: number }; radiusKm: number }) => {
      setLoadingApproved(true);
      setError(null);
      try {
        const response = await eventService.getApprovedEvents(region);
        setApprovedEvents(response.data);
        setHasMoreApproved(response.hasMore);
        // Store last doc for pagination
        // Note: We'd need to use a ref for the cursor in a real implementation
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
      const events = await eventService.getUserEvents(userId, status);
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
      const response = await eventService.getPendingEvents();
      setPendingEvents(response.data);
      setHasMorePending(response.hasMore);
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
      const response = await eventService.getAllEventsPaginated(20, null, statusFilter);
      setAllEvents(response.data);
      setHasMoreAll(response.hasMore);
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
    // Implementation would use the stored lastDoc cursor
  }, [hasMoreApproved, loadingApproved]);

  // Load more user events
  const loadMoreUser = useCallback(async () => {
    if (!hasMoreUser || loadingUser) return;
  }, [hasMoreUser, loadingUser]);

  // Load more pending events
  const loadMorePending = useCallback(async () => {
    if (!hasMorePending || loadingPending) return;
  }, [hasMorePending, loadingPending]);

  // Load more all events
  const loadMoreAll = useCallback(async () => {
    if (!hasMoreAll || loadingAll) return;
  }, [hasMoreAll, loadingAll]);

  // Refresh all data
  const refresh = useCallback(async () => {
    const user = authService.getCurrentUser();
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