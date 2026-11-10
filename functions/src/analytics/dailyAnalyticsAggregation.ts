import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const dailyAnalyticsAggregation = functions.pubsub
  .schedule('0 3 * * *') // Run at 3 AM UTC daily
  .timeZone('UTC')
  .onRun(async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setUTCDate(today.getUTCDate() + 1);

    const startOfDay = admin.firestore.Timestamp.fromDate(yesterday);
    const endOfDay = admin.firestore.Timestamp.fromDate(today);

    try {
      // Aggregate various metrics
      const [
        newUsers,
        newEvents,
        totalEvents,
        totalUsers,
        rsvps,
        comments,
        activeUsers
      ] = await Promise.all([
        // New users
        db.collection('users')
          .where('createdAt', '>=', startOfDay)
          .where('createdAt', '<', endOfDay)
          .count()
          .get(),

        // New events
        db.collection('events')
          .where('createdAt', '>=', startOfDay)
          .where('createdAt', '<', endOfDay)
          .count()
          .get(),

        // Total events
        db.collection('events').count().get(),

        // Total users
        db.collection('users').count().get(),

        // RSVPs
        db.collectionGroup('attendees')
          .where('respondedAt', '>=', startOfDay)
          .where('respondedAt', '<', endOfDay)
          .count()
          .get(),

        // Comments
        db.collectionGroup('comments')
          .where('createdAt', '>=', startOfDay)
          .where('createdAt', '<', endOfDay)
          .count()
          .get(),

        // Active users (users who performed any action)
        db.collectionGroup('analytics')
          .where('timestamp', '>=', startOfDay)
          .where('timestamp', '<', endOfDay)
          .count()
          .get()
      ]);

      // Get event categories breakdown
      const eventsSnapshot = await db.collection('events')
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<', endOfDay)
        .get();

      const categoryCounts: Record<string, number> = {};
      for (const doc of eventsSnapshot.docs) {
        const category = doc.data().category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }

      // Get top cities
      const cityCounts: Record<string, number> = {};
      for (const doc of eventsSnapshot.docs) {
        const city = doc.data().location?.city;
        if (city) {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
      }

      // Store daily metrics
      const metricsRef = db.collection('dailyMetrics').doc(yesterday.toISOString().split('T')[0]);
      await metricsRef.set({
        date: startOfDay,
        newUsers: newUsers.data().count,
        newEvents: newEvents.data().count,
        totalEvents: totalEvents.data().count,
        totalUsers: totalUsers.data().count,
        rsvps: rsvps.data().count,
        comments: comments.data().count,
        activeUsers: activeUsers.data().count,
        categories: categoryCounts,
        topCities: Object.entries(cityCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([city, count]) => ({ city, count })),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info(`Daily analytics aggregated for ${yesterday.toISOString().split('T')[0]}`);
    } catch (error) {
      functions.logger.error('Error aggregating daily analytics:', error);
      throw error;
    }
  });