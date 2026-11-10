import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// List of banned words/patterns (in production, use a proper content moderation service)
const BANNED_PATTERNS = [
  // Add your banned words here
];

interface ModerationResult {
  isClean: boolean;
  flaggedContent?: string[];
  severity: 'low' | 'medium' | 'high';
}

async function moderateText(text: string): Promise<ModerationResult> {
  const lowerText = text.toLowerCase();
  const flagged: string[] = [];

  for (const pattern of BANNED_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      flagged.push(pattern);
    }
  }

  // In production, integrate with:
  // - Google Cloud Natural Language API
  // - Perspective API
  // - AWS Comprehend
  // - Custom ML model

  return {
    isClean: flagged.length === 0,
    flaggedContent: flagged.length > 0 ? flagged : undefined,
    severity: flagged.length > 0 ? 'high' : 'low'
  };
}

export const moderateContent = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const eventData = snap.data();
    const eventId = context.params.eventId;

    try {
      // Moderate title and description
      const titleResult = await moderateText(eventData.title);
      const descriptionResult = await moderateText(eventData.description);

      const allFlagged = [
        ...(titleResult.flaggedContent || []),
        ...(descriptionResult.flaggedContent || [])
      ];

      if (allFlagged.length > 0) {
        // Create a report for moderation review
        await db.collection('reports').add({
          targetType: 'event',
          targetId: eventId,
          reporterId: 'system',
          reason: `Automated content moderation flagged: ${allFlagged.join(', ')}`,
          severity: 'high',
          status: 'pending',
          flaggedContent: allFlagged,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Optionally hide the event until reviewed
        await snap.ref.update({
          visibility: 'private',
          moderationFlagged: true,
          moderationReason: `Flagged for: ${allFlagged.join(', ')}`
        });

        functions.logger.warn(`Event ${eventId} flagged by content moderation: ${allFlagged.join(', ')}`);
      }
    } catch (error) {
      functions.logger.error(`Error moderating event ${eventId}:`, error);
    }
  });

// Also moderate comments
export const moderateComment = functions.firestore
  .document('events/{eventId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const commentData = snap.data();
    const { eventId, commentId } = context.params;

    try {
      const result = await moderateText(commentData.content);

      if (!result.isClean && result.flaggedContent) {
        await db.collection('reports').add({
          targetType: 'comment',
          targetId: commentId,
          reporterId: 'system',
          reason: `Automated content moderation flagged: ${result.flaggedContent.join(', ')}`,
          severity: 'high',
          status: 'pending',
          flaggedContent: result.flaggedContent,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await snap.ref.update({
          hidden: true,
          moderationFlagged: true,
          moderationReason: `Flagged for: ${result.flaggedContent.join(', ')}`
        });

        functions.logger.warn(`Comment ${commentId} on event ${eventId} flagged: ${result.flaggedContent.join(', ')}`);
      }
    } catch (error) {
      functions.logger.error(`Error moderating comment ${commentId}:`, error);
    }
  });