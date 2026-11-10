import { useState, useCallback, useEffect } from 'react';
import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';
import type { Event } from '@/types';

// ============================================
// Calendar Hook Types
// ============================================

interface UseCalendarReturn {
  // Calendar state
  calendars: Calendar.Calendar[];
  defaultCalendar: Calendar.Calendar | null;
  permissionStatus: Calendar.PermissionStatus | null;
  hasPermission: boolean;

  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  getCalendars: () => Promise<Calendar.Calendar[]>;
  createEventInCalendar: (event: Event) => Promise<string | null>;
  updateEventInCalendar: (eventId: string, event: Event) => Promise<void>;
  deleteEventFromCalendar: (eventId: string) => Promise<void>;
  openEventInCalendar: (eventId: string) => Promise<void>;
  clearError: () => void;
}

// ============================================
// Calendar Hook
// ============================================

export function useCalendar(): UseCalendarReturn {
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [defaultCalendar, setDefaultCalendar] = useState<Calendar.Calendar | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Calendar.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = permissionStatus === 'granted';

  const clearError = useCallback(() => setError(null), []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Calendar.getPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        await getCalendars();
      }
    } catch (err) {
      console.error('Failed to check calendar permission:', err);
    }
  }, []);

  // Request calendar permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Calendar.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        await getCalendars();
        return true;
      } else {
        setError('Calendar permission denied. Events cannot be added to your calendar.');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get available calendars
  const getCalendars = useCallback(async (): Promise<Calendar.Calendar[]> => {
    setLoading(true);
    setError(null);

    try {
      const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writableCalendars = allCalendars.filter((cal) => cal.allowsModifications);

      setCalendars(writableCalendars);

      // Find default calendar (prefer local, then iCloud, then first writable)
      let defaultCal = writableCalendars.find((c) => c.type === Calendar.CalendarType.LOCAL);
      if (!defaultCal) {
        defaultCal = writableCalendars.find((c) => c.type === Calendar.CalendarType.CALDAV);
      }
      if (!defaultCal && writableCalendars.length > 0) {
        defaultCal = writableCalendars[0];
      }

      setDefaultCalendar(defaultCal || null);

      return writableCalendars;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get calendars';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create event in device calendar
  const createEventInCalendar = useCallback(async (event: Event): Promise<string | null> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    if (!defaultCalendar) {
      setError('No writable calendar found');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        notes: `${event.description}\n\nEvent Type: ${event.type.replace('_', ' ')}\nLocation: ${event.location.name}\nAddress: ${event.location.address}`,
        startDate: event.startDate.toDate(),
        endDate: event.endDate.toDate(),
        allDay: false,
        location: event.location.address,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return eventId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create calendar event';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, defaultCalendar, requestPermission]);

  // Update event in calendar
  const updateEventInCalendar = useCallback(async (eventId: string, event: Event): Promise<void> => {
    if (!hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      await Calendar.updateEventAsync(eventId, {
        title: event.title,
        notes: `${event.description}\n\nEvent Type: ${event.type.replace('_', ' ')}\nLocation: ${event.location.name}\nAddress: ${event.location.address}`,
        startDate: event.startDate.toDate(),
        endDate: event.endDate.toDate(),
        allDay: false,
        location: event.location.address,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update calendar event';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  // Delete event from calendar
  const deleteEventFromCalendar = useCallback(async (eventId: string): Promise<void> => {
    if (!hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      await Calendar.deleteEventAsync(eventId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete calendar event';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  // Open event in native calendar app
  const openEventInCalendar = useCallback(async (eventId: string): Promise<void> => {
    try {
      // This opens the native calendar app
      // Implementation varies by platform
      if (Platform.OS === 'ios') {
        // iOS - use calendar URL scheme
        // Note: This requires the event to be in the calendar first
      }
      // For now, we'll just alert
      Alert.alert('Open in Calendar', 'This feature opens the event in your device calendar app.');
    } catch (err) {
      console.error('Failed to open calendar:', err);
    }
  }, []);

  return {
    calendars,
    defaultCalendar,
    permissionStatus,
    hasPermission,
    loading,
    error,
    requestPermission,
    getCalendars,
    createEventInCalendar,
    updateEventInCalendar,
    deleteEventFromCalendar,
    openEventInCalendar,
    clearError,
  };
}

// ============================================
// Hook for adding event to calendar with user confirmation
// ============================================

export function useAddToCalendar() {
  const { createEventInCalendar, hasPermission, requestPermission, loading, error } = useCalendar();

  const addEvent = useCallback(
    async (event: Event): Promise<boolean> => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      const eventId = await createEventInCalendar(event);
      if (eventId) {
        Alert.alert('Success', 'Event added to your calendar!');
        return true;
      }
      return false;
    },
    [hasPermission, requestPermission, createEventInCalendar]
  );

  return { addEvent, loading, error, hasPermission };
}

export default useCalendar;