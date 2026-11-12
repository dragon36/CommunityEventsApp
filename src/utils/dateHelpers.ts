// Date Utility Functions
import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | Date | unknown): Date {
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as Timestamp).toDate();
  }
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }
  return new Date();
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | Timestamp, format: 'short' | 'long' | 'time' | 'dateTime' | 'iso' = 'short'): string {
  const d = timestampToDate(date);

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit' },
    dateTime: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
    iso: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };

  if (format === 'iso') {
    const isoString = d.toISOString();
    return isoString.split('T')[0] || '';
  }

  return d.toLocaleDateString('en-US', options[format]);
}

/**
 * Format time for display
 */
export function formatTime(date: Date | Timestamp): string {
  const d = timestampToDate(date);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format date range
 */
export function formatDateRange(startDate: Date | Timestamp, endDate: Date | Timestamp): string {
  const start = timestampToDate(startDate);
  const end = timestampToDate(endDate);

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${formatDate(start, 'short')} · ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDate(start, 'short')} - ${formatDate(end, 'short')}`;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | Timestamp): string {
  const d = timestampToDate(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 0) {
    // Past
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  } else {
    // Future
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return 'Starting now';
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date | Timestamp): boolean {
  const d = timestampToDate(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | Timestamp): boolean {
  const d = timestampToDate(date);
  return d < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | Timestamp): boolean {
  const d = timestampToDate(date);
  return d > new Date();
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | Timestamp): Date {
  const d = timestampToDate(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | Timestamp): Date {
  const d = timestampToDate(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Add days to date
 */
export function addDays(date: Date | Timestamp, days: number): Date {
  const d = timestampToDate(date);
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Add hours to date
 */
export function addHours(date: Date | Timestamp, hours: number): Date {
  const d = timestampToDate(date);
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Get days until date
 */
export function daysUntil(date: Date | Timestamp): number {
  const d = timestampToDate(date);
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Format for calendar/event display
 */
export function formatEventDate(startDate: Date | Timestamp, endDate: Date | Timestamp): {
  date: string;
  time: string;
  full: string;
} {
  const start = timestampToDate(startDate);
  const end = timestampToDate(endDate);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return {
      date: formatDate(start, 'long'),
      time: `${formatTime(start)} - ${formatTime(end)}`,
      full: `${formatDate(start, 'long')} · ${formatTime(start)} - ${formatTime(end)}`,
    };
  }

  return {
    date: `${formatDate(start, 'short')} - ${formatDate(end, 'short')}`,
    time: `${formatTime(start)} - ${formatTime(end)}`,
    full: `${formatDate(start, 'short')} - ${formatDate(end, 'short')} · ${formatTime(start)} - ${formatTime(end)}`,
  };
}

/**
 * Get day of week short name
 */
export function getDayName(date: Date | Timestamp): string {
  const d = timestampToDate(date);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get month short name
 */
export function getMonthName(date: Date | Timestamp): string {
  const d = timestampToDate(date);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Get day of month
 */
export function getDayOfMonth(date: Date | Timestamp): number {
  const d = timestampToDate(date);
  return d.getDate();
}