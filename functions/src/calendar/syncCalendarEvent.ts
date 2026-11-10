import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

const db = admin.firestore();

// Google Calendar API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

interface EventData {
  title: string;
  description: string;
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  location: {
    address: string;
    city: string;
    state: string;
  };
  organizerId: string;
}

export const syncCalendarEvent = functions.firestore
  .document('events/{eventId}')
  .onWrite(async (change, context) => {
    const { eventId } = context.params;
    const beforeData = change.before.exists ? change.before.data() as EventData : null;
    const afterData = change.after.exists ? change.after.data() as EventData : null;

    try {
      // Only sync for organizer who has connected Google Calendar
      const organizerRef = db.collection('users').doc(afterData?.organizerId || beforeData?.organizerId);
      const organizerDoc = await organizerRef.get();

      if (!organizerDoc.exists) return;

      const organizerData = organizerDoc.data()!;
      const googleTokens = organizerData.googleCalendarTokens;

      if (!googleTokens?.access_token) {
        return; // User hasn't connected Google Calendar
      }

      // Set credentials
      oauth2Client.setCredentials({
        access_token: googleTokens.access_token,
        refresh_token: googleTokens.refresh_token,
        expiry_date: googleTokens.expiry_date
      });

      if (!afterData) {
        // Event deleted - remove from calendar
        if (beforeData?.googleCalendarEventId) {
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: beforeData.googleCalendarEventId
          });
          functions.logger.info(`Deleted Google Calendar event for ${eventId}`);
        }
        return;
      }

      const eventBody = {
        summary: afterData.title,
        description: afterData.description,
        start: {
          dateTime: afterData.startDate.toDate().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: afterData.endDate.toDate().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: `${afterData.location.address}, ${afterData.location.city}, ${afterData.location.state}`,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'email', minutes: 60 }
          ]
        },
        extendedProperties: {
          private: {
            communityEventId: eventId
          }
        }
      };

      let googleCalendarEventId = beforeData?.googleCalendarEventId;

      if (googleCalendarEventId) {
        // Update existing event
        const response = await calendar.events.update({
          calendarId: 'primary',
          eventId: googleCalendarEventId,
          requestBody: eventBody
        });
        googleCalendarEventId = response.data.id!;
        functions.logger.info(`Updated Google Calendar event for ${eventId}`);
      } else {
        // Create new event
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody
        });
        googleCalendarEventId = response.data.id!;
        functions.logger.info(`Created Google Calendar event for ${eventId}`);
      }

      // Store the Google Calendar event ID
      if (googleCalendarEventId && (!beforeData || beforeData.googleCalendarEventId !== googleCalendarEventId)) {
        await change.after.ref.update({
          googleCalendarEventId
        });
      }
    } catch (error: any) {
      functions.logger.error(`Error syncing calendar for event ${eventId}:`, error);

      // If token expired, try to refresh
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          await organizerRef.update({
            'googleCalendarTokens.access_token': credentials.access_token,
            'googleCalendarTokens.expiry_date': credentials.expiry_date
          });
          functions.logger.info(`Refreshed Google Calendar tokens for user ${organizerDoc.id}`);
        } catch (refreshError) {
          functions.logger.error(`Failed to refresh tokens:`, refreshError);
          // Disconnect calendar
          await organizerRef.update({
            googleCalendarTokens: admin.firestore.FieldValue.delete()
          });
        }
      }
    }
  });