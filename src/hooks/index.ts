// =============================================================================
// COMMUNITY EVENTS APP - CUSTOM HOOKS
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';
import { Event, UserProfile, Notification, EventComment, Category, Venue, PaginatedResponse } from '@/types';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// -----------------------------------------------------------------------------
// AUTH HOOKS
// -----------------------------------------------------------------------------
export const useUser = () => {
  const { user, loading } = useAuth();
  return { user, loading };
};

export const useUserProfile = (userId?: string) => {
  const { user: currentUser } = useAuth();
  const targetUserId = userId || currentUser?.uid;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    api.users.getUserProfile(targetUserId)
      .then(data => {
        if (mounted) {
          setProfile(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [targetUserId]);

  const refetch = useCallback(() => {
    if (targetUserId) {
      setLoading(true);
      api.users.getUserProfile(targetUserId)
        .then(data => setProfile(data))
        .catch(err => setError(err))
        .finally(() => setLoading(false));
    }
  }, [targetUserId]);

  return { profile, loading, error, refetch };
};

// -----------------------------------------------------------------------------
// EVENTS HOOKS
// -----------------------------------------------------------------------------
export const useEvents = (params?: {
  category?: string;
  city?: string;
  state?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const loadingMoreRef = useRef(false);

  const fetchEvents = useCallback(async (cursor?: string, append = false) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    try {
      const result = await api.events.searchEvents({
        ...params,
        cursor,
        limit: 20,
      });

      if (append) {
        setEvents(prev => [...prev, ...result.events]);
      } else {
        setEvents(result.events);
      }
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      loadingMoreRef.current = false;
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor && !loadingMoreRef.current) {
      fetchEvents(nextCursor, true);
    }
  }, [hasMore, nextCursor, fetchEvents]);

  const refetch = useCallback(() => {
    fetchEvents(undefined, false);
  }, [fetchEvents]);

  return { events, loading, error, hasMore, loadMore, refetch };
};

export const useEvent = (eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) return;

    let mounted = true;
    setLoading(true);

    api.events.getEvent(eventId)
      .then(data => {
        if (mounted) {
          setEvent(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [eventId]);

  return { event, loading, error, refetch: () => api.events.getEvent(eventId).then(setEvent) };
};

export const useUserEvents = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!targetUserId) return;

    let mounted = true;
    setLoading(true);

    api.events.getEventsByOrganizer(targetUserId)
      .then(data => {
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [targetUserId]);

  return { events, loading, error, refetch: () => api.events.getEventsByOrganizer(targetUserId!).then(setEvents) };
};

export const useAttendingEvents = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!targetUserId) return;

    let mounted = true;
    setLoading(true);

    api.events.getUserAttendingEvents(targetUserId)
      .then(data => {
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [targetUserId]);

  return { events, loading, error, refetch: () => api.events.getUserAttendingEvents(targetUserId!).then(setEvents) };
};

export const useSavedEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await api.events.getSavedEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleSave = useCallback(async (eventId: string) => {
    const saved = await api.events.toggleSaveEvent(eventId);
    if (saved) {
      // Refetch to get the new event
      fetch();
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
    return saved;
  }, [fetch]);

  const isSaved = useCallback(async (eventId: string) => {
    return api.events.isEventSaved(eventId);
  }, []);

  return { events, loading, error, refetch: fetch, toggleSave, isSaved };
};

// -----------------------------------------------------------------------------
// RSVP HOOK
// -----------------------------------------------------------------------------
export const useRSVP = (eventId: string) => {
  const [status, setStatus] = useState<'going' | 'interested' | 'not_going' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.events.getUserRSVP(eventId).then(rsvp => {
      if (rsvp) setStatus(rsvp.status);
    });
  }, [eventId]);

  const rsvp = useCallback(async (newStatus: 'going' | 'interested' | 'not_going') => {
    setLoading(true);
    try {
      await api.events.rsvpEvent(eventId, newStatus);
      setStatus(newStatus);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  return { status, loading, rsvp };
};

// -----------------------------------------------------------------------------
// CATEGORIES HOOK
// -----------------------------------------------------------------------------
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    api.categories.getAllCategories()
      .then(data => {
        if (mounted) {
          setCategories(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  return { categories, loading, error };
};

// -----------------------------------------------------------------------------
// VENUES HOOK
// -----------------------------------------------------------------------------
export const useVenues = (query: string = '', location?: { latitude: number; longitude: number }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async () => {
    if (!query && !location) {
      setVenues([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.venues.searchVenues(query, location);
      setVenues(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [query, location]);

  useEffect(() => {
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return { venues, loading, error, search };
};

// -----------------------------------------------------------------------------
// NOTIFICATIONS HOOK
// -----------------------------------------------------------------------------
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async (cursor?: string, append = false) => {
    try {
      const result = await api.notifications.getNotifications(30, cursor);
      if (append) {
        setNotifications(prev => [...prev, ...result.data]);
      } else {
        setNotifications(result.data);
      }
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor) fetch(nextCursor, true);
  }, [hasMore, nextCursor, fetch]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await api.notifications.markAsRead(notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.notifications.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Fetch unread count
  useEffect(() => {
    api.notifications.getUnreadCount().then(setUnreadCount);
  }, []);

  return {
    notifications,
    loading,
    error,
    hasMore,
    loadMore,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: () => fetch(undefined, false),
  };
};

// -----------------------------------------------------------------------------
// COMMENTS HOOK
// -----------------------------------------------------------------------------
export const useComments = (eventId: string) => {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const fetch = useCallback(async (cursor?: string, append = false) => {
    try {
      const result = await api.comments.getEventComments(eventId, 50, cursor);
      if (append) {
        setComments(prev => [...prev, ...result.data]);
      } else {
        setComments(result.data);
      }
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor) fetch(nextCursor, true);
  }, [hasMore, nextCursor, fetch]);

  const addComment = useCallback(async (content: string) => {
    const commentId = await api.comments.addComment(eventId, content);
    // Optimistic update
    const newComment: EventComment = {
      id: commentId,
      eventId,
      userId: '', // Will be filled by server
      content,
      createdAt: new Date(),
    };
    setComments(prev => [newComment, ...prev]);
    return commentId;
  }, [eventId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    await api.comments.updateComment(eventId, commentId, content);
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content, updatedAt: new Date() } : c));
  }, [eventId]);

  const deleteComment = useCallback(async (commentId: string) => {
    await api.comments.deleteComment(eventId, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, [eventId]);

  return { comments, loading, error, hasMore, loadMore, addComment, updateComment, deleteComment, refetch: () => fetch(undefined, false) };
};

// -----------------------------------------------------------------------------
// NETWORK HOOK
// -----------------------------------------------------------------------------
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable, isOffline: !isConnected || !isInternetReachable };
};

// -----------------------------------------------------------------------------
// DEBOUNCE HOOK
// -----------------------------------------------------------------------------
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// -----------------------------------------------------------------------------
// LOCAL STORAGE HOOK
// -----------------------------------------------------------------------------
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then(item => {
        if (item) {
          try {
            setStoredValue(JSON.parse(item));
          } catch {
            setStoredValue(initialValue);
          }
        }
      })
      .catch(() => setStoredValue(initialValue))
      .finally(() => setLoading(false));
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue, loading] as const;
};

// -----------------------------------------------------------------------------
// PERMISSIONS HOOKS (using individual Expo SDK modules)
 // -----------------------------------------------------------------------------
 import * as Location from 'expo-location';
 import * as CalendarModule from 'expo-calendar';
 import * as ImagePicker from 'expo-image-picker';
 import * as Notifications from 'expo-notifications';

 export const useLocationPermission = () => {
   const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
   const [loading, setLoading] = useState(true);

   const requestPermission = useCallback(async () => {
     setLoading(true);
     const { status } = await Location.requestForegroundPermissionsAsync();
     setPermission(status);
     setLoading(false);
     return status === 'granted';
   }, []);

   useEffect(() => {
     Location.getForegroundPermissionsAsync().then(({ status }: { status: Location.PermissionStatus }) => {
       setPermission(status);
       setLoading(false);
     });
   }, []);

   return { permission, loading, requestPermission, granted: permission === 'granted' };
 };

 export const useCalendarPermission = () => {
   const [permission, setPermission] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   const requestPermission = useCallback(async () => {
     setLoading(true);
     const { status } = await CalendarModule.requestCalendarPermissionsAsync();
     setPermission(status);
     setLoading(false);
     return status === 'granted';
   }, []);

   useEffect(() => {
     CalendarModule.getCalendarPermissionsAsync().then(({ status }: { status: string }) => {
       setPermission(status);
       setLoading(false);
     });
   }, []);

   return { permission, loading, requestPermission, granted: permission === 'granted' };
 };

export const useCameraPermission = () => {
  const [permission, setPermission] = useState<ImagePicker.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setPermission(status);
    setLoading(false);
    return status === 'granted';
  }, []);

  useEffect(() => {
    ImagePicker.getCameraPermissionsAsync().then(({ status }: { status: ImagePicker.PermissionStatus }) => {
      setPermission(status);
      setLoading(false);
    });
  }, []);

  return { permission, loading, requestPermission, granted: permission === 'granted' };
};

export const useMediaLibraryPermission = () => {
  const [permission, setPermission] = useState<ImagePicker.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermission(status);
    setLoading(false);
    return status === 'granted';
  }, []);

  useEffect(() => {
    ImagePicker.getMediaLibraryPermissionsAsync().then(({ status }: { status: ImagePicker.PermissionStatus }) => {
      setPermission(status);
      setLoading(false);
    });
  }, []);

  return { permission, loading, requestPermission, granted: permission === 'granted' };
};

export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    const { status } = await Notifications.requestPermissionsAsync();
    setPermission(status);
    setLoading(false);
    return status === 'granted';
  }, []);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }: { status: Notifications.PermissionStatus }) => {
      setPermission(status);
      setLoading(false);
    });
  }, []);

  return { permission, loading, requestPermission, granted: permission === 'granted' };
};

// -----------------------------------------------------------------------------
// FORM HOOK
// -----------------------------------------------------------------------------
export const useForm = <T extends Record<string, unknown>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const handleChange = useCallback((field: keyof T) => (value: T[keyof T]) => {
    setFieldValue(field, value);
    if (touched[field]) {
      setFieldError(field, '');
    }
  }, [setFieldValue, setFieldError, touched]);

  const handleBlur = useCallback((field: keyof T) => () => {
    setFieldTouched(field, true);
  }, [setFieldTouched]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const validate = useCallback((validationSchema: Partial<Record<keyof T, (value: T[keyof T]) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(field => {
      const validator = validationSchema[field as keyof T];
      if (validator) {
        const error = validator(values[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values]);

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    handleChange,
    handleBlur,
    resetForm,
    validate,
    isValid: Object.keys(errors).length === 0,
  };
};

// -----------------------------------------------------------------------------
// INFINITE SCROLL HOOK
// -----------------------------------------------------------------------------
export const useInfiniteScroll = <T>(
  fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>,
  options: { enabled?: boolean } = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const fetchRef = useRef(fetchFn);

  fetchRef.current = fetchFn;

  const fetch = useCallback(async (cursor?: string, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const result = await fetchRef.current(cursor);
      if (append) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (options.enabled !== false) {
      fetch();
    }
  }, [fetch, options.enabled]);

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor && !loadingMore) {
      fetch(nextCursor, true);
    }
  }, [hasMore, nextCursor, loadingMore, fetch]);

  const refetch = useCallback(() => fetch(undefined, false), [fetch]);

  return { data, loading, loadingMore, error, hasMore, loadMore, refetch };
};