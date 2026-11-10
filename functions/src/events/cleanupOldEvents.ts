import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const cleanupOldEvents = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('UTC')
  .onRun(async () => {
    const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    try {
      // Find events that ended more than 30 days ago and are not recurring
      const eventsQuery = db.collection('events')
        .where('endDate', '<', thirtyDaysAgo)
        .where('isRecurring', '!=', true)
        .limit(500);

      const eventsSnapshot = await eventsQuery.get();

      if (eventsSnapshot.empty) {
        functions.logger.info('No old events to clean up');
        return;
      }

      const batch = db.batch();
      let deletedCount = 0;

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;

        // Archive instead of delete - move to archivedEvents collection
        const archivedRef = db.collection('archivedEvents').doc(eventId);
        batch.set(archivedRef, {
          ...eventData,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          originalId: eventId
        });

        // Delete subcollections
        const subcollections = ['attendees', 'comments'];
        for (const subcollection of subcollections) {
          const subSnapshot = await eventDoc.ref.collection(subcollection).get();
          for (const subDoc of subSnapshot.docs) {
            batch.delete(subDoc.ref);
          }
        }

        // Delete the main event document
        batch.delete(eventDoc.ref);
        deletedCount++;
      }

      await batch.commit();
      functions.logger.info(`Archived ${deletedCount} old events`);
    } catch (error) {
      functions.logger.error('Error cleaning up old events:', error);
      throw error;
    }
  });