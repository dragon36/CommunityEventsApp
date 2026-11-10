import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

export const sendEventReminders = functions.pubsub
  .schedule('every 15 minutes')
  .timeZone('UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const fifteenMinutesFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 15 * 60 * 1000
    );
    const oneHourFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 60 * 60 * 1000
    );
    const oneDayFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 24 * 60 * 60 * 1000
    );

    try {
      // Find events starting in 15 minutes, 1 hour, or 1 day
      const eventsQuery = db.collection('events')
        .where('visibility', '==', 'public')
        .where('startDate', '>=', now)
        .where('startDate', '<=', oneDayFromNow);

      const eventsSnapshot = await eventsQuery.get();

      if (eventsSnapshot.empty) {
        functions.logger.info('No upcoming events for reminders');
        return;
      }

      const reminderPromises = eventsSnapshot.docs.map(async (eventDoc) => {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;
        const startDate = eventData.startDate as admin.firestore.Timestamp;
        const startMillis = startDate.toMillis();
        const nowMillis = now.toMillis();
        const diffMinutes = (startMillis - nowMillis) / (1000 * 60);

        let reminderType: '15min' | '1hour' | '1day' | null = null;
        if (diffMinutes <= 15 && diffMinutes > 0) {
          reminderType = '15min';
        } else if (diffMinutes <= 60 && diffMinutes > 15) {
          reminderType = '1hour';
        } else if (diffMinutes <= 1440 && diffMinutes > 60) {
          reminderType = '1day';
        }

        if (!reminderType) return;

        // Check if reminder already sent
        const reminderKey = `reminder_${reminderType}`;
        if (eventData.remindersSent?.includes(reminderKey)) {
          return;
        }

        // Get attendees who want reminders
        const attendeeIds = eventData.attendeeIds || [];
        if (attendeeIds.length === 0) return;

        const usersQuery = db.collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', attendeeIds.slice(0, 500))
          .where('notificationSettings.eventReminders', '==', true)
          .where('notificationSettings.pushEnabled', '==', true);

        const usersSnapshot = await usersQuery.get();

        if (usersSnapshot.empty) return;

        const userIds = usersSnapshot.docs.map(doc => doc.id);
        const tokens = usersSnapshot.docs
          .map(doc => doc.data().fcmToken)
          .filter((token): token is string => typeof token === 'string' && token.length > 0);

        // Create in-app notifications
        const batch = db.batch();
        const notificationsRef = db.collection('notifications');

        for (const userId of userIds) {
          const notificationRef = notificationsRef.doc();
          batch.set(notificationRef, {
            userId,
            type: 'event_reminder',
            title: `Event Starting Soon: ${eventData.title}`,
            body: getReminderMessage(reminderType, eventData),
            data: {
              eventId,
              eventTitle: eventData.title,
              reminderType,
              startDate: startDate.toISOString()
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        await batch.commit();

        // Send push notifications
        if (tokens.length > 0) {
          const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
              title: `Event Starting Soon: ${eventData.title}`,
              body: getReminderMessage(reminderType, eventData)
            },
            data: {
              eventId,
              eventTitle: eventData.title,
              reminderType,
              type: 'event_reminder'
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'reminders',
                icon: 'ic_notification',
                color: '#FF9800'
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  category: 'EVENT_REMINDER'
                }
              }
            }
          };

          await messaging.sendEachForMulticast(message);
        }

        // Mark reminder as sent
        await eventDoc.ref.update({
          remindersSent: admin.firestore.FieldValue.arrayUnion(reminderKey)
        });

        functions.logger.info(`Sent ${reminderType} reminders for event ${eventId} to ${userIds.length} users`);
      });

      await Promise.all(reminderPromises);
    } catch (error) {
      functions.logger.error('Error sending event reminders:', error);
      throw error;
    }
  });

function getReminderMessage(type: '15min' | '1hour' | '1day', eventData: any): string {
  switch (type) {
    case '15min':
      return `Starting in 15 minutes at ${eventData.location?.address || 'the venue'}`;
    case '1hour':
      return `Starting in 1 hour at ${eventData.location?.address || 'the venue'}`;
    case '1day':
      return `Starting tomorrow at ${eventData.location?.address || 'the venue'}`;
    default:
      return 'Starting soon!';
  }
}