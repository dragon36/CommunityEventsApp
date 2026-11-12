// Validation Utilities
import * as z from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Display name validation
export const displayNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Event validation schemas
export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().min(1, 'Address is required'),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  placeId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  type: z.enum(['parade', 'trick_or_treat', 'special_event']),
  location: locationSchema,
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  images: z.array(z.any()).max(5, 'Maximum 5 images allowed').optional(),
  maxAttendees: z.number().int().positive().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Profile validation
export const profileSchema = z.object({
  displayName: displayNameSchema,
  photoURL: z.string().url().optional().or(z.literal('')),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  notificationSettings: z.object({
    eventApproved: z.boolean(),
    eventRejected: z.boolean(),
    eventReminder: z.boolean(),
    newEventsNearby: z.boolean(),
    adminAnnouncements: z.boolean(),
  }).optional(),
});

// Validation helper
export function validateEmail(email: string): { valid: boolean; message?: string } {
  const result = emailSchema.safeParse(email);
  return result.success ? { valid: true } : { valid: false, message: result.error.errors[0]?.message || 'Invalid email' };
}

export function validatePassword(password: string): { valid: boolean; message?: string; score: number } {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (!checks.length) return { valid: false, message: 'Password must be at least 8 characters', score: passedChecks };
  if (!checks.uppercase) return { valid: false, message: 'Password must contain at least one uppercase letter', score: passedChecks };
  if (!checks.lowercase) return { valid: false, message: 'Password must contain at least one lowercase letter', score: passedChecks };
  if (!checks.number) return { valid: false, message: 'Password must contain at least one number', score: passedChecks };
  if (!checks.special) return { valid: false, message: 'Password must contain at least one special character', score: passedChecks };

  return { valid: true, message: 'Password is strong', score: 5 };
}

export function validateDisplayName(name: string): { valid: boolean; message?: string } {
  const result = displayNameSchema.safeParse(name);
  return result.success ? { valid: true } : { valid: false, message: result.error.errors[0]?.message || 'Invalid name' };
}

export function validateEventForm(data: unknown): { valid: boolean; errors?: Record<string, string>; data?: z.infer<typeof eventFormSchema> } {
  const result = eventFormSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return { valid: false, errors };
}

export function validateProfile(data: unknown): { valid: boolean; errors?: Record<string, string>; data?: z.infer<typeof profileSchema> } {
  const result = profileSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return { valid: false, errors };
}