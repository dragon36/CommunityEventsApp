import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const storage = admin.storage();

export const cleanupOrphanedImages = functions.pubsub
  .schedule('every 7 days')
  .timeZone('UTC')
  .onRun(async () => {
    const bucket = storage.bucket();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    try {
      // List all files in the bucket
      const [files] = await bucket.getFiles({ prefix: 'users/', autoPaginate: false });
      const [eventFiles] = await bucket.getFiles({ prefix: 'events/', autoPaginate: false });

      const allFiles = [...files, ...eventFiles];
      let deletedCount = 0;

      for (const file of allFiles) {
        const [metadata] = await file.getMetadata();
        const createdTime = new Date(metadata.timeCreated).getTime();

        // Skip recently uploaded files
        if (createdTime > thirtyDaysAgo) continue;

        // Skip processed variants (they'll be deleted with original)
        if (metadata.name.includes('_processed') || metadata.name.includes('_thumb')) continue;

        const customMetadata = metadata.metadata || {};
        const originalPath = customMetadata.originalPath;

        if (!originalPath) continue;

        // Check if original is referenced in Firestore
        let isReferenced = false;

        if (originalPath.startsWith('events/')) {
          // Check events
          const eventId = originalPath.split('/')[1];
          const eventDoc = await db.collection('events').doc(eventId).get();

          if (eventDoc.exists) {
            const eventData = eventDoc.data()!;
            const coverUrls = eventData.coverImageUrls || [];
            const galleryUrls = eventData.galleryImages || [];
            const allUrls = [...coverUrls, ...galleryUrls];

            isReferenced = allUrls.some((url: string) => url.includes(file.name));
          }
        } else if (originalPath.startsWith('users/')) {
          // Check users
          const userId = originalPath.split('/')[1];
          const userDoc = await db.collection('users').doc(userId).get();

          if (userDoc.exists) {
            const userData = userDoc.data()!;
            const avatarUrls = userData.avatarUrls || [];

            isReferenced = avatarUrls.some((url: string) => url.includes(file.name));
          }
        }

        if (!isReferenced) {
          // Delete the file and its variants
          const baseName = path.parse(file.name).name;
          const dirName = path.dirname(file.name);
          const extension = path.parse(file.name).ext;

          // Find all variants
          const [variants] = await bucket.getFiles({ prefix: `${dirName}/${baseName}` });

          for (const variant of variants) {
            await variant.delete();
            deletedCount++;
          }

          functions.logger.info(`Deleted orphaned image: ${file.name} and ${variants.length - 1} variants`);
        }
      }

      functions.logger.info(`Cleanup complete. Deleted ${deletedCount} orphaned image files.`);
    } catch (error) {
      functions.logger.error('Error cleaning up orphaned images:', error);
      throw error;
    }
  });