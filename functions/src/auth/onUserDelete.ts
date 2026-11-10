import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const storage = admin.storage();

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    const batch = db.batch();

    // Delete user profile
    const userRef = db.collection('users').doc(uid);
    batch.delete(userRef);

    // Delete notification preferences
    const prefsRef = db.collection('notificationPreferences').doc(uid);
    batch.delete(prefsRef);

    // Delete user's notifications
    const notificationsQuery = db.collection('notifications').where('userId', '==', uid).limit(500);
    const notificationsSnapshot = await notificationsQuery.get();
    for (const doc of notificationsSnapshot.docs) {
      batch.delete(doc.ref);
    }

    // Delete user's reports
    const reportsQuery = db.collection('reports').where('reporterId', '==', uid).limit(500);
    const reportsSnapshot = await reportsQuery.get();
    for (const doc of reportsSnapshot.docs) {
      batch.delete(doc.ref);
    }

    // Delete user's analytics events
    const analyticsQuery = db.collection('analytics').where('userId', '==', uid).limit(500);
    const analyticsSnapshot = await analyticsQuery.get();
    for (const doc of analyticsSnapshot.docs) {
      batch.delete(doc.ref);
    }

    // Delete user's friends subcollection
    const friendsQuery = db.collection('users').doc(uid).collection('friends').limit(500);
    const friendsSnapshot = await friendsQuery.get();
    for (const doc of friendsSnapshot.docs) {
      batch.delete(doc.ref);
    }

    // Delete user's saved events
    const savedEventsQuery = db.collection('users').doc(uid).collection('savedEvents').limit(500);
    const savedEventsSnapshot = await savedEventsQuery.get();
    for (const doc of savedEventsSnapshot.docs) {
      batch.delete(doc.ref);
    }

    // Remove user from other users' follower/following lists
    const followersQuery = db.collection('users').where('followerIds', 'array-contains', uid).limit(500);
    const followersSnapshot = await followersQuery.get();
    for (const doc of followersSnapshot.docs) {
      batch.update(doc.ref, { followerIds: admin.firestore.FieldValue.arrayRemove(uid) });
    }

    const followingQuery = db.collection('users').where('followingIds', 'array-contains', uid).limit(500);
    const followingSnapshot = await followingQuery.get();
    for (const doc of followingSnapshot.docs) {
      batch.update(doc.ref, { followingIds: admin.firestore.FieldValue.arrayRemove(uid) });
    }

    // Remove user from events they organized
    const organizedEventsQuery = db.collection('events').where('organizerId', '==', uid).limit(500);
    const organizedEventsSnapshot = await organizedEventsQuery.get();
    for (const doc of organizedEventsSnapshot.docs) {
      // Transfer ownership or delete event
      const eventData = doc.data();
      if (eventData.coOrganizerIds?.length > 0) {
        // Transfer to first co-organizer
        const newOrganizerId = eventData.coOrganizerIds[0];
        batch.update(doc.ref, {
          organizerId: newOrganizerId,
          coOrganizerIds: admin.firestore.FieldValue.arrayRemove(newOrganizerId)
        });
      } else {
        // No co-organizers, mark as cancelled
        batch.update(doc.ref, {
          status: 'cancelled',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancellationReason: 'Organizer account deleted'
        });
      }
    }

    // Remove user from events they're attending
    const attendingEventsQuery = db.collection('events').where('attendeeIds', 'array-contains', uid).limit(500);
    const attendingEventsSnapshot = await attendingEventsQuery.get();
    for (const doc of attendingEventsSnapshot.docs) {
      batch.update(doc.ref, {
        attendeeIds: admin.firestore.FieldValue.arrayRemove(uid)
      });

      // Also remove from attendees subcollection
      const attendeeRef = doc.ref.collection('attendees').doc(uid);
      batch.delete(attendeeRef);
    }

    // Remove user from co-organizer lists
    const coOrganizerEventsQuery = db.collection('events').where('coOrganizerIds', 'array-contains', uid).limit(500);
    const coOrganizerEventsSnapshot = await coOrganizerEventsQuery.get();
    for (const doc of coOrganizerEventsSnapshot.docs) {
      batch.update(doc.ref, {
        coOrganizerIds: admin.firestore.FieldValue.arrayRemove(uid)
      });
    }

    // Delete user's uploaded files from Storage
    try {
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });
      if (files.length > 0) {
        await bucket.deleteFiles(files);
      }
    } catch (storageError) {
      functions.logger.warn(`Error deleting storage files for user ${uid}:`, storageError);
    }

    await batch.commit();
    functions.logger.info(`Cleaned up data for deleted user ${uid}`);
  } catch (error) {
    functions.logger.error(`Error cleaning up data for user ${uid}:`, error);
    throw error;
  }
});