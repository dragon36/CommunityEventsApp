import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

interface RSVPData {
  userId: string;
  status: 'going' | 'interested' | 'not_going';
  respondedAt: admin.firestore.Timestamp;
}

export const processRSVP = functions.firestore
  .document('events/{eventId}/attendees/{attendeeId}')
  .onWrite(async (change, context) => {
    const { eventId, attendeeId } = context.params;
    const beforeData = change.before.exists ? change.before.data() as RSVPData : null;
    const afterData = change.after.exists ? change.after.data() as RSVPData : null;

    try {
      const eventRef = db.collection('events').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        functions.logger.warn(`Event ${eventId} not found for RSVP processing`);
        return;
      }

      const eventData = eventDoc.data()!;
      const batch = db.batch();

      if (!beforeData && afterData) {
        // New RSVP
        const newStatus = afterData.status;

        if (newStatus === 'going') {
          batch.update(eventRef, {
            attendeeIds: admin.firestore.FieldValue.arrayUnion(attendeeId)
          });
        }

        // Notify organizer
        const organizerRef = db.collection('users').doc(eventData.organizerId);
        const organizerDoc = await organizerRef.get();

        if (organizerDoc.exists) {
          const organizerData = organizerDoc.data()!;
          if (organizerData.notificationSettings?.eventUpdates && organizerData.fcmToken) {
            const userRef = db.collection('users').doc(attendeeId);
            const userDoc = await userRef.get();
            const userName = userDoc.exists ? userDoc.data()!.displayName : 'Someone';

            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
              userId: eventData.organizerId,
              type: 'rsvp',
              title: 'New RSVP',
              body: `${userName} is ${newStatus} to "${eventData.title}"`,
              data: {
                eventId,
                eventTitle: eventData.title,
                attendeeId,
                status: newStatus
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Send push notification
            if (organizerData.fcmToken) {
              const message: admin.messaging.Message = {
                token: organizerData.fcmToken,
                notification: {
                  title: 'New RSVP',
                  body: `${userName} is ${newStatus} to "${eventData.title}"`
                },
                data: {
                  eventId,
                  eventTitle: eventData.title,
                  attendeeId,
                  status: newStatus,
                  type: 'rsvp'
                },
                android: {
                  priority: 'high',
                  notification: { channelId: 'events', icon: 'ic_notification', color: '#4285F4' }
                },
                apns: { payload: { aps: { sound: 'default', badge: 1, category: 'RSVP' } } }
              };
              await messaging.send(message);
            }
          }
        }
      } else if (beforeData && afterData && beforeData.status !== afterData.status) {
        // RSVP status changed
        const oldStatus = beforeData.status;
        const newStatus = afterData.status;

        if (oldStatus === 'going' && newStatus !== 'going') {
          batch.update(eventRef, {
            attendeeIds: admin.firestore.FieldValue.arrayRemove(attendeeId)
          });
        } else if (oldStatus !== 'going' && newStatus === 'going') {
          batch.update(eventRef, {
            attendeeIds: admin.firestore.FieldValue.arrayUnion(attendeeId)
          });
        }

        // Notify organizer of change
        const organizerRef = db.collection('users').doc(eventData.organizerId);
        const organizerDoc = await organizerRef.get();

        if (organizerDoc.exists) {
          const organizerData = organizerDoc.data()!;
          if (organizerData.notificationSettings?.eventUpdates && organizerData.fcmToken) {
            const userRef = db.collection('users').doc(attendeeId);
            const userDoc = await userRef.get();
            const userName = userDoc.exists ? userDoc.data()!.displayName : 'Someone';

            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
              userId: eventData.organizerId,
              type: 'rsvp_update',
              title: 'RSVP Updated',
              body: `${userName} changed from ${oldStatus} to ${newStatus} for "${eventData.title}"`,
              data: {
                eventId,
                eventTitle: eventData.title,
                attendeeId,
                oldStatus,
                newStatus
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      } else if (beforeData && !afterData) {
        // RSVP removed
        if (beforeData.status === 'going') {
          batch.update(eventRef, {
            attendeeIds: admin.firestore.FieldValue.arrayRemove(attendeeId)
          });
        }
      }

      await batch.commit();
      functions.logger.info(`Processed RSVP for event ${eventId}, attendee ${attendeeId}`);
    } catch (error) {
      functions.logger.error(`Error processing RSVP for event ${eventId}:`, error);
      throw error;
    }
  });