// =============================================================================
// COMMUNITY EVENTS APP - UTILITY FUNCTIONS
// =============================================================================

import { GeoPoint } from '@/types';

// -----------------------------------------------------------------------------
// DATE UTILITIES
// -----------------------------------------------------------------------------
export const formatDate = (date: Date | string | number, formatStr: string = 'MMM d, yyyy'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const formatMap: Record<string, () => string> = {
    'YYYY': () => d.getFullYear().toString(),
    'YY': () => d.getFullYear().toString().slice(-2),
    'MMMM': () => d.toLocaleString('default', { month: 'long' }),
    'MMM': () => d.toLocaleString('default', { month: 'short' }),
    'MM': () => String(d.getMonth() + 1).padStart(2, '0'),
    'M': () => (d.getMonth() + 1).toString(),
    'DD': () => String(d.getDate()).padStart(2, '0'),
    'D': () => d.getDate().toString(),
    'dddd': () => d.toLocaleString('default', { weekday: 'long' }),
    'ddd': () => d.toLocaleString('default', { weekday: 'short' }),
    'HH': () => String(d.getHours()).padStart(2, '0'),
    'H': () => d.getHours().toString(),
    'hh': () => String(d.getHours() % 12 || 12).padStart(2, '0'),
    'h': () => (d.getHours() % 12 || 12).toString(),
    'mm': () => String(d.getMinutes()).padStart(2, '0'),
    'm': () => d.getMinutes().toString(),
    'ss': () => String(d.getSeconds()).padStart(2, '0'),
    's': () => d.getSeconds().toString(),
    'A': () => d.getHours() >= 12 ? 'PM' : 'AM',
    'a': () => d.getHours() >= 12 ? 'pm' : 'am',
  };

  return formatStr.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g, match => {
    return formatMap[match] ? formatMap[match]() : match;
  });
};

export const formatRelativeTime = (date: Date | string | number): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();
};

export const isPast = (date: Date): boolean => {
  return new Date(date) < new Date();
};

export const isFuture = (date: Date): boolean => {
  return new Date(date) > new Date();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// -----------------------------------------------------------------------------
// STRING UTILITIES
// -----------------------------------------------------------------------------
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (text: string, length: number, suffix: string = '...'): string => {
  if (text.length <= length) return text;
  return text.slice(0, length - suffix.length) + suffix;
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const titleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
};

// -----------------------------------------------------------------------------
// NUMBER UTILITIES
// -----------------------------------------------------------------------------
export const formatNumber = (num: number, decimals: number = 0): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(decimals) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(decimals) + 'K';
  return num.toString();
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundTo = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// -----------------------------------------------------------------------------
// GEOGRAPHY UTILITIES
// -----------------------------------------------------------------------------
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const getBoundsFromCenter = (
  center: GeoPoint,
  radiusMeters: number
): { northeast: GeoPoint; southwest: GeoPoint } => {
  const lat = center.latitude;
  const lng = center.longitude;
  const R = 6371e3;

  const latDelta = (radiusMeters / R) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);

  return {
    northeast: { latitude: lat + latDelta, longitude: lng + lngDelta },
    southwest: { latitude: lat - latDelta, longitude: lng - lngDelta },
  };
};

export const geohashEncode = (lat: number, lng: number, precision: number = 9): string => {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let hash = '';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch = (ch << 1) | 1;
        minLng = mid;
      } else {
        ch = (ch << 1) | 0;
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch = (ch << 1) | 1;
        minLat = mid;
      } else {
        ch = (ch << 1) | 0;
        maxLat = mid;
      }
    }
    even = !even;
    if (++bit === 5) {
      hash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
};

export const geohashDecode = (hash: string): { latitude: number; longitude: number } => {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let even = true;

  for (const char of hash) {
    const idx = base32.indexOf(char);
    for (let i = 4; i >= 0; i--) {
      const bit = (idx >> i) & 1;
      if (even) {
        const mid = (minLng + maxLng) / 2;
        if (bit === 1) minLng = mid;
        else maxLng = mid;
      } else {
        const mid = (minLat + maxLat) / 2;
        if (bit === 1) minLat = mid;
        else maxLat = mid;
      }
      even = !even;
    }
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  };
};

// -----------------------------------------------------------------------------
// ARRAY UTILITIES
// -----------------------------------------------------------------------------
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T | ((item: T) => any), order: 'asc' | 'desc' = 'asc'): T[] => {
  const getValue = typeof key === 'function' ? key : (item: T) => item[key];
  return [...array].sort((a, b) => {
    const valA = getValue(a);
    const valB = getValue(b);
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// -----------------------------------------------------------------------------
// OBJECT UTILITIES
// -----------------------------------------------------------------------------
export const pick = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// -----------------------------------------------------------------------------0
// VALIDATION UTILITIES
// -----------------------------------------------------------------------------
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidPhone = (phone: string): boolean => {
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
};

export const isStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('One special character');
  return { valid: errors.length === 0, errors };
};

// -----------------------------------------------------------------------------
// STORAGE UTILITIES
// -----------------------------------------------------------------------------
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const isImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

export const isVideoFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase();
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
};

// -----------------------------------------------------------------------------
// DEBOUNCE / THROTTLE
// -----------------------------------------------------------------------------
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// -----------------------------------------------------------------------------
// COLORS
// -----------------------------------------------------------------------------
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

export const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    Math.min(255, Math.round(rgb.r + 255 * amount)),
    Math.min(255, Math.round(rgb.g + 255 * amount)),
    Math.min(255, Math.round(rgb.b + 255 * amount))
  );
};

export const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    Math.max(0, Math.round(rgb.r - 255 * amount)),
    Math.max(0, Math.round(rgb.g - 255 * amount)),
    Math.max(0, Math.round(rgb.b - 255 * amount))
  );
};

export default {
  formatDate,
  formatRelativeTime,
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  addDays,
  startOfDay,
  endOfDay,
  slugify,
  truncate,
  capitalize,
  titleCase,
  generateId,
  maskEmail,
  formatNumber,
  formatDistance,
  clamp,
  roundTo,
  calculateDistance,
  getBoundsFromCenter,
  geohashEncode,
  geohashDecode,
  chunk,
  unique,
  groupBy,
  sortBy,
  shuffle,
  pick,
  omit,
  deepClone,
  isEmpty,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isStrongPassword,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isVideoFile,
  debounce,
  throttle,
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
};