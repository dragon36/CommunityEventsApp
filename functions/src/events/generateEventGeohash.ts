import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';

const db = admin.firestore();

interface EventData {
  location: {
    coordinates: admin.firestore.GeoPoint;
    address: string;
    city: string;
    state: string;
    country: string;
    geohash?: string;
  };
}

export const generateEventGeohash = functions.firestore
  .document('events/{eventId}')
  .onWrite(async (change, context) => {
    const { eventId } = context.params;
    const beforeData = change.before.exists ? change.before.data() as EventData : null;
    const afterData = change.after.exists ? change.after.data() as EventData : null;

    try {
      if (!afterData || !afterData.location?.coordinates) {
        return;
      }

      // Check if coordinates changed
      const beforeCoords = beforeData?.location?.coordinates;
      const afterCoords = afterData.location.coordinates;

      if (beforeCoords && afterCoords) {
        const beforeLat = beforeCoords.latitude;
        const beforeLng = beforeCoords.longitude;
        const afterLat = afterCoords.latitude;
        const afterLng = afterCoords.longitude;

        if (beforeLat === afterLat && beforeLng === afterLng) {
          return; // Coordinates haven't changed
        }
      }

      // Generate geohash with precision 9 (approx 4.7m x 4.7m)
      const geohash = geofire.geohashForLocation([
        afterCoords.latitude,
        afterCoords.longitude
      ], 9);

      // Update the event document with the geohash
      await change.after.ref.update({
        'location.geohash': geohash
      });

      functions.logger.info(`Generated geohash for event ${eventId}: ${geohash}`);
    } catch (error) {
      functions.logger.error(`Error generating geohash for event ${eventId}:`, error);
      throw error;
    }
  });