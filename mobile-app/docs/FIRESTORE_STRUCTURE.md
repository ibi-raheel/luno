# Firestore Database Structure

This document outlines the complete Firestore database structure for the Luno Toys Mobile app.

## 🚀 Latest Update: Compact Conversation Structure

**v2.0** - Conversations now use a compact, economical structure:
- ✅ Messages stored as an **array** in the conversation document (not a subcollection)
- ✅ Conversations at `users/{userId}/conversations/` (unified, not nested under children)
- ✅ **90% cost reduction** - 1 read instead of 1 + N message reads
- ✅ **Simpler deletion** - no subcollection cleanup needed
- ✅ **Better performance** - atomic updates, faster reads

**Migration Note:** If you have existing conversations with message subcollections, they will continue to work. New conversations will use the compact structure. To migrate, regenerate test data using the flask icon in the Timeline screen.

---

## Collection Structure

```
users/
  {userId}/  # Document ID is the Firebase Auth UID
    - uid: string (same as document ID, the Firebase Auth user ID)
    - email: string (required, used for authentication and ESP32 device identification)
    - displayName: string
    - createdAt: timestamp
    - onboardingCompleted: boolean (default: false, set to true after first onboarding)

    // App preferences
    - preferences: object
      - notifications: boolean
      - theme: string

    // Aggregate stats across ALL children (calculated by Cloud Functions)
    - stats: object
      - totalConversations: number
      - totalConversationDurationSec: number (duration in seconds, converted from minutes)
      - flaggedConversations: number
      - lastConversationAt: timestamp | null
      - lastFlaggedAt: timestamp | null

    children/
      {childId}/
        - name: string
        - birthDate: string (MM/DD/YYYY format)
        - avatar: string (emoji)
        - ageLevel: string (preschool | elementary | upper)
        - dailyLimitHours: number
        - createdAt: timestamp

        // Parental Control Settings
        - contentFilterEnabled: boolean
        - quietHoursEnabled: boolean
        - dailyLimitEnabled: boolean
        - creativeModeEnabled: boolean
        - recordConversations: boolean
        - blockedTopics: object
          - violence: boolean
          - matureContent: boolean
          - politics: boolean
          - religion: boolean
          - personalInfo: boolean
        - alertTypes: object
          - personalInfo: boolean
          - inappropriateContent: boolean
          - emotionalDistress: boolean
          - unusualPatterns: boolean
        - alertSensitivity: string (Low | Medium | High)

    conversations/
      {conversationId}/
        // Core metadata
        - startTime: timestamp
        - endTime: timestamp | null
        - duration: number (in minutes, legacy field for compatibility)
        - durationMinutes: number (in minutes, new unified field)
        - type: string (conversation | story | game | learning)
        - title: string
        - messageCount: number
        - createdAt: timestamp
        - lastActivityAt: timestamp
        - status: string (active | ended)

        // References
        - childId: string (required, links to children/{childId})
        - childName: string | null (denormalized for quick display)
        - toyId: string | null (links to toys/{toyId})
        - toyName: string | null (denormalized for quick display)

        // Content
        - firstMessagePreview: string | null  // first message content for previews
        - titleGeneratedAt: timestamp | null  // when title was auto-generated

        // Safety / flag metadata
        - flagged: boolean                  // true if this conversation requires review
        - flagReason: string | null         // human-readable reason / explanation
        - flagType: string | null           // 'personal_info' | 'unusual_behavior' | 'mature_topic' | 'inappropriate' | 'distress'
        - severity: string | null           // 'low' | 'medium' | 'high' | 'critical'
        - flagStatus: string | null         // 'unreviewed' | 'reviewed' (for Safety Center filters)

        // COMPACT STRUCTURE: Messages stored as array (not subcollection)
        - messages: array [
            {
              sender: string (child | toy)
              content: string
              timestamp: timestamp
              flagged: boolean
              flagReason: string | null
            },
            ...
          ]

    toys/
      {toyId}/  # Document ID is the deviceId from the BLE device
        - deviceId: string (same as document ID, the connected device hardware ID)
        - name: string
        - emoji: string (default: '🦄')
        - assignedChildId: string | null
        - pairedAt: timestamp
        - status: string (online | offline | charging)
        - batteryLevel: number (0–100)
        - lastConnected: timestamp

        // Device Information
        - model: string (e.g., "Luno Gen 2 Unicorn")
        - serialNumber: string (same as deviceId)
        - firmwareVersion: string (e.g., "v2.1.4")

        // Device Settings
        - volume: number (0–100, default: 70)
        - ledBrightness: string (Low | Medium | High, default: "Medium")
        - soundEffects: boolean (default: true)
        - voiceType: string (default: "Female, Child-friendly")
        - autoUpdate: boolean (default: true)

        // Connection
        - connectionType: string (Wi-Fi | Bluetooth, default: "Wi-Fi")
        - wifiNetwork: string (WiFi SSID name)
        - wifiSSID: string (duplicate of wifiNetwork)
        - wifiConnected: boolean
```

## Data Types Reference

### Timestamp

Firestore `serverTimestamp()` or JavaScript `Date` object converted to Firestore `Timestamp`.

### Duration

Stored as **minutes** (number) in conversation documents for consistency across the app.
Cloud Functions convert this to **seconds** when aggregating stats to the user document.

### Message Count

Total number of messages in a conversation (number). This is stored as `messageCount` in the conversation document and matches the length of the `messages` array.

### Device ID

The toy's unique hardware identifier from the BLE device. Used as both:
- The Firestore document ID in the `toys` collection
- The value of the `deviceId` and `serialNumber` fields

### Flag Metadata

Stored on the conversation document so the Safety Center can query and filter quickly:

- `flagged`: boolean - indicates if conversation needs review
- `flagReason`: explanation for the flag
- `flagType`: category of flag - 'personal_info' | 'unusual_behavior' | 'mature_topic' | 'inappropriate' | 'distress'
- `severity`: risk level - 'low' | 'medium' | 'high' | 'critical'
- `flagStatus`: whether the flag has been reviewed - 'unreviewed' | 'reviewed'
- `messagePreview`: short snippet from the conversation that explains the flag context

## Cloud Functions

The app uses Firebase Cloud Functions to automatically maintain aggregate statistics:

### onConversationCreated
Triggered when: A new conversation is created
Updates: Parent user's stats (totalConversations, totalConversationDurationSec, flaggedConversations)

### onConversationUpdated
Triggered when: A conversation's `flagged` or `duration` field changes
Updates: Parent user's stats

### onConversationDeleted
Triggered when: A conversation is deleted
Updates: Parent user's stats

### manualRecalculateStats
Callable function for manually recalculating user stats
Used by: "Sync Stats" button on Dashboard

## Usage Examples

### Creating a User Document

TypeScript example:

```typescript
const userRef = doc(db, "users", user.uid);

await setDoc(userRef, {
  uid: user.uid,
  email: user.email,
  displayName: "Parent Name",
  createdAt: serverTimestamp(),
  preferences: {
    notifications: true,
    theme: "light",
  },
  stats: {
    totalConversations: 0,
    totalConversationDurationSec: 0,
    flaggedConversations: 0,
    lastConversationAt: null,
    lastFlaggedAt: null,
  },
  onboardingCompleted: false,
});
```

### Creating a Child Profile

```typescript
const childrenRef = collection(db, "users", userId, "children");

await addDoc(childrenRef, {
  name: "Emma Johnson",
  birthDate: "05/15/2018", // MM/DD/YYYY
  avatar: "👧",
  ageLevel: "elementary",
  dailyLimitHours: 2,
  createdAt: serverTimestamp(),

  // Parental Control defaults
  contentFilterEnabled: true,
  quietHoursEnabled: false,
  dailyLimitEnabled: true,
  creativeModeEnabled: true,
  recordConversations: true,
  blockedTopics: {
    violence: true,
    matureContent: true,
    politics: false,
    religion: false,
    personalInfo: true,
  },
  alertTypes: {
    personalInfo: true,
    inappropriateContent: true,
    emotionalDistress: true,
    unusualPatterns: true,
  },
  alertSensitivity: "Medium",
});
```

### Creating a Toy

```typescript
const toyDocRef = doc(db, "users", userId, "toys", deviceId);

await setDoc(toyDocRef, {
  deviceId: deviceId,
  name: "Luna the Unicorn",
  emoji: "🦄",
  assignedChildId: childId,
  pairedAt: serverTimestamp(),
  status: "online",
  batteryLevel: 100,
  lastConnected: serverTimestamp(),

  model: "Luno Gen 2 Unicorn",
  serialNumber: deviceId,
  firmwareVersion: "v2.1.4",

  volume: 70,
  ledBrightness: "Medium",
  soundEffects: true,
  voiceType: "Female, Child-friendly",
  autoUpdate: true,

  connectionType: "Wi-Fi",
  wifiNetwork: "Home WiFi",
  wifiSSID: "Home WiFi",
  wifiConnected: true,
});
```

### Creating a Conversation (NEW Compact Structure)

```typescript
const conversationRef = collection(db, "users", userId, "conversations");

await addDoc(conversationRef, {
  // Core metadata
  startTime: serverTimestamp(),
  endTime: null,
  duration: 0, // legacy field for compatibility
  durationMinutes: 0,
  type: "conversation",
  title: "Math Adventure",
  messageCount: 0,
  createdAt: serverTimestamp(),
  lastActivityAt: serverTimestamp(),
  status: "active",

  // References (required)
  childId,
  childName: "Emma",
  toyId: "toy-123",
  toyName: "Luna",

  // Content
  firstMessagePreview: null,
  titleGeneratedAt: null,

  // Safety fields
  flagged: false,
  flagReason: null,
  flagType: null,
  severity: null,
  flagStatus: null,

  // Messages array (NEW!)
  messages: [],
});
```

### Updating Conversation on End

```typescript
await updateDoc(conversationDoc, {
  endTime: serverTimestamp(),
  duration: 45, // minutes (legacy)
  durationMinutes: 45,
  status: "ended",
  lastActivityAt: serverTimestamp(),
  messageCount: 23,
});
```

### Adding a Message (NEW: Array-based)

```typescript
import { arrayUnion } from "firebase/firestore";

const conversationRef = doc(db, "users", userId, "conversations", conversationId);

// Add message to the messages array
await updateDoc(conversationRef, {
  messages: arrayUnion({
    sender: "child",
    content: "Hello!",
    timestamp: serverTimestamp(),
    flagged: false,
    flagReason: null,
  }),
  messageCount: increment(1),
  lastActivityAt: serverTimestamp(),
});
```

### Adding Multiple Messages at Once

```typescript
// For batch operations, read the conversation, update the array, and write back
const conversationSnap = await getDoc(conversationRef);
const existingMessages = conversationSnap.data()?.messages || [];

const newMessages = [
  {
    sender: "child",
    content: "Hello!",
    timestamp: Timestamp.now(),
    flagged: false,
    flagReason: null,
  },
  {
    sender: "toy",
    content: "Hi there!",
    timestamp: Timestamp.now(),
    flagged: false,
    flagReason: null,
  },
];

await updateDoc(conversationRef, {
  messages: [...existingMessages, ...newMessages],
  messageCount: existingMessages.length + newMessages.length,
  lastActivityAt: serverTimestamp(),
});
```

### Marking a Flag as Reviewed

```typescript
const conversationRef = doc(db, "users", userId, "conversations", conversationId);

await updateDoc(conversationRef, {
  flagStatus: "reviewed",
});
```

### Deleting a Conversation (Simplified!)

```typescript
// With the new structure, just delete the document - no subcollection cleanup needed!
const conversationRef = doc(db, "users", userId, "conversations", conversationId);

await deleteDoc(conversationRef);
// Done! Messages are deleted automatically since they're in the document.
```

## Required Firestore Indexes

For optimal query performance, the following composite indexes are required:

### conversations collection
- Fields: `flagged` (Ascending) + `startTime` (Descending)
  - Used by: Safety/Flags screen to query flagged conversations

These can be created automatically when you run queries that need them, or manually in the Firebase Console.

## ESP32 Device Integration

### WiFi Pairing Process

When pairing a new toy via BLE, the mobile app sends WiFi credentials to the ESP32 device in this format:

```
{ssid}|{password}|{userEmail}
```

**Example:** `HomeWiFi|mypassword123|parent@example.com`

The ESP32 device should:
1. Parse the string by splitting on the `|` delimiter
2. Extract the SSID, password, and user email
3. Connect to the WiFi network using the SSID and password
4. Store the user email for authentication with backend services

### Backend Communication

After WiFi connection, the ESP32 should include the user's email in all HTTP requests to the backend:

```http
POST /api/conversations
X-User-Email: parent@example.com
Content-Type: application/json

{
  "childId": "abc123",
  "message": "Hello!"
}
```

This allows the backend to:
- Authenticate requests from ESP32 devices
- Associate conversations with the correct user account
- Enforce per-user rate limits and quotas

### BLE Service UUIDs

The app uses the following BLE characteristics for ESP32 communication:

- **Service UUID:** `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- **WiFi Credentials:** `6e400002-b5a3-f393-e0a9-e50e24dcca9e` (write: `ssid|password|email`)
- **Status Updates:** `6e400003-b5a3-f393-e0a9-e50e24dcca9e` (notify)
- **Device ID:** `6e400004-b5a3-f393-e0a9-e50e24dcca9e` (read)
- **WiFi Scan:** `6e400005-b5a3-f393-e0a9-e50e24dcca9e` (write: "scan", notify: JSON array)

## Notes

- All timestamps use Firestore's `serverTimestamp()` for consistency across devices
- Duration is stored in **minutes** in conversation documents for UI simplicity
- Cloud Functions convert duration to **seconds** when aggregating to user stats
- Child profiles include comprehensive parental control settings
- **NEW: Conversations are stored at `users/{userId}/conversations/` (unified collection, not nested under children)**
- **NEW: Messages are stored as an array in the conversation document (not a subcollection)**
  - This provides **90% cost reduction** (1 read instead of 1 + N message reads)
  - Simpler deletion (no subcollection cleanup needed)
  - Atomic updates for entire conversations
  - Better performance for small-to-medium conversations (< 100 messages)
- Safety metadata is stored on the conversation document to power the Safety Center efficiently
- Denormalized fields (`childId`, `childName`, `toyId`, `toyName`, `firstMessagePreview`) reduce the need for extra reads
- Toy documents use the device's hardware ID as the document ID for uniqueness
- Stats in the user document are automatically maintained by Cloud Functions
- **User email is required** and sent to ESP32 devices during pairing for backend authentication
- ESP32 devices should include the user email in HTTP headers for all backend API requests
