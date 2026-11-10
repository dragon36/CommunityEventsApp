import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

interface EventData {
  title: string;
  description: string;
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: admin.firestore.GeoPoint;
  };
  organizerId: string;
  category: string;
  visibility: 'public' | 'private' | 'unlisted';
  attendeeIds: string[];
  coOrganizerIds: string[];
}

export const createEventNotifications = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const eventData = snap.data() as EventData;
    const eventId = context.params.eventId;

    try {
      // Get users who might be interested in this event
      // For now, notify followers of the organizer and users in the same city
      const organizerRef = db.collection('users').doc(eventData.organizerId);
      const organizerDoc = await organizerRef.get();

      if (!organizerDoc.exists) {
        functions.logger.warn(`Organizer ${eventData.organizerId} not found for event ${eventId}`);
        return;
      }

      const organizerData = organizerDoc.data()!;
      const followerIds = organizerData.followerIds || [];

      // Get users in the same city who have notifications enabled
      const usersQuery = db.collection('users')
        .where('location.city', '==', eventData.location.city)
        .where('notificationSettings.newEventsNearby', '==', true)
        .where('notificationSettings.pushEnabled', '==', true)
        .limit(100);

      const usersSnapshot = await usersQuery.get();
      const nearbyUserIds = usersSnapshot.docs
        .map(doc => doc.id)
        .filter(id => id !== eventData.organizerId);

      // Combine and deduplicate user IDs
      const allUserIds = [...new Set([...followerIds, ...nearbyUserIds])];

      if (allUserIds.length === 0) {
        functions.logger.info(`No users to notify for new event ${eventId}`);
        return;
      }

      // Create notification documents
      const batch = db.batch();
      const notificationsRef = db.collection('notifications');

      for (const userId of allUserIds) {
        const notificationRef = notificationsRef.doc();
        batch.set(notificationRef, {
          userId,
          type: 'new_event',
          title: 'New Event Near You!',
          body: `${organizerData.displayName} created "${eventData.title}" in ${eventData.location.city}`,
          data: {
            eventId,
            eventTitle: eventData.title,
            organizerId: eventData.organizerId,
            category: eventData.category
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
      functions.logger.info(`Created ${allUserIds.length} notifications for event ${eventId}`);

      // Send push notifications to users with FCM tokens
      const tokensQuery = db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', allUserIds.slice(0, 500))
        .where('fcmToken', '!=', null);

      const tokensSnapshot = await tokensQuery.get();
      const tokens = tokensSnapshot.docs
        .map(doc => doc.data().fcmToken)
        .filter((token): token is string => typeof token === 'string' && token.length > 0);

      if (tokens.length > 0) {
        const message: admin.messaging.MulticastMessage = {
          tokens,
          notification: {
            title: 'New Event Near You!',
            body: `${organizerData.displayName} created "${eventData.title}" in ${eventData.location.city}`
          },
          data: {
            eventId,
            eventTitle: eventData.title,
            organizerId: eventData.organizerId,
            category: eventData.category,
            type: 'new_event'
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'events',
              icon: 'ic_notification',
              color: '#4285F4'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                category: 'NEW_EVENT'
              }
            }
          }
        };

        const response = await messaging.sendEachForMulticast(message);
        functions.logger.info(`Sent push notifications: ${response.successCount} success, ${response.failureCount} failed`);

        // Handle failed tokens
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
            }
          });

          // Remove invalid tokens
          if (failedTokens.length > 0) {
            const usersWithFailedTokens = tokensSnapshot.docs.filter(doc =>
              failedTokens.includes(doc.data().fcmToken)
            );

            const tokenBatch = db.batch();
            for (const userDoc of usersWithFailedTokens) {
              tokenBatch.update(userDoc.ref, { fcmToken: admin.firestore.FieldValue.delete() });
            }
            await tokenBatch.commit();
          }
        }
      }
    } catch (error) {
      functions.logger.error(`Error creating notifications for event ${eventId}:`, error);
      throw error;
    }
  });