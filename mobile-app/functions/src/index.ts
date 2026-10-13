import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Recalculates and updates parent-level stats for a user
 * NEW: Aggregates data from unified conversations collection
 */
async function recalculateUserStats(userId: string): Promise<void> {
  try {
    // NEW: Query unified conversations collection
    const conversationsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .get();

    let totalConversations = 0;
    let totalConversationDurationSec = 0;
    let flaggedConversations = 0;
    let lastConversationAt: admin.firestore.Timestamp | null = null;
    let lastFlaggedAt: admin.firestore.Timestamp | null = null;

    // Process all conversations
    conversationsSnapshot.docs.forEach((convDoc) => {
      const data = convDoc.data();

      totalConversations++;

      // Add duration (prefer durationMinutes, fallback to duration)
      const durationMinutes = data.durationMinutes ?? data.duration;
      if (durationMinutes && typeof durationMinutes === "number") {
        totalConversationDurationSec += durationMinutes * 60;
      }

      // Count flagged conversations
      if (data.flagged === true) {
        flaggedConversations++;

        // Track most recent flagged conversation
        if (data.startTime) {
          if (!lastFlaggedAt || data.startTime.toMillis() > lastFlaggedAt.toMillis()) {
            lastFlaggedAt = data.startTime;
          }
        }
      }

      // Track most recent conversation
      if (data.startTime) {
        if (!lastConversationAt || data.startTime.toMillis() > lastConversationAt.toMillis()) {
          lastConversationAt = data.startTime;
        }
      }
    });

    // Update parent user document with aggregated stats
    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          stats: {
            totalConversations,
            totalConversationDurationSec,
            flaggedConversations,
            lastConversationAt,
            lastFlaggedAt,
          },
        },
        { merge: true }
      );

    functions.logger.info(
      `Stats updated for user ${userId}:`,
      {
        totalConversations,
        totalConversationDurationSec,
        flaggedConversations,
      }
    );
  } catch (error) {
    functions.logger.error(`Error recalculating stats for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Trigger: When a conversation is created
 * NEW Path: users/{userId}/conversations/{conversationId}
 */
export const onConversationCreated = functions.firestore
  .document("users/{userId}/conversations/{conversationId}")
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;

    functions.logger.info(
      `Conversation created for user ${userId}, recalculating stats`
    );

    await recalculateUserStats(userId);
  });

/**
 * Trigger: When a conversation is updated
 * (e.g., flagged status changes, duration updated)
 * NEW Path: users/{userId}/conversations/{conversationId}
 */
export const onConversationUpdated = functions.firestore
  .document("users/{userId}/conversations/{conversationId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    // Only recalculate if relevant fields changed
    const flaggedChanged = before.flagged !== after.flagged;
    const durationChanged = before.duration !== after.duration || before.durationMinutes !== after.durationMinutes;

    if (flaggedChanged || durationChanged) {
      functions.logger.info(
        `Conversation updated for user ${userId}, recalculating stats`
      );

      await recalculateUserStats(userId);
    }
  });

/**
 * Trigger: When a conversation is deleted
 * NEW Path: users/{userId}/conversations/{conversationId}
 */
export const onConversationDeleted = functions.firestore
  .document("users/{userId}/conversations/{conversationId}")
  .onDelete(async (_snapshot, context) => {
    const userId = context.params.userId;

    functions.logger.info(
      `Conversation deleted for user ${userId}, recalculating stats`
    );

    await recalculateUserStats(userId);
  });

/**
 * Manual trigger function to recalculate stats for a specific user
 * Useful for fixing stats or initial setup
 *
 * Usage: Call this function with { userId: "xxx" }
 */
export const manualRecalculateStats = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = data.userId || context.auth.uid;

    // Only allow users to recalculate their own stats (or admins)
    if (userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Users can only recalculate their own stats"
      );
    }

    await recalculateUserStats(userId);

    return { success: true, message: "Stats recalculated successfully" };
  }
);
