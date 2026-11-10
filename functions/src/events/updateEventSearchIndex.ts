import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface EventData {
  title: string;
  description: string;
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: admin.firestore.GeoPoint;
    geohash: string;
  };
  organizerId: string;
  category: string;
  visibility: 'public' | 'private' | 'unlisted';
  attendeeIds: string[];
  coOrganizerIds: string[];
  tags: string[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export const updateEventSearchIndex = functions.firestore
  .document('events/{eventId}')
  .onWrite(async (change, context) => {
    const eventId = context.params.eventId;
    const beforeData = change.before.exists ? change.before.data() as EventData : null;
    const afterData = change.after.exists ? change.after.data() as EventData : null;

    try {
      if (!afterData) {
        // Event deleted - remove from search index
        await db.collection('searchIndex').doc(eventId).delete();
        functions.logger.info(`Removed event ${eventId} from search index`);
        return;
      }

      // Only index public events
      if (afterData.visibility !== 'public') {
        await db.collection('searchIndex').doc(eventId).delete();
        functions.logger.info(`Removed private/unlisted event ${eventId} from search index`);
        return;
      }

      // Check if relevant fields changed
      const relevantFields = [
        'title', 'description', 'category', 'tags',
        'location.city', 'location.state', 'location.country',
        'location.coordinates', 'location.geohash',
        'startDate', 'endDate', 'visibility'
      ];

      let shouldUpdate = true;
      if (beforeData) {
        shouldUpdate = relevantFields.some(field => {
          const beforeValue = field.split('.').reduce((obj, key) => obj?.[key], beforeData);
          const afterValue = field.split('.').reduce((obj, key) => obj?.[key], afterData);
          return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
        });
      }

      if (!shouldUpdate) {
        functions.logger.info(`No relevant changes for event ${eventId}, skipping search index update`);
        return;
      }

      // Create search document
      const searchDoc = {
        eventId,
        title: afterData.title.toLowerCase(),
        description: afterData.description.toLowerCase(),
        category: afterData.category.toLowerCase(),
        tags: afterData.tags.map(t => t.toLowerCase()),
        city: afterData.location.city.toLowerCase(),
        state: afterData.location.state.toLowerCase(),
        country: afterData.location.country.toLowerCase(),
        geohash: afterData.location.geohash,
        coordinates: afterData.location.coordinates,
        startDate: afterData.startDate,
        endDate: afterData.endDate,
        organizerId: afterData.organizerId,
        attendeeCount: afterData.attendeeIds.length,
        createdAt: afterData.createdAt,
        updatedAt: afterData.updatedAt,
        // For text search
        searchText: [
          afterData.title,
          afterData.description,
          afterData.category,
          afterData.location.city,
          afterData.location.state,
          ...afterData.tags
        ].join(' ').toLowerCase()
      };

      await db.collection('searchIndex').doc(eventId).set(searchDoc);
      functions.logger.info(`Updated search index for event ${eventId}`);
    } catch (error) {
      functions.logger.error(`Error updating search index for event ${eventId}:`, error);
      throw error;
    }
  });