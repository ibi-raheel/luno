// src/utils/populateFakeData.ts
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Populate Firestore with fake conversation data for testing
 *
 * NEW Structure (compact):
 *   users/{userId}/conversations/{conversationId}
 *     - messages: [array of message objects]
 */
export async function populateFakeConversations(
  userId: string,
  childId: string
) {
  console.log("[FakeData] Starting to populate fake conversations...");

  const conversationTypes = ["conversation", "story", "game", "learning"];
  const conversationTitles = [
    "Math Adventure",
    "The Magic Forest",
    "Color Detective",
    "Space Exploration",
    "Animal Friends",
    "Counting Fun",
    "Bedtime Story",
    "Mystery Solver",
    "Creative Drawing",
    "Science Lab",
    "Music Time",
    "Word Games",
    "Treasure Hunt",
    "Dinosaur Discovery",
    "Ocean Adventure",
  ];

  const messageSamples = [
    "Hello! How are you today?",
    "Tell me a story!",
    "What color is the sky?",
    "Can we play a game?",
    "I love learning new things!",
    "That was fun!",
    "Let's count together!",
    "What happens next?",
    "I have a question...",
    "This is so cool!",
  ];

  // For flagged conversations
  const flagTypes = [
    "personal_info",
    "unusual_behavior",
    "mature_topic",
  ] as const;
  const severities = ["low", "medium", "critical"] as const;

  // --- NEW: stats accumulators for users/{uid}.stats ---
  let totalConversations = 0;
  let totalDurationSec = 0;
  let flaggedConversations = 0;
  let lastConversationDate: Date | null = null;
  let lastFlaggedDate: Date | null = null;

  try {
    const today = new Date();
    const createdConversations: { id: string; title: string; date: Date }[] =
      [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      // 2–4 conversations per day
      const conversationsPerDay = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < conversationsPerDay; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);

        // Random time during the day (8am–8pm)
        const hour = Math.floor(Math.random() * 12) + 8;
        const minute = Math.floor(Math.random() * 60);
        date.setHours(hour, minute, 0, 0);

        const duration = Math.floor(Math.random() * 50) + 10; // 10–60 minutes
        const messageCount = Math.floor(Math.random() * 30) + 5; // 5–35 messages
        const type =
          conversationTypes[
            Math.floor(Math.random() * conversationTypes.length)
          ];
        const title =
          conversationTitles[
            Math.floor(Math.random() * conversationTitles.length)
          ];

        // Increase flagged rate a bit for testing safety center:
        const isFlaggedConversation = Math.random() < 0.3; // 30% chance

        // Flag metadata (only meaningful if flagged)
        const flagType = isFlaggedConversation
          ? flagTypes[Math.floor(Math.random() * flagTypes.length)]
          : null;
        const severity = isFlaggedConversation
          ? severities[Math.floor(Math.random() * severities.length)]
          : null;
        const flagReason = isFlaggedConversation
          ? "Synthetic test flag for demo."
          : null;

        // Create end time
        const endTime = new Date(date);
        endTime.setMinutes(endTime.getMinutes() + duration);

        // Create messages array
        const messagesToCreate = Math.min(messageCount, 8); // up to 8 sample messages
        const messagesArray = [];

        for (let j = 0; j < messagesToCreate; j++) {
          const messageTime = new Date(date);
          messageTime.setMinutes(messageTime.getMinutes() + j * 2);

          // Flag one specific message if the conversation is flagged
          const isFlaggedMessage = isFlaggedConversation && j === 2;

          messagesArray.push({
            sender: j % 2 === 0 ? "child" : "toy",
            content:
              messageSamples[Math.floor(Math.random() * messageSamples.length)],
            timestamp: Timestamp.fromDate(messageTime),
            flagged: isFlaggedMessage,
            flagReason: isFlaggedMessage
              ? "Contains personal info (test)."
              : null,
          });
        }

        // First message preview
        const firstMessagePreview = messagesArray[0]?.content || messageSamples[0];

        // NEW: Conversations collection with messages array stored in the document
        const conversationsRef = collection(
          db,
          "users",
          userId,
          "conversations"
        );

        const conversationDocRef = await addDoc(conversationsRef, {
          // Core relationships
          childId,
          toyId: "demo-toy-001",

          // Status & Type
          status: "ended",
          type,

          // Timing (NEW unified schema)
          startTime: Timestamp.fromDate(date),
          lastActivityAt: Timestamp.fromDate(endTime),
          endTime: Timestamp.fromDate(endTime),
          durationMinutes: duration,

          // Content
          title,
          titleGeneratedAt: Timestamp.fromDate(endTime),
          messageCount: messagesToCreate,
          firstMessagePreview,

          // Safety/Flags
          flagged: isFlaggedConversation,
          flagReason,
          flagType, // 'personal_info' | 'unusual_behavior' | 'mature_topic' | null
          severity, // 'low' | 'medium' | 'critical' | null
          flagStatus: isFlaggedConversation ? "unreviewed" : null,

          // Legacy fields for backwards compatibility
          createdAt: Timestamp.fromDate(date),
          duration, // keep old field for compatibility

          // NEW: Messages stored as array in the document
          messages: messagesArray,
        });

        createdConversations.push({
          id: conversationDocRef.id,
          title,
          date,
        });

        // --- NEW: update running stats ---
        totalConversations += 1;
        totalDurationSec += duration * 60; // duration is stored in minutes
        if (isFlaggedConversation) {
          flaggedConversations += 1;
          if (!lastFlaggedDate || date > lastFlaggedDate) {
            lastFlaggedDate = date;
          }
        }
        if (!lastConversationDate || date > lastConversationDate) {
          lastConversationDate = date;
        }

        console.log(
          `[FakeData] Created conversation: ${title} on ${date.toLocaleDateString()}`
        );
      }
    }

    // --- NEW: write stats back to users/{userId}.stats ---
    try {
      const userRef = doc(db, "users", userId);

      await updateDoc(userRef, {
        "stats.totalConversations": totalConversations,
        "stats.totalConversationDurationSec": totalDurationSec,
        "stats.flaggedConversations": flaggedConversations,
        "stats.lastConversationAt": lastConversationDate
          ? Timestamp.fromDate(lastConversationDate)
          : null,
        "stats.lastFlaggedAt": lastFlaggedDate
          ? Timestamp.fromDate(lastFlaggedDate)
          : null,
      });

      console.log(
        `[FakeData] Updated user stats: total=${totalConversations}, durationSec=${totalDurationSec}, flagged=${flaggedConversations}`
      );
    } catch (err) {
      console.error("[FakeData] Failed to update user stats:", err);
    }

    console.log(
      `[FakeData] Successfully created ${createdConversations.length} conversations with messages!`
    );
    return createdConversations;
  } catch (error) {
    console.error("[FakeData] Error populating fake data:", error);
    throw error;
  }
}

/**
 * Clear all conversations for a child (use with caution!)
 * (Still left unimplemented for safety.)
 */
export async function clearConversations(_userId: string, _childId: string) {
  console.log(
    "[FakeData] Clearing conversations is not implemented for safety. Delete from Firebase Console if needed."
  );
}
