import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

interface ReportData {
  targetType: 'event' | 'comment' | 'user' | 'venue';
  targetId: string;
  reporterId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  flaggedContent?: string[];
  resolvedAt?: admin.firestore.Timestamp;
  resolvedBy?: string;
}

export const handleReport = functions.firestore
  .document('reports/{reportId}')
  .onUpdate(async (change, context) => {
    const { reportId } = context.params;
    const beforeData = change.before.data() as ReportData;
    const afterData = change.after.data() as ReportData;

    // Only act when status changes to resolved or dismissed
    if (beforeData.status === afterData.status) {
      return;
    }

    if (afterData.status !== 'resolved' && afterData.status !== 'dismissed') {
      return;
    }

    try {
      const batch = db.batch();

      if (afterData.status === 'resolved') {
        // Take action based on target type
        switch (afterData.targetType) {
          case 'event': {
            const eventRef = db.collection('events').doc(afterData.targetId);
            const eventDoc = await eventRef.get();

            if (eventDoc.exists) {
              const eventData = eventDoc.data()!;

              // Hide or delete based on severity
              if (afterData.severity === 'high') {
                batch.update(eventRef, {
                  status: 'removed',
                  removedAt: admin.firestore.FieldValue.serverTimestamp(),
                  removalReason: `Content policy violation: ${afterData.reason}`,
                  removedBy: afterData.resolvedBy
                });
              } else {
                batch.update(eventRef, {
                  visibility: 'private',
                  moderationFlagged: false
                });
              }

              // Notify organizer
              const notificationRef = db.collection('notifications').doc();
              batch.set(notificationRef, {
                userId: eventData.organizerId,
                type: 'moderation',
                title: 'Event Moderated',
                body: `Your event "${eventData.title}" was ${afterData.severity === 'high' ? 'removed' : 'hidden'} due to a content policy violation.`,
                data: {
                  eventId: afterData.targetId,
                  reportId,
                  action: afterData.severity === 'high' ? 'removed' : 'hidden'
                },
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            break;
          }

          case 'comment': {
            const commentRef = db.collection('events').doc(afterData.targetId.split('_')[0])
              .collection('comments').doc(afterData.targetId);

            batch.update(commentRef, {
              hidden: true,
              moderationAction: 'hidden',
              moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
              moderatedBy: afterData.resolvedBy
            });
            break;
          }

          case 'user': {
            const userRef = db.collection('users').doc(afterData.targetId);

            if (afterData.severity === 'high') {
              // Suspend user
              batch.update(userRef, {
                suspended: true,
                suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
                suspensionReason: afterData.reason,
                suspendedBy: afterData.resolvedBy
              });

              // Revoke auth tokens (requires Admin SDK)
              try {
                await admin.auth().revokeRefreshTokens(afterData.targetId);
              } catch (authError) {
                functions.logger.error(`Error revoking tokens for user ${afterData.targetId}:`, authError);
              }
            } else {
              // Warning
              batch.update(userRef, {
                warningCount: admin.firestore.FieldValue.increment(1),
                lastWarningAt: admin.firestore.FieldValue.serverTimestamp(),
                lastWarningReason: afterData.reason
              });
            }
            break;
          }

          case 'venue': {
            const venueRef = db.collection('venues').doc(afterData.targetId);
            batch.update(venueRef, {
              status: 'removed',
              removedAt: admin.firestore.FieldValue.serverTimestamp(),
              removalReason: afterData.reason
            });
            break;
          }
        }
      }

      // Notify reporter of outcome
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: afterData.reporterId,
        type: 'report_outcome',
        title: 'Report Review Complete',
        body: `Your report has been ${afterData.status}. ${afterData.status === 'resolved' ? 'Action has been taken.' : 'No violation was found.'}`,
        data: {
          reportId,
          targetType: afterData.targetType,
          targetId: afterData.targetId,
          outcome: afterData.status
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      functions.logger.info(`Handled report ${reportId} with outcome: ${afterData.status}`);
    } catch (error) {
      functions.logger.error(`Error handling report ${reportId}:`, error);
      throw error;
    }
  });