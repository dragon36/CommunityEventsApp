import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

export const weeklyDigest = functions.pubsub
  .schedule('0 9 * * 1') // Every Monday at 9 AM UTC
  .timeZone('UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const oneWeekFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 7 * 24 * 60 * 60 * 1000
    );

    try {
      // Find users who want weekly digest
      const usersQuery = db.collection('users')
        .where('notificationSettings.weeklyDigest', '==', true)
        .where('notificationSettings.pushEnabled', '==', true)
        .where('notificationSettings.emailEnabled', '==', true)
        .limit(500);

      const usersSnapshot = await usersQuery.get();

      if (usersSnapshot.empty) {
        functions.logger.info('No users subscribed to weekly digest');
        return;
      }

      // Get events for the upcoming week
      const eventsQuery = db.collection('events')
        .where('visibility', '==', 'public')
        .where('startDate', '>=', now)
        .where('startDate', '<=', oneWeekFromNow)
        .orderBy('startDate', 'asc')
        .limit(20);

      const eventsSnapshot = await eventsQuery.get();

      if (eventsSnapshot.empty) {
        functions.logger.info('No events this week for digest');
        return;
      }

      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process each user
      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Filter events by user's location/interests
        const relevantEvents = events.filter(event => {
          // Same city
          if (userData.location?.city === event.location?.city) return true;
          // Same state
          if (userData.location?.state === event.location?.state) return true;
          // Interested categories
          if (userData.interestedCategories?.includes(event.category)) return true;
          return false;
        }).slice(0, 5);

        if (relevantEvents.length === 0) return;

        // Create in-app notification
        const notificationRef = db.collection('notifications').doc();
        await notificationRef.set({
          userId,
          type: 'weekly_digest',
          title: 'Your Weekly Event Digest 📅',
          body: `We found ${relevantEvents.length} events you might like this week!`,
          data: {
            eventIds: relevantEvents.map(e => e.id),
            eventCount: relevantEvents.length
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send push notification
        if (userData.fcmToken) {
          const message: admin.messaging.Message = {
            token: userData.fcmToken,
            notification: {
              title: 'Your Weekly Event Digest 📅',
              body: `We found ${relevantEvents.length} events you might like this week!`
            },
            data: {
              type: 'weekly_digest',
              eventIds: relevantEvents.map(e => e.id).join(','),
              eventCount: relevantEvents.length.toString()
            },
            android: {
              priority: 'normal',
              notification: { channelId: 'digest', icon: 'ic_notification', color: '#9C27B0' }
            },
            apns: { payload: { aps: { sound: 'default', badge: 1, category: 'WEEKLY_DIGEST' } } }
          };
          await messaging.send(message);
        }

        // Send email (if implemented)
        // await sendWeeklyDigestEmail(userData.email, relevantEvents);
      });

      await Promise.all(promises);
      functions.logger.info(`Sent weekly digest to ${usersSnapshot.size} users`);
    } catch (error) {
      functions.logger.error('Error sending weekly digest:', error);
      throw error;
    }
  });