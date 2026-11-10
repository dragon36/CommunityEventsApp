import { useState, useCallback, useEffect } from 'react';
import { adminService, userService, eventService } from '@/services/firebase/firestore';
import { authService } from '@/services/firebase/auth';
import type { AdminStats, AppHealth, AdminUser, AdminEvent, AdminAction, PaginatedResponse } from '@/types';

// ============================================
// Admin Hook Types
// ============================================

interface UseAdminReturn {
  // Admin data
  stats: AdminStats | null;
  health: AppHealth | null;
  users: AdminUser[];
  pendingEvents: AdminEvent[];
  allEvents: AdminEvent[];
  actionLog: AdminAction[];

  // Loading states
  loading: boolean;
  loadingStats: boolean;
  loadingHealth: boolean;
  loadingUsers: boolean;
  loadingPendingEvents: boolean;
  loadingAllEvents: boolean;
  loadingActionLog: boolean;

  // Pagination
  usersHasMore: boolean;
  pendingEventsHasMore: boolean;
  allEventsHasMore: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchStats: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  fetchUsers: (pageSize?: number, filters?: { role?: 'user' | 'admin'; isActive?: boolean; search?: string }) => Promise<void>;
  fetchPendingEvents: () => Promise<void>;
  fetchAllEvents: (statusFilter?: 'pending' | 'approved' | 'rejected' | 'cancelled') => Promise<void>;
  fetchActionLog: () => Promise<void>;
  loadMoreUsers: () => Promise<void>;
  loadMorePendingEvents: () => Promise<void>;
  loadMoreAllEvents: () => Promise<void>;

  // User management
  updateUserRole: (uid: string, role: 'user' | 'admin') => Promise<void>;
  toggleUserActive: (uid: string, isActive: boolean) => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;

  // Event management
  approveEvent: (eventId: string) => Promise<void>;
  rejectEvent: (eventId: string, reason: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Utility
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Admin Hook
// ============================================

export function useAdmin(): UseAdminReturn {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<AppHealth | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);
  const [actionLog, setActionLog] = useState<AdminAction[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPendingEvents, setLoadingPendingEvents] = useState(false);
  const [loadingAllEvents, setLoadingAllEvents] = useState(false);
  const [loadingActionLog, setLoadingActionLog] = useState(false);

  const [usersHasMore, setUsersHasMore] = useState(true);
  const [pendingEventsHasMore, setPendingEventsHasMore] = useState(true);
  const [allEventsHasMore, setAllEventsHasMore] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Pagination cursors (using refs to avoid re-renders)
  const usersLastDocRef = useState<unknown | null>(null);
  const pendingEventsLastDocRef = useState<unknown | null>(null);
  const allEventsLastDocRef = useState<unknown | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Check if current user is admin
  const checkAdminAccess = useCallback(async (): Promise<boolean> => {
    const isAdmin = await authService.checkAdminStatus();
    if (!isAdmin) {
      setError('Admin access required');
      return false;
    }
    return true;
  }, []);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    if (!(await checkAdminAccess())) return;
    setLoadingStats(true);
    setError(null);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(message);
    } finally {
      setLoadingStats(false);
    }
  }, [checkAdminAccess]);

  // Fetch app health
  const fetchHealth = useCallback(async () => {
    if (!(await checkAdminAccess())) return;
    setLoadingHealth(true);
    setError(null);
    try {
      const data = await adminService.getHealth();
      setHealth(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch health';
      setError(message);
    } finally {
      setLoadingHealth(false);
    }
  }, [checkAdminAccess]);

  // Fetch users with pagination
  const fetchUsers = useCallback(
    async (pageSize = 20, filters?: { role?: 'user' | 'admin'; isActive?: boolean; search?: string }) => {
      if (!(await checkAdminAccess())) return;
      setLoadingUsers(true);
      setError(null);
      try {
        const response = await userService.getUsersPaginated(pageSize, usersLastDocRef[0] as any, filters);
        if (usersLastDocRef[0] === null) {
          setUsers(response.data);
        } else {
          setUsers((prev) => [...prev, ...response.data]);
        }
        setUsersHasMore(response.hasMore);
        // Update cursor ref
        usersLastDocRef[1](response.lastDoc);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch users';
        setError(message);
      } finally {
        setLoadingUsers(false);
      }
    },
    [checkAdminAccess]
  );

  // Load more users
  const loadMoreUsers = useCallback(async () => {
    if (!usersHasMore || loadingUsers) return;
    await fetchUsers(20);
  }, [usersHasMore, loadingUsers, fetchUsers]);

  // Fetch pending events
  const fetchPendingEvents = useCallback(async () => {
    if (!(await checkAdminAccess())) return;
    setLoadingPendingEvents(true);
    setError(null);
    try {
      const response = await eventService.getPendingEvents();
      setPendingEvents(response.data);
      setPendingEventsHasMore(response.hasMore);
      pendingEventsLastDocRef[1](response.lastDoc);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pending events';
      setError(message);
    } finally {
      setLoadingPendingEvents(false);
    }
  }, [checkAdminAccess]);

  // Load more pending events
  const loadMorePendingEvents = useCallback(async () => {
    if (!pendingEventsHasMore || loadingPendingEvents) return;
    // Implementation would use cursor
  }, [pendingEventsHasMore, loadingPendingEvents]);

  // Fetch all events (admin view)
  const fetchAllEvents = useCallback(
    async (statusFilter?: 'pending' | 'approved' | 'rejected' | 'cancelled') => {
      if (!(await checkAdminAccess())) return;
      setLoadingAllEvents(true);
      setError(null);
      try {
        const response = await eventService.getAllEventsPaginated(20, allEventsLastDocRef[0] as any, statusFilter);
        if (allEventsLastDocRef[0] === null) {
          setAllEvents(response.data);
        } else {
          setAllEvents((prev) => [...prev, ...response.data]);
        }
        setAllEventsHasMore(response.hasMore);
        allEventsLastDocRef[1](response.lastDoc);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch events';
        setError(message);
      } finally {
        setLoadingAllEvents(false);
      }
    },
    [checkAdminAccess]
  );

  // Load more all events
  const loadMoreAllEvents = useCallback(async () => {
    if (!allEventsHasMore || loadingAllEvents) return;
    await fetchAllEvents();
  }, [allEventsHasMore, loadingAllEvents, fetchAllEvents]);

  // Fetch action log
  const fetchActionLog = useCallback(async () => {
    if (!(await checkAdminAccess())) return;
    setLoadingActionLog(true);
    setError(null);
    try {
      const data = await adminService.getActionLog();
      setActionLog(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch action log';
      setError(message);
    } finally {
      setLoadingActionLog(false);
    }
  }, [checkAdminAccess]);

  // User management actions
  const updateUserRole = useCallback(
    async (uid: string, role: 'user' | 'admin') => {
      if (!(await checkAdminAccess())) return;
      setLoading(true);
      setError(null);
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) throw new Error('Not authenticated');

        await userService.updateUserRole(uid, role, currentUser.uid);

        // Update local state
        setUsers((prev) =>
          prev.map((user) => (user.uid === uid ? { ...user, role } : user))
        );

        // Refresh stats
        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAdminAccess, fetchStats]
  );

  const toggleUserActive = useCallback(
    async (uid: string, isActive: boolean) => {
      if (!(await checkAdminAccess())) return;
      setLoading(true);
      setError(null);
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) throw new Error('Not authenticated');

        await userService.toggleUserActive(uid, isActive, currentUser.uid);

        // Update local state
        setUsers((prev) =>
          prev.map((user) => (user.uid === uid ? { ...user, isActive } : user))
        );

        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user status';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAdminAccess, fetchStats]
  );

  const resetUserPassword = useCallback(
    async (email: string) => {
      if (!(await checkAdminAccess())) return;
      setLoading(true);
      setError(null);
      try {
        await userService.requestPasswordReset(email);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send password reset';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAdminAccess]
  );

  // Event management actions
  const approveEvent = useCallback(
    async (eventId: string) => {
      if (!(await checkAdminAccess())) return;
      setLoading(true);
      setError(null);
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) throw new Error('Not authenticated');

        await eventService.approveEvent(eventId, currentUser.uid);

        // Update local state
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
        setAllEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: 'approved' as const } : e))
        );

        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve event';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAdminAccess, fetchStats]
  );

  const rejectEvent = useCallback(
    async (eventId: string, reason: string) => {
      if (!(await checkAdminAccess())) return;
      setLoading(true);
      setError(null);
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) throw new Error('Not authenticated');

        await eventService.rejectEvent(eventId, currentUser.uid, reason);

        // Update local state
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
        setAllEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: 'rejected' as const } : e))
        );

        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject event';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAdminAccess, fetchStats]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!(await checkAdminAccess())) return;
      setLoading(true);
      setError(null);
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) throw new Error('Not authenticated');

        await eventService.deleteEvent(eventId, currentUser.uid, true);

        // Update local state
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
        setAllEvents((prev) => prev.filter((e) => e.id !== eventId));

        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete event';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAdminAccess, fetchStats]
  );

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchHealth(),
      fetchUsers(),
      fetchPendingEvents(),
      fetchAllEvents(),
      fetchActionLog(),
    ]);
    setLoading(false);
  }, [fetchStats, fetchHealth, fetchUsers, fetchPendingEvents, fetchAllEvents, fetchActionLog]);

  return {
    stats,
    health,
    users,
    pendingEvents,
    allEvents,
    actionLog,
    loading,
    loadingStats,
    loadingHealth,
    loadingUsers,
    loadingPendingEvents,
    loadingAllEvents,
    loadingActionLog,
    usersHasMore,
    pendingEventsHasMore,
    allEventsHasMore,
    error,
    fetchStats,
    fetchHealth,
    fetchUsers,
    fetchPendingEvents,
    fetchAllEvents,
    fetchActionLog,
    loadMoreUsers,
    loadMorePendingEvents,
    loadMoreAllEvents,
    updateUserRole,
    toggleUserActive,
    resetUserPassword,
    approveEvent,
    rejectEvent,
    deleteEvent,
    refreshAll,
    clearError,
  };
}

export default useAdmin;