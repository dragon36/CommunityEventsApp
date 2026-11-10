import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export { createEventNotifications } from './events/createEventNotifications';
export { updateEventSearchIndex } from './events/updateEventSearchIndex';
export { sendEventReminders } from './events/sendEventReminders';
export { cleanupOldEvents } from './events/cleanupOldEvents';
export { onUserCreate } from './auth/onUserCreate';
export { onUserDelete } from './auth/onUserDelete';
export { processRSVP } from './events/processRSVP';
export { generateEventGeohash } from './events/generateEventGeohash';
export { sendWelcomeEmail } from './auth/sendWelcomeEmail';
export { moderateContent } from './moderation/moderateContent';
export { handleReport } from './moderation/handleReport';
export { syncCalendarEvent } from './calendar/syncCalendarEvent';
export { processImageUpload } from './storage/processImageUpload';
export { cleanupOrphanedImages } from './storage/cleanupOrphanedImages';
export { dailyAnalyticsAggregation } from './analytics/dailyAnalyticsAggregation';
export { weeklyDigest } from './notifications/weeklyDigest';