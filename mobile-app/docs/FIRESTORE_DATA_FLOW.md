# Luno Toys - Complete Firestore Data Flow & Architecture

**Last Updated:** December 15, 2025
**Purpose:** Comprehensive documentation of Firestore database structure, data sources, and lifecycle stages

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Component Responsibilities](#component-responsibilities)
3. [Firestore Collection Structure](#firestore-collection-structure)
4. [Data Sources by Component](#data-sources-by-component)
5. [Data Flow Stages](#data-flow-stages)
6. [Field-by-Field Source Mapping](#field-by-field-source-mapping)
7. [Cloud Functions Logic](#cloud-functions-logic)
8. [Critical Data Transformations](#critical-data-transformations)
9. [Missing Components Analysis](#missing-components-analysis)
10. [Recommendations & Next Steps](#recommendations--next-steps)

---

## 1. System Architecture Overview

The Luno Toys system consists of four primary components:

```
┌─────────────────┐
│   ESP32 Device  │ (Smart Toy)
│   (Hardware)    │
└────────┬────────┘
         │
         │ WiFi (HTTP/HTTPS)
         ▼
┌─────────────────┐
│  Backend API    │ (Not in this repo)
│  (Node/Python?) │
└────────┬────────┘
         │
         │ Admin SDK
         ▼
┌─────────────────┐       ┌──────────────────┐
│    Firestore    │◄──────┤  Cloud Functions │
│    Database     │       │  (Auto Triggers) │
└────────┬────────┘       └──────────────────┘
         │
         │ Firebase SDK
         ▼
┌─────────────────┐
│   Mobile App    │
│ (React Native)  │
└─────────────────┘
```

### Communication Flows

1. **ESP32 ↔ Mobile App**: Bluetooth Low Energy (BLE) - used only for pairing & WiFi setup
2. **ESP32 → Backend API**: HTTP/HTTPS over WiFi - conversation data, audio streaming
3. **Backend API → Firestore**: Firebase Admin SDK - creates conversations & messages
4. **Cloud Functions → Firestore**: Triggered writes - stats aggregation
5. **Mobile App ↔ Firestore**: Firebase SDK - user management, settings, reads

---

## 2. Component Responsibilities

### 📱 **Mobile App** (React Native + Expo)
**Location:** `src/` directory
**Primary Role:** User interface and user-initiated data management

**Responsibilities:**
- User authentication (Firebase Auth)
- User profile creation
- Child profile management (CRUD)
- Toy pairing via BLE
- WiFi credential transfer to ESP32
- Parental controls configuration
- Settings management
- Safety review actions (flag dismissal)
- Real-time data display (stats, conversations, timeline)

**Does NOT:**
- Create conversation data
- Create message data
- Process audio
- Perform AI content analysis

---

### 🎮 **ESP32 Device** (Hardware - Smart Toy)
**Location:** External hardware (not in this repo)
**Primary Role:** Child interaction and data collection

**Responsibilities:**
- Audio recording (child's voice)
- Audio playback (AI responses)
- BLE advertising for pairing
- Receiving WiFi credentials via BLE
- Connecting to WiFi
- Sending conversation data to backend API
- Battery management
- LED/sound effects

**Authentication:**
- Uses user email (received during pairing) in API requests
- Sends email in HTTP headers: `X-User-Email: parent@example.com`

**Does NOT:**
- Write directly to Firestore
- Process AI responses
- Perform content filtering

---

### ☁️ **Backend API** (Not in this repository)
**Location:** Unknown (separate service)
**Primary Role:** Conversation processing and AI integration

**Inferred Responsibilities:**
- Receive audio/conversation data from ESP32
- Process audio (speech-to-text)
- Integrate with AI (OpenAI/Claude for responses)
- Content analysis and safety flagging
- Create conversation documents in Firestore
- Create message documents in Firestore
- Text-to-speech for toy responses
- Send audio back to ESP32

**Authentication Flow:**
```
ESP32 → HTTP Request with X-User-Email header
      → Backend validates email
      → Backend writes to users/{userId}/children/{childId}/conversations/
```

**Does NOT:**
- Handle user authentication (that's Firebase Auth)
- Manage parental controls (that's mobile app)
- Calculate aggregate stats (that's Cloud Functions)

---

### ⚡ **Cloud Functions** (Firebase Cloud Functions)
**Location:** `functions/src/index.ts`
**Primary Role:** Automatic data aggregation and consistency

**Responsibilities:**
- Auto-calculate user stats on conversation create
- Auto-recalculate stats on conversation update
- Auto-recalculate stats on conversation delete
- Provide callable function for manual stats refresh
- Ensure data consistency across user document

**Triggers:**
1. `onCreate`: `users/{userId}/children/{childId}/conversations/{conversationId}`
2. `onUpdate`: `users/{userId}/children/{childId}/conversations/{conversationId}`
3. `onDelete`: `users/{userId}/children/{childId}/conversations/{conversationId}`
4. `onCall`: `recalculateStats` (manual trigger)

**Does NOT:**
- Create conversations
- Modify conversation content
- Handle user input

---

## 3. Firestore Collection Structure

### Complete Schema

```
firestore/
├── users/
│   └── {userId} (Document)
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── createdAt: timestamp
│       ├── onboardingCompleted: boolean
│       ├── preferences: object
│       │   ├── notifications: boolean
│       │   └── theme: string
│       ├── stats: object (CALCULATED BY CLOUD FUNCTIONS)
│       │   ├── totalConversations: number
│       │   ├── totalConversationDurationSec: number
│       │   ├── flaggedConversations: number
│       │   ├── lastConversationAt: timestamp | null
│       │   └── lastFlaggedAt: timestamp | null
│       │
│       ├── children/ (Subcollection)
│       │   └── {childId} (Document)
│       │       ├── name: string
│       │       ├── birthDate: string (MM/DD/YYYY)
│       │       ├── avatar: string (emoji)
│       │       ├── ageLevel: string
│       │       ├── dailyLimitHours: number
│       │       ├── createdAt: timestamp
│       │       ├── contentFilterEnabled: boolean
│       │       ├── quietHoursEnabled: boolean
│       │       ├── dailyLimitEnabled: boolean
│       │       ├── creativeModeEnabled: boolean
│       │       ├── recordConversations: boolean
│       │       ├── blockedTopics: object
│       │       │   ├── violence: boolean
│       │       │   ├── matureContent: boolean
│       │       │   ├── politics: boolean
│       │       │   ├── religion: boolean
│       │       │   └── personalInfo: boolean
│       │       ├── alertTypes: object
│       │       │   ├── personalInfo: boolean
│       │       │   ├── inappropriateContent: boolean
│       │       │   ├── emotionalDistress: boolean
│       │       │   └── unusualPatterns: boolean
│       │       ├── alertSensitivity: string
│       │       │
│       │       └── conversations/ (Subcollection)
│       │           └── {conversationId} (Document)
│       │               ├── startTime: timestamp
│       │               ├── endTime: timestamp | null
│       │               ├── duration: number (minutes)
│       │               ├── type: string
│       │               ├── title: string
│       │               ├── messageCount: number
│       │               ├── createdAt: timestamp
│       │               ├── childId: string
│       │               ├── childName: string | null
│       │               ├── toyName: string | null
│       │               ├── flagged: boolean
│       │               ├── flagReason: string | null
│       │               ├── flagType: string | null
│       │               ├── severity: string | null
│       │               ├── flagStatus: string
│       │               ├── messagePreview: string | null
│       │               │
│       │               └── messages/ (Subcollection)
│       │                   └── {messageId} (Document)
│       │                       ├── sender: string ('child' | 'toy')
│       │                       ├── content: string
│       │                       ├── timestamp: timestamp
│       │                       ├── flagged: boolean
│       │                       └── flagReason: string | null
│       │
│       └── toys/ (Subcollection)
│           └── {deviceId} (Document)
│               ├── deviceId: string
│               ├── name: string
│               ├── emoji: string
│               ├── assignedChildId: string | null
│               ├── pairedAt: timestamp
│               ├── status: string ('online' | 'offline')
│               ├── batteryLevel: number
│               ├── lastConnected: timestamp
│               ├── model: string
│               ├── serialNumber: string
│               ├── firmwareVersion: string
│               ├── volume: number
│               ├── ledBrightness: string
│               ├── soundEffects: boolean
│               ├── voiceType: string
│               ├── autoUpdate: boolean
│               ├── connectionType: string
│               ├── wifiNetwork: string
│               ├── wifiSSID: string
│               └── wifiConnected: boolean
```

---

## 4. Data Sources by Component

### 📱 Mobile App Writes

| Collection/Path | Fields Written | Trigger | File Location |
|----------------|----------------|---------|---------------|
| `users/{userId}` | All base fields except `stats` | User signup | `src/contexts/AuthContext.tsx:61-116` |
| `users/{userId}` | `onboardingCompleted: true` | First child created | `src/screens/AddChildScreen.tsx:169-177` |
| `users/{userId}/children/{childId}` | All child fields | Add child | `src/screens/AddChildScreen.tsx:118-146` |
| `users/{userId}/children/{childId}` | Parental control fields | Settings change | `src/screens/ParentalControlsScreen.tsx:141-164` |
| `users/{userId}/children/{childId}` | `name`, `birthDate` | Edit child | `src/screens/ChildProfileScreen.tsx:143-147` |
| `users/{userId}/toys/{deviceId}` | All toy fields | Toy pairing | `src/screens/AddToyScreen.tsx:339-366` |
| `users/{userId}/toys/{deviceId}` | Device settings | Settings change | `src/screens/ToySettingsScreen.tsx:113-123` |
| `users/{userId}/toys/{deviceId}` | `assignedChildId` | Assign/unassign toy | `src/screens/ChildProfileScreen.tsx:155-184` |
| `conversations/{conversationId}` | `flagged`, `flagReason`, `flagStatus` | Parent review | `src/screens/FlagsScreen.tsx:220-223` |

### ☁️ Cloud Functions Writes

| Collection/Path | Fields Written | Trigger | Function Name |
|----------------|----------------|---------|---------------|
| `users/{userId}` | `stats` object | Conversation created | `onConversationCreated` (line 85) |
| `users/{userId}` | `stats` object | Conversation updated | `onConversationUpdated` (line 101) |
| `users/{userId}` | `stats` object | Conversation deleted | `onConversationDeleted` (line 124) |
| `users/{userId}` | `stats` object | Manual sync request | `recalculateStats` (line 142) |

### 🎮 Backend API Writes (Inferred)

| Collection/Path | Fields Written | Trigger | Evidence |
|----------------|----------------|---------|----------|
| `conversations/{conversationId}` | All conversation fields | ESP32 conversation data | No mobile app code creates conversations |
| `messages/{messageId}` | All message fields | ESP32 message data | No mobile app code creates messages |
| `conversations/{conversationId}` | `flagged`, `flagReason` fields | AI content analysis | Backend performs safety checks |

### 🔌 ESP32 Contributions

| Data Type | Destination | Method | Flow |
|-----------|-------------|--------|------|
| Device ID | Mobile App → Firestore | BLE characteristic read | `src/screens/AddToyScreen.tsx:339` |
| WiFi credentials | ESP32 storage | BLE characteristic write | App sends: `{ssid}\|{password}\|{email}` |
| User email | Backend API headers | HTTP request header | `X-User-Email: parent@example.com` |
| Audio data | Backend API | HTTP POST | Inferred from architecture |

---

## 5. Data Flow Stages

### Stage 1: Initial User Setup

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: INITIAL SETUP (All Mobile App Writes)             │
└─────────────────────────────────────────────────────────────┘

Step 1: User Signup
├─ User enters email/password
├─ Firebase Auth creates user
├─ AuthContext creates Firestore document
│  └─ Path: users/{userId}
│     ├─ uid: "firebase_auth_uid"
│     ├─ email: "parent@example.com"
│     ├─ displayName: "John Doe"
│     ├─ createdAt: [SERVER_TIMESTAMP]
│     ├─ preferences: { notifications: true, theme: "light" }
│     ├─ stats: {
│     │    totalConversations: 0,
│     │    totalConversationDurationSec: 0,
│     │    flaggedConversations: 0,
│     │    lastConversationAt: null,
│     │    lastFlaggedAt: null
│     │  }
│     └─ onboardingCompleted: false
│
├─ Source: src/contexts/AuthContext.tsx:61-116
└─ Write Method: setDoc(userRef, {...})

Step 2: Add First Child
├─ User fills child profile form
├─ AddChildScreen creates child document
│  └─ Path: users/{userId}/children/{childId}
│     ├─ name: "Emma" [USER INPUT]
│     ├─ birthDate: "05/15/2018" [USER INPUT]
│     ├─ avatar: "👧" [USER INPUT]
│     ├─ ageLevel: "elementary" [USER INPUT]
│     ├─ dailyLimitHours: 2 [USER INPUT]
│     ├─ createdAt: [SERVER_TIMESTAMP]
│     ├─ contentFilterEnabled: true [DEFAULT]
│     ├─ quietHoursEnabled: false [DEFAULT]
│     ├─ dailyLimitEnabled: true [DEFAULT]
│     ├─ creativeModeEnabled: true [DEFAULT]
│     ├─ recordConversations: true [DEFAULT]
│     ├─ blockedTopics: {
│     │    violence: true,
│     │    matureContent: true,
│     │    politics: false,
│     │    religion: false,
│     │    personalInfo: true
│     │  }
│     ├─ alertTypes: {
│     │    personalInfo: true,
│     │    inappropriateContent: true,
│     │    emotionalDistress: true,
│     │    unusualPatterns: true
│     │  }
│     └─ alertSensitivity: "Medium" [DEFAULT]
│
├─ Source: src/screens/AddChildScreen.tsx:118-146
└─ Write Method: addDoc(childrenRef, {...})

Step 3: Pair Smart Toy (BLE + WiFi Setup)
├─ User initiates BLE scan
├─ App discovers ESP32 device
├─ User connects to toy via BLE
│
├─ WiFi Setup Flow:
│  ├─ App scans available WiFi networks (via BLE characteristic)
│  ├─ User selects network and enters password
│  ├─ App sends via BLE: "{ssid}|{password}|{userEmail}"
│  ├─ ESP32 receives and parses credentials
│  ├─ ESP32 connects to WiFi network
│  ├─ ESP32 stores user email for backend authentication
│  └─ ESP32 confirms connection via BLE
│
├─ App creates toy document in Firestore
│  └─ Path: users/{userId}/toys/{deviceId}
│     ├─ deviceId: "ESP32_ABC123" [FROM BLE]
│     ├─ name: "Unicorn Sparkle" [USER INPUT]
│     ├─ emoji: "🦄" [DEFAULT]
│     ├─ assignedChildId: "child_id_emma" [USER INPUT]
│     ├─ pairedAt: [SERVER_TIMESTAMP]
│     ├─ status: "online" [DEFAULT]
│     ├─ batteryLevel: 100 [DEFAULT]
│     ├─ lastConnected: [SERVER_TIMESTAMP]
│     ├─ model: "Luno Gen 2 Unicorn" [DEFAULT]
│     ├─ serialNumber: "ESP32_ABC123" [FROM BLE]
│     ├─ firmwareVersion: "v2.1.4" [DEFAULT]
│     ├─ volume: 70 [DEFAULT]
│     ├─ ledBrightness: "Medium" [DEFAULT]
│     ├─ soundEffects: true [DEFAULT]
│     ├─ voiceType: "Female, Child-friendly" [DEFAULT]
│     ├─ autoUpdate: true [DEFAULT]
│     ├─ connectionType: "Wi-Fi" [DEFAULT]
│     ├─ wifiNetwork: "Home WiFi" [USER INPUT]
│     ├─ wifiSSID: "MyHomeNetwork" [USER INPUT]
│     └─ wifiConnected: true [DEFAULT]
│
├─ Source: src/screens/AddToyScreen.tsx:339-366
└─ Write Method: setDoc(toyRef, {...})

Step 4: Complete Onboarding
├─ User clicks "Done" after adding first child
├─ App updates user document
│  └─ Path: users/{userId}
│     └─ onboardingCompleted: true
│
├─ Source: src/screens/AddChildScreen.tsx:169-177
├─ Write Method: setDoc(userRef, { onboardingCompleted: true }, { merge: true })
└─ User redirected to Dashboard

RESULT: User fully onboarded with child profile and paired toy
```

---

### Stage 2: During Toy Usage (Real-time Conversation)

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: ACTIVE CONVERSATION (Backend + Cloud Functions)   │
└─────────────────────────────────────────────────────────────┘

Step 1: Child Starts Conversation
├─ Child presses button on ESP32 toy
├─ ESP32 starts recording audio
├─ Child speaks: "Tell me a story about dragons!"
└─ ESP32 stops recording

Step 2: ESP32 → Backend API
├─ ESP32 sends HTTP POST request
│  ├─ Endpoint: https://api.lunotoys.com/conversations (INFERRED)
│  ├─ Headers: { "X-User-Email": "parent@example.com" }
│  ├─ Body: { audio: base64_encoded_audio }
│  └─ Backend authenticates using email
│
├─ Backend processes request:
│  ├─ Speech-to-Text: Convert audio to text
│  ├─ Query: "Tell me a story about dragons!"
│  ├─ AI Processing: Send to OpenAI/Claude
│  ├─ Content Filter: Check for safety concerns
│  └─ Text-to-Speech: Convert AI response to audio
│
└─ Backend sends audio response back to ESP32

Step 3: Backend → Firestore (Create Conversation)
├─ Backend looks up userId from email
├─ Backend creates conversation document
│  └─ Path: users/{userId}/children/{childId}/conversations/{conversationId}
│     ├─ startTime: [TIMESTAMP]
│     ├─ endTime: null [Not finished yet]
│     ├─ duration: 0 [Will update when complete]
│     ├─ type: "story" [FROM AI CLASSIFICATION]
│     ├─ title: "Dragon Adventure" [FROM AI]
│     ├─ messageCount: 0 [Will increment]
│     ├─ createdAt: [TIMESTAMP]
│     ├─ childId: "child_id_emma"
│     ├─ childName: "Emma" [DENORMALIZED]
│     ├─ toyName: "Unicorn Sparkle" [DENORMALIZED]
│     ├─ flagged: false [DEFAULT, may change]
│     ├─ flagReason: null
│     ├─ flagType: null
│     ├─ severity: null
│     ├─ flagStatus: "none"
│     └─ messagePreview: null [Will update]
│
└─ Write Method: Backend uses Admin SDK setDoc()

Step 4: Cloud Functions Triggered (onCreate)
├─ Cloud Function detects new conversation
│  └─ Trigger: onCreate at conversations/{conversationId}
│
├─ Function: onConversationCreated (line 85-95)
│  ├─ Reads all children for userId
│  ├─ For each child, reads all conversations
│  ├─ Aggregates:
│  │  ├─ totalConversations = count of all conversations
│  │  ├─ totalConversationDurationSec = sum(duration * 60)
│  │  └─ flaggedConversations = count where flagged=true
│  │
│  └─ Updates users/{userId}
│     └─ stats: {
│          totalConversations: 1,  // Incremented
│          totalConversationDurationSec: 0,  // No duration yet
│          flaggedConversations: 0
│        }
│
└─ Write Method: set(userRef, { stats: {...} }, { merge: true })

Step 5: Backend Creates Messages (Conversation Continues)
├─ Backend creates message document (child's message)
│  └─ Path: conversations/{conversationId}/messages/{messageId1}
│     ├─ sender: "child"
│     ├─ content: "Tell me a story about dragons!"
│     ├─ timestamp: [TIMESTAMP]
│     ├─ flagged: false
│     └─ flagReason: null
│
├─ Backend creates message document (AI response)
│  └─ Path: conversations/{conversationId}/messages/{messageId2}
│     ├─ sender: "toy"
│     ├─ content: "Once upon a time, in a magical land..."
│     ├─ timestamp: [TIMESTAMP]
│     ├─ flagged: false
│     └─ flagReason: null
│
└─ ESP32 plays AI response audio to child

Step 6: Conversation Continues (Multiple Turns)
├─ Child asks follow-up questions
├─ ESP32 → Backend → Firestore loop repeats
└─ Messages accumulate in messages/ subcollection

Step 7: AI Detects Safety Concern (Example)
├─ Child says: "What's your home address?"
├─ Backend AI flags as personal info request
├─ Backend updates conversation document
│  └─ Path: conversations/{conversationId}
│     ├─ flagged: true [CHANGED]
│     ├─ flagReason: "Child attempted to share personal information"
│     ├─ flagType: "personalInfo"
│     ├─ severity: "Medium"
│     └─ flagStatus: "pending"
│
└─ Backend may also flag individual message

Step 8: Cloud Functions Triggered (onUpdate)
├─ Cloud Function detects conversation update
│  └─ Trigger: onUpdate at conversations/{conversationId}
│
├─ Function: onConversationUpdated (line 101-119)
│  ├─ Checks if flagged field changed: YES
│  ├─ Recalculates stats across all conversations
│  └─ Updates users/{userId}
│     └─ stats: {
│          totalConversations: 1,
│          totalConversationDurationSec: 0,
│          flaggedConversations: 1  // Incremented!
│        }
│
└─ Parent will see flag in Safety Center immediately

Step 9: Conversation Ends
├─ Child stops interacting with toy (timeout or button press)
├─ Backend updates conversation document
│  └─ Path: conversations/{conversationId}
│     ├─ endTime: [TIMESTAMP]
│     ├─ duration: 8 [minutes]
│     ├─ messageCount: 12
│     └─ messagePreview: "Tell me a story about dragons!"
│
├─ Cloud Functions triggered again (onUpdate)
│  └─ Recalculates stats with new duration
│     └─ stats: {
│          totalConversations: 1,
│          totalConversationDurationSec: 480,  // 8 min * 60
│          flaggedConversations: 1
│        }
│
└─ Backend closes connection with ESP32

Step 10: Mobile App Displays in Real-time
├─ Dashboard listens via onSnapshot()
├─ Stats update automatically: "1 conversation, 8 min, 1 flag"
├─ Timeline shows new conversation card
├─ Safety Center shows flagged conversation
└─ Parent receives notification (if enabled)

RESULT: Complete conversation stored with automatic stats updates
```

---

### Stage 3: Parent Review & Management

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: PARENT REVIEW (Mobile App + Cloud Functions)      │
└─────────────────────────────────────────────────────────────┘

Step 1: Parent Opens Safety Center
├─ Parent navigates to Safety Center tab
├─ App queries Firestore:
│  └─ Query: conversations where flagged=true, orderBy flagStatus
│
├─ Displays flagged conversations:
│  └─ "🚨 Personal Info Request - Medium Severity"
│      "Child attempted to share personal information"
│      "8 minutes ago - Emma & Unicorn Sparkle"
│
└─ Source: src/screens/FlagsScreen.tsx

Step 2: Parent Taps to View Details
├─ App navigates to ConversationScreen
├─ Loads conversation + all messages
├─ Parent reads full transcript
└─ Sees highlighted flag: "What's your home address?"

Step 3: Parent Dismisses Flag (Safe)
├─ Parent determines conversation was harmless
├─ Parent taps "Dismiss" button
│
├─ App updates conversation document
│  └─ Path: conversations/{conversationId}
│     ├─ flagged: false [CHANGED]
│     ├─ flagReason: null [CLEARED]
│     ├─ flagStatus: "reviewed" [CHANGED]
│     └─ flagType: null [CLEARED]
│
├─ Source: src/screens/FlagsScreen.tsx:220-223
└─ Write Method: updateDoc(conversationRef, {...})

Step 4: Cloud Functions Recalculate Stats
├─ Cloud Function detects conversation update
│  └─ Trigger: onUpdate at conversations/{conversationId}
│
├─ Function: onConversationUpdated (line 101-119)
│  ├─ Detects flagged changed from true → false
│  ├─ Recalculates stats across all conversations
│  └─ Updates users/{userId}
│     └─ stats: {
│          totalConversations: 1,
│          totalConversationDurationSec: 480,
│          flaggedConversations: 0  // Decremented!
│        }
│
└─ Dashboard updates automatically via onSnapshot()

Step 5: Parent Adjusts Parental Controls
├─ Parent decides to block "personal info" topic
├─ Navigates to Parental Controls screen
│
├─ App updates child document
│  └─ Path: users/{userId}/children/{childId}
│     └─ blockedTopics: {
│          violence: true,
│          matureContent: true,
│          politics: false,
│          religion: false,
│          personalInfo: true  // Already blocked, no change
│        }
│
├─ Source: src/screens/ParentalControlsScreen.tsx:141-164
└─ Write Method: updateDoc(childRef, {...})

Step 6: Parent Updates Toy Settings
├─ Parent lowers toy volume
├─ Navigates to Toy Settings screen
│
├─ App updates toy document
│  └─ Path: users/{userId}/toys/{deviceId}
│     └─ volume: 50  // Changed from 70
│
├─ Source: src/screens/ToySettingsScreen.tsx:113-123
└─ Write Method: updateDoc(toyRef, { volume: 50 })

RESULT: Parent has full control over settings and safety review
```

---

### Stage 4: Manual Stats Sync (Optional)

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: MANUAL SYNC (Cloud Functions - Callable)          │
└─────────────────────────────────────────────────────────────┘

Trigger: Parent clicks "Sync Stats" button on Dashboard

Step 1: App Calls Cloud Function
├─ Source: Dashboard screen (implied, not visible in current code)
├─ Function: recalculateStats (line 142-166)
│  └─ Callable function authenticated via Firebase Auth
│
├─ Security check:
│  ├─ Verifies user is authenticated
│  └─ Ensures user can only sync their own stats
│
└─ Write Method: functions.httpsCallable('recalculateStats')()

Step 2: Cloud Function Recalculates
├─ Reads all children for userId
├─ For each child, reads all conversations
├─ Aggregates from scratch:
│  ├─ totalConversations = count
│  ├─ totalConversationDurationSec = sum(duration * 60)
│  └─ flaggedConversations = count where flagged=true
│
└─ Updates users/{userId}.stats

Step 3: App Receives Response
├─ Cloud Function returns success
├─ Dashboard displays updated stats
└─ User sees toast: "Stats synchronized successfully"

RESULT: Stats manually refreshed (usually not needed due to auto-sync)
```

---

## 6. Field-by-Field Source Mapping

### Users Collection

| Field Path | Source | Created When | Modified When | File Location |
|-----------|--------|--------------|---------------|---------------|
| `uid` | Mobile App | User signup | Never | `AuthContext.tsx:76` |
| `email` | Mobile App | User signup | Never | `AuthContext.tsx:77` |
| `displayName` | Mobile App | User signup | Manual edit (not shown) | `AuthContext.tsx:78` |
| `createdAt` | Mobile App | User signup | Never | `AuthContext.tsx:79` |
| `onboardingCompleted` | Mobile App | Onboarding done | Never | `AddChildScreen.tsx:169` |
| `preferences.notifications` | Mobile App | User signup | Settings screen | `AuthContext.tsx:80` |
| `preferences.theme` | Mobile App | User signup | Settings screen | `AuthContext.tsx:81` |
| `stats.totalConversations` | Cloud Functions | First conversation | Every conversation change | `index.ts:42` |
| `stats.totalConversationDurationSec` | Cloud Functions | First conversation | Every conversation change | `index.ts:42` |
| `stats.flaggedConversations` | Cloud Functions | First flagged conv | Every flag status change | `index.ts:42` |
| `stats.lastConversationAt` | Cloud Functions | First conversation | Every new conversation | `index.ts:67-70` |
| `stats.lastFlaggedAt` | Cloud Functions | First flag | Every new flag | `index.ts:71-74` |

### Children Collection

| Field Path | Source | Created When | Modified When | File Location |
|-----------|--------|--------------|---------------|---------------|
| `name` | Mobile App (User Input) | Add child | Edit child profile | `AddChildScreen.tsx:118` |
| `birthDate` | Mobile App (User Input) | Add child | Edit child profile | `AddChildScreen.tsx:119` |
| `avatar` | Mobile App (User Input) | Add child | Never | `AddChildScreen.tsx:120` |
| `ageLevel` | Mobile App (User Input) | Add child | Parental controls edit | `AddChildScreen.tsx:121` |
| `dailyLimitHours` | Mobile App (User Input) | Add child | Parental controls edit | `AddChildScreen.tsx:122` |
| `createdAt` | Mobile App | Add child | Never | `AddChildScreen.tsx:123` |
| `contentFilterEnabled` | Mobile App (Default: true) | Add child | Parental controls toggle | `AddChildScreen.tsx:124` |
| `quietHoursEnabled` | Mobile App (Default: false) | Add child | Parental controls toggle | `AddChildScreen.tsx:125` |
| `dailyLimitEnabled` | Mobile App (Default: true) | Add child | Parental controls toggle | `AddChildScreen.tsx:126` |
| `creativeModeEnabled` | Mobile App (Default: true) | Add child | Parental controls toggle | `AddChildScreen.tsx:127` |
| `recordConversations` | Mobile App (Default: true) | Add child | Parental controls toggle | `AddChildScreen.tsx:128` |
| `blockedTopics.*` | Mobile App (Defaults set) | Add child | Parental controls toggle | `AddChildScreen.tsx:129-134` |
| `alertTypes.*` | Mobile App (Defaults set) | Add child | Parental controls toggle | `AddChildScreen.tsx:135-140` |
| `alertSensitivity` | Mobile App (Default: "Medium") | Add child | Parental controls select | `AddChildScreen.tsx:141` |

### Toys Collection

| Field Path | Source | Created When | Modified When | File Location |
|-----------|--------|--------------|---------------|---------------|
| `deviceId` | ESP32 via BLE | Toy pairing | Never | `AddToyScreen.tsx:339` |
| `name` | Mobile App (User Input) | Toy pairing | Toy settings edit | `AddToyScreen.tsx:340` |
| `emoji` | Mobile App (Default: "🦄") | Toy pairing | Never | `AddToyScreen.tsx:341` |
| `assignedChildId` | Mobile App (User Selection) | Toy pairing | Reassign toy | `AddToyScreen.tsx:342` |
| `pairedAt` | Mobile App | Toy pairing | Never | `AddToyScreen.tsx:343` |
| `status` | Mobile App (Default: "online") | Toy pairing | Backend updates (inferred) | `AddToyScreen.tsx:344` |
| `batteryLevel` | Mobile App (Default: 100) | Toy pairing | Backend updates (inferred) | `AddToyScreen.tsx:345` |
| `lastConnected` | Mobile App | Toy pairing | Backend updates (inferred) | `AddToyScreen.tsx:346` |
| `model` | Mobile App (Default) | Toy pairing | Never | `AddToyScreen.tsx:347` |
| `serialNumber` | ESP32 via BLE | Toy pairing | Never | `AddToyScreen.tsx:348` |
| `firmwareVersion` | Mobile App (Default) | Toy pairing | OTA update (inferred) | `AddToyScreen.tsx:349` |
| `volume` | Mobile App (Default: 70) | Toy pairing | Toy settings slider | `AddToyScreen.tsx:350` |
| `ledBrightness` | Mobile App (Default: "Medium") | Toy pairing | Toy settings select | `AddToyScreen.tsx:351` |
| `soundEffects` | Mobile App (Default: true) | Toy pairing | Toy settings toggle | `AddToyScreen.tsx:352` |
| `voiceType` | Mobile App (Default) | Toy pairing | Toy settings select | `AddToyScreen.tsx:353` |
| `autoUpdate` | Mobile App (Default: true) | Toy pairing | Toy settings toggle | `AddToyScreen.tsx:354` |
| `connectionType` | Mobile App (Default: "Wi-Fi") | Toy pairing | Never | `AddToyScreen.tsx:355` |
| `wifiNetwork` | Mobile App (User Input) | WiFi setup | WiFi reconfigure | `AddToyScreen.tsx:356` |
| `wifiSSID` | Mobile App (User Input) | WiFi setup | WiFi reconfigure | `AddToyScreen.tsx:357` |
| `wifiConnected` | Mobile App (Default: true) | WiFi setup | Backend updates (inferred) | `AddToyScreen.tsx:358` |

### Conversations Collection

| Field Path | Source | Created When | Modified When | File Location |
|-----------|--------|--------------|---------------|---------------|
| `startTime` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `endTime` | Backend API | Conversation end | Never | **Backend (not in repo)** |
| `duration` | Backend API | Conversation end | Never | **Backend (not in repo)** |
| `type` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `title` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `messageCount` | Backend API | Conversation end | Never | **Backend (not in repo)** |
| `createdAt` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `childId` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `childName` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `toyName` | Backend API | Conversation start | Never | **Backend (not in repo)** |
| `flagged` | Backend API OR Mobile App | AI detection OR parent review | Parent dismisses flag | **Backend** or `FlagsScreen.tsx:220` |
| `flagReason` | Backend API OR Mobile App | AI detection OR parent review | Parent dismisses flag | **Backend** or `FlagsScreen.tsx:221` |
| `flagType` | Backend API | AI detection | Parent dismisses flag | **Backend (not in repo)** |
| `severity` | Backend API | AI detection | Parent dismisses flag | **Backend (not in repo)** |
| `flagStatus` | Backend API OR Mobile App | Conversation start (default) | Parent reviews | **Backend** or `FlagsScreen.tsx:222` |
| `messagePreview` | Backend API | Conversation end | Never | **Backend (not in repo)** |

### Messages Collection

| Field Path | Source | Created When | Modified When | File Location |
|-----------|--------|--------------|---------------|---------------|
| `sender` | Backend API | Message sent | Never | **Backend (not in repo)** |
| `content` | Backend API | Message sent | Never | **Backend (not in repo)** |
| `timestamp` | Backend API | Message sent | Never | **Backend (not in repo)** |
| `flagged` | Backend API | AI detection | Never | **Backend (not in repo)** |
| `flagReason` | Backend API | AI detection | Never | **Backend (not in repo)** |

---

## 7. Cloud Functions Logic

### Function 1: onConversationCreated

**File:** `functions/src/index.ts:85-95`

**Trigger:**
```typescript
onCreate('users/{userId}/children/{childId}/conversations/{conversationId}')
```

**Logic:**
```typescript
1. Extract userId from trigger path
2. Query all children: users/{userId}/children/*
3. For each child:
   - Query all conversations: users/{userId}/children/{childId}/conversations/*
   - Aggregate:
     - totalConversations++ (count)
     - totalDurationSec += (conversation.duration * 60)
     - if (conversation.flagged) flaggedConversations++
     - if (conversation.startTime > lastConversationAt) lastConversationAt = startTime
     - if (conversation.flagged && startTime > lastFlaggedAt) lastFlaggedAt = startTime
4. Write aggregated stats to users/{userId}.stats
```

**Performance Note:** Reads ALL conversations across ALL children on every create. May be slow for users with many conversations.

---

### Function 2: onConversationUpdated

**File:** `functions/src/index.ts:101-119`

**Trigger:**
```typescript
onUpdate('users/{userId}/children/{childId}/conversations/{conversationId}')
```

**Logic:**
```typescript
1. Check if flagged or duration field changed
2. If changed:
   - Execute same aggregation logic as onConversationCreated
   - Update users/{userId}.stats
3. If no relevant changes, exit early (optimization)
```

**Optimization:** Only recalculates if `flagged` or `duration` changes. Other field updates don't trigger stats recalculation.

---

### Function 3: onConversationDeleted

**File:** `functions/src/index.ts:124-134`

**Trigger:**
```typescript
onDelete('users/{userId}/children/{childId}/conversations/{conversationId}')
```

**Logic:**
```typescript
1. Extract userId from trigger path
2. Execute same aggregation logic as onConversationCreated
3. Update users/{userId}.stats
```

**Purpose:** Ensures stats remain accurate when conversations are deleted.

---

### Function 4: recalculateStats (Callable)

**File:** `functions/src/index.ts:142-166`

**Trigger:** Manual call from mobile app

**Security:**
```typescript
1. Check if user is authenticated
2. Extract userId from auth context
3. Only allow user to recalculate their own stats
```

**Logic:**
```typescript
1. Execute same aggregation logic as onConversationCreated
2. Return success/failure to client
```

**Use Case:** Manual sync button or recovery from data inconsistencies.

---

## 8. Critical Data Transformations

### Duration Units Conversion

**Issue:** Firestore stores duration in different units at different levels.

**Conversation Level:**
- Field: `conversation.duration`
- Unit: **Minutes** (number)
- Example: `8` (means 8 minutes)

**User Stats Level:**
- Field: `users/{userId}.stats.totalConversationDurationSec`
- Unit: **Seconds** (number)
- Example: `480` (means 480 seconds = 8 minutes)

**Transformation:**
```typescript
// functions/src/index.ts:42
stats.totalConversationDurationSec += (conversation.duration * 60);
```

**Why?** Allows for more precise calculations and avoids floating-point issues when summing fractional minutes.

---

### Denormalized Fields (Performance Optimization)

**Issue:** Querying subcollections for display names is expensive.

**Solution:** Denormalize child/toy names into conversation document.

**Example:**
```typescript
conversation: {
  childId: "child_id_emma",
  childName: "Emma",  // ← DENORMALIZED from children/{childId}.name
  toyName: "Unicorn Sparkle"  // ← DENORMALIZED from toys/{toyId}.name
}
```

**Benefit:**
- Displaying conversation list doesn't require reading child/toy documents
- Reduces Firestore read costs
- Improves UI performance

**Trade-off:**
- If child/toy name changes, old conversations still show old names
- Acceptable for conversation history (name at time of conversation)

---

### Flag Status Workflow

**Stages:**
1. **none** (default): No safety concerns detected
2. **pending**: AI flagged, waiting for parent review
3. **reviewed**: Parent acknowledged and dismissed flag

**State Transitions:**
```
none ──(AI detects issue)──> pending ──(Parent reviews)──> reviewed
```

**Firestore Fields:**
```typescript
{
  flagged: boolean,        // Quick filter: true/false
  flagStatus: string,      // Detailed state: "none" | "pending" | "reviewed"
  flagReason: string,      // Human-readable explanation
  flagType: string,        // Category: "personalInfo" | "inappropriateContent" | etc.
  severity: string         // Impact level: "Low" | "Medium" | "High"
}
```

**Query Example:**
```typescript
// Get all pending flags for Safety Center
conversations
  .where('flagged', '==', true)
  .where('flagStatus', '==', 'pending')
  .orderBy('startTime', 'desc')
```

---

### Stats Aggregation Scope

**Challenge:** Calculate user-level stats from nested subcollections.

**Current Implementation:**
```typescript
// Pseudocode
for each child in users/{userId}/children/ {
  for each conversation in children/{childId}/conversations/ {
    totalConversations++
    totalDurationSec += (conversation.duration * 60)
    if (conversation.flagged) flaggedConversations++
  }
}
```

**Performance Implications:**
- **Best Case:** 1 user, 1 child, 10 conversations = 12 reads
- **Typical Case:** 1 user, 3 children, 100 conversations = 104 reads
- **Worst Case:** 1 user, 5 children, 1000 conversations = 1006 reads

**Optimization Opportunities:**
1. Cache stats at child level (not implemented)
2. Use Cloud Firestore aggregation queries (future Firebase feature)
3. Batch stats updates (trade freshness for performance)

---

## 9. Missing Components Analysis

### 🚨 Backend API Service (NOT IN REPOSITORY)

**Evidence:**
1. ✅ Mobile app does NOT create conversations
2. ✅ Mobile app does NOT create messages
3. ✅ ESP32 receives user email during pairing
4. ✅ Conversations appear in Firestore without app-side writes

**Inferred Architecture:**

```
┌─────────────────────────────────────────────────┐
│ MISSING BACKEND SERVICE                         │
└─────────────────────────────────────────────────┘

Technology: Node.js/Python/Go (unknown)
Hosting: Cloud Run/App Engine/EC2 (unknown)

Endpoints (INFERRED):
├─ POST /api/conversations
│  ├─ Headers: { "X-User-Email": "parent@example.com" }
│  ├─ Body: { audio: base64, childId: string }
│  └─ Returns: { conversationId, response_audio }
│
├─ POST /api/messages
│  ├─ Headers: { "X-User-Email": "parent@example.com" }
│  ├─ Body: { conversationId, audio: base64 }
│  └─ Returns: { messageId, response_audio }
│
└─ GET /api/health
   └─ Returns: { status: "ok" }

Integrations:
├─ Firebase Admin SDK (writes to Firestore)
├─ OpenAI API or Claude API (AI responses)
├─ Google Cloud Speech-to-Text (audio transcription)
├─ Google Cloud Text-to-Speech (response audio)
└─ Content Safety API (flag detection)

Authentication:
├─ Receives email from ESP32 in headers
├─ Looks up userId from users collection where email=={email}
├─ Validates email exists in Firestore
└─ Uses userId for Firestore writes

Data Flow:
ESP32 ──HTTP POST──> Backend API ──Admin SDK──> Firestore
                          │
                          └──> OpenAI/Claude ──> AI Response
```

**Required Backend Functionality:**

1. **Audio Processing Pipeline**
   ```typescript
   async function handleConversation(email: string, audioBase64: string) {
     // 1. Validate user
     const userId = await getUserIdFromEmail(email);

     // 2. Speech-to-text
     const transcript = await speechToText(audioBase64);

     // 3. AI processing
     const aiResponse = await openai.chat.completions.create({
       model: "gpt-4",
       messages: [{ role: "user", content: transcript }]
     });

     // 4. Content safety check
     const safetyCheck = await checkContentSafety(transcript, aiResponse);

     // 5. Create conversation in Firestore
     const conversationRef = await db
       .collection(`users/${userId}/children/${childId}/conversations`)
       .add({
         startTime: FieldValue.serverTimestamp(),
         flagged: safetyCheck.flagged,
         flagReason: safetyCheck.reason,
         ...
       });

     // 6. Create messages
     await conversationRef.collection('messages').add({
       sender: 'child',
       content: transcript,
       timestamp: FieldValue.serverTimestamp()
     });

     await conversationRef.collection('messages').add({
       sender: 'toy',
       content: aiResponse.choices[0].message.content,
       timestamp: FieldValue.serverTimestamp()
     });

     // 7. Text-to-speech
     const responseAudio = await textToSpeech(aiResponse.choices[0].message.content);

     // 8. Return audio to ESP32
     return { audio: responseAudio };
   }
   ```

2. **Email → UserID Lookup**
   ```typescript
   async function getUserIdFromEmail(email: string): Promise<string> {
     const userSnapshot = await db.collection('users')
       .where('email', '==', email)
       .limit(1)
       .get();

     if (userSnapshot.empty) {
       throw new Error('User not found');
     }

     return userSnapshot.docs[0].id;
   }
   ```

3. **Content Safety Detection**
   ```typescript
   async function checkContentSafety(
     childMessage: string,
     aiResponse: string
   ): Promise<SafetyCheckResult> {
     // Check for blocked topics
     const blockedPatterns = [
       { type: 'personalInfo', pattern: /address|phone|email|school name/i },
       { type: 'violence', pattern: /hurt|kill|weapon/i },
       { type: 'matureContent', pattern: /... /i }
     ];

     for (const check of blockedPatterns) {
       if (check.pattern.test(childMessage) || check.pattern.test(aiResponse)) {
         return {
           flagged: true,
           flagType: check.type,
           reason: `Detected ${check.type} in conversation`,
           severity: 'Medium'
         };
       }
     }

     return { flagged: false };
   }
   ```

**Location:** Separate repository or cloud service (not provided)

---

### 🔧 ESP32 Firmware (NOT IN REPOSITORY)

**Evidence:**
1. ✅ Mobile app sends WiFi credentials via BLE
2. ✅ ESP32 must parse `{ssid}|{password}|{email}` format
3. ✅ ESP32 must store email for API authentication
4. ✅ ESP32 must handle button press, audio recording, playback

**Inferred Firmware Requirements:**

```cpp
// ESP32 Firmware (Arduino/ESP-IDF)

#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>

// Configuration
String userEmail = "";
String wifiSSID = "";
String wifiPassword = "";
String backendURL = "https://api.lunotoys.com";

// BLE Characteristics
BLECharacteristic* wifiCredentialChar;

void setup() {
  // 1. Initialize BLE for pairing
  BLEDevice::init("Luno Unicorn");
  setupBLEService();

  // 2. Wait for WiFi credentials from mobile app
  waitForWiFiCredentials();

  // 3. Connect to WiFi
  connectToWiFi();

  // 4. Initialize audio hardware
  setupMicrophone();
  setupSpeaker();

  // 5. Initialize button
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void setupBLEService() {
  BLEServer* server = BLEDevice::createServer();
  BLEService* service = server->createService(SERVICE_UUID);

  // Characteristic for receiving WiFi credentials
  wifiCredentialChar = service->createCharacteristic(
    WIFI_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );

  wifiCredentialChar->setCallbacks(new WiFiCredentialCallback());
  service->start();
  server->getAdvertising()->start();
}

class WiFiCredentialCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* characteristic) {
    // Receive format: "{ssid}|{password}|{email}"
    String data = characteristic->getValue().c_str();

    int firstPipe = data.indexOf('|');
    int secondPipe = data.indexOf('|', firstPipe + 1);

    wifiSSID = data.substring(0, firstPipe);
    wifiPassword = data.substring(firstPipe + 1, secondPipe);
    userEmail = data.substring(secondPipe + 1);

    // Save to EEPROM for persistence
    saveCredentialsToEEPROM();
  }
};

void connectToWiFi() {
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  // Wait for button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    handleConversation();
  }
}

void handleConversation() {
  // 1. Record audio
  byte* audioData = recordAudio();

  // 2. Send to backend
  HTTPClient http;
  http.begin(backendURL + "/api/conversations");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-User-Email", userEmail);

  String payload = "{\"audio\":\"" + base64Encode(audioData) + "\"}";
  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    // 3. Receive response
    String response = http.getString();
    String responseAudio = parseAudioFromResponse(response);

    // 4. Play audio response
    playAudio(base64Decode(responseAudio));
  }

  http.end();
}
```

**Location:** Separate repository or Arduino project (not provided)

---

### 📊 Real-time Status Updates (PARTIALLY IMPLEMENTED)

**Current State:**
- ✅ Mobile app reads toy status via Firestore
- ❌ No mechanism for ESP32 to update status in real-time
- ❌ `batteryLevel`, `lastConnected`, `wifiConnected` appear static

**Missing Implementation:**

```typescript
// Backend should periodically update toy status
async function updateToyStatus(deviceId: string) {
  const toyRef = db.collection(`users/${userId}/toys/${deviceId}`);

  await toyRef.update({
    lastConnected: FieldValue.serverTimestamp(),
    status: "online",  // or "offline" if no heartbeat
    batteryLevel: 75,  // from ESP32 heartbeat
    wifiConnected: true
  });
}

// ESP32 should send heartbeat every 5 minutes
setInterval(async () => {
  await fetch(`${backendURL}/api/heartbeat`, {
    method: 'POST',
    headers: { 'X-User-Email': userEmail },
    body: JSON.stringify({
      deviceId: 'ESP32_ABC123',
      batteryLevel: getBatteryLevel(),
      firmwareVersion: 'v2.1.4'
    })
  });
}, 5 * 60 * 1000);
```

---

### 🔐 Security Gaps

**Issue 1: Email-Only Authentication**
- ESP32 authenticates using email in HTTP header
- No API key, no token rotation
- Anyone with user's email can impersonate ESP32

**Recommendation:**
```typescript
// During pairing, generate device-specific API key
const deviceApiKey = generateSecureToken();

// Store in Firestore
await db.collection(`users/${userId}/toys/${deviceId}`).update({
  apiKey: deviceApiKey  // Hash this!
});

// Send to ESP32 via BLE
bleCharacteristic.write(JSON.stringify({
  ssid: wifiSSID,
  password: wifiPassword,
  email: userEmail,
  apiKey: deviceApiKey  // ← NEW
}));

// Backend validates API key instead of email
const toy = await db.collection('toys')
  .where('apiKey', '==', hashApiKey(providedKey))
  .get();
```

**Issue 2: No Firestore Security Rules Visible**
- File `firestore.rules` not in repository
- Unknown if security rules prevent unauthorized access

**Recommendation:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      match /children/{childId} {
        allow read, write: if request.auth.uid == userId;

        match /conversations/{conversationId} {
          allow read: if request.auth.uid == userId;
          allow write: if false;  // Only backend writes via Admin SDK

          match /messages/{messageId} {
            allow read: if request.auth.uid == userId;
            allow write: if false;  // Only backend writes via Admin SDK
          }
        }
      }

      match /toys/{toyId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

---

## 10. Recommendations & Next Steps

### Immediate Actions

1. **Document Backend API**
   - Create API specification (OpenAPI/Swagger)
   - Document endpoint URLs, request/response formats
   - Define authentication mechanism
   - Provide backend repository link

2. **Implement Security Rules**
   - Add `firestore.rules` file to repository
   - Test rules with Firebase emulator
   - Prevent unauthorized data access

3. **Add Device API Keys**
   - Generate unique API key per device during pairing
   - Store hashed API keys in Firestore
   - Replace email-based authentication with API keys

4. **Implement Heartbeat System**
   - ESP32 sends status updates every 5 minutes
   - Backend updates toy status in Firestore
   - Mobile app displays real-time online/offline status

5. **Add Error Handling**
   - Cloud Functions should handle missing data gracefully
   - Mobile app should retry failed writes
   - ESP32 should queue audio if backend unavailable

---

### Architecture Improvements

1. **Optimize Stats Calculation**
   ```typescript
   // Add child-level stats to reduce Cloud Function reads
   users/{userId}/children/{childId}
   ├─ stats: {
   │    conversationCount: number,
   │    totalDurationSec: number,
   │    flaggedCount: number
   │  }

   // Cloud Functions only sum child-level stats (faster)
   userStats = sum(child.stats for each child)
   ```

2. **Add Offline Support**
   - Enable Firestore offline persistence
   - Queue writes when offline
   - Sync when connection restored

3. **Implement Rate Limiting**
   - Prevent abuse of backend API
   - Limit conversations per day per child (based on dailyLimitHours)
   - Throttle Cloud Function executions

4. **Add Monitoring & Logging**
   - Firebase Performance Monitoring
   - Cloud Functions logging
   - Backend API request logging
   - ESP32 error reporting

5. **Implement Batch Operations**
   ```typescript
   // Instead of updating stats on every conversation
   // Batch updates every 5 minutes or 10 conversations
   const batch = db.batch();
   batch.update(userRef, { stats: aggregatedStats });
   await batch.commit();
   ```

---

### Testing Requirements

1. **Unit Tests**
   - Cloud Functions aggregation logic
   - Mobile app Firestore writes
   - Backend API endpoints

2. **Integration Tests**
   - End-to-end conversation flow (ESP32 → Backend → Firestore → App)
   - Stats synchronization
   - Flag review workflow

3. **Load Tests**
   - 100+ conversations per child (stats calculation performance)
   - Multiple concurrent conversations
   - ESP32 connectivity stress test

4. **Security Tests**
   - Firestore security rules validation
   - API authentication bypass attempts
   - Data access control verification

---

### Documentation Needs

1. **Backend API Documentation**
   - Endpoint specifications
   - Authentication flow
   - Error codes and handling
   - Rate limits

2. **ESP32 Firmware Documentation**
   - BLE pairing protocol
   - WiFi setup process
   - Audio encoding format
   - Heartbeat mechanism

3. **Deployment Guide**
   - Firebase project setup
   - Cloud Functions deployment
   - Backend API deployment
   - ESP32 firmware flashing

4. **Developer Onboarding**
   - Architecture overview (this document)
   - Local development setup
   - Testing procedures
   - Contribution guidelines

---

## Summary

### Data Flow Recap

```
USER SETUP (Mobile App Only)
├─ Create user account
├─ Add child profiles with parental controls
└─ Pair toys via BLE + WiFi setup

CONVERSATION (ESP32 → Backend → Firestore → Mobile App)
├─ ESP32 records audio
├─ Backend processes via AI
├─ Backend creates conversation + messages in Firestore
├─ Cloud Functions auto-calculate stats
└─ Mobile app displays in real-time

MANAGEMENT (Mobile App + Cloud Functions)
├─ Parent reviews flagged content
├─ Parent adjusts settings
├─ Cloud Functions maintain data consistency
└─ Stats update automatically
```

### Key Findings

1. ✅ **Mobile App**: Handles all user-initiated data (profiles, settings, pairing)
2. ✅ **Cloud Functions**: Automatic stats aggregation with real-time triggers
3. ❌ **Backend API**: Missing from repository - creates conversations/messages
4. ❌ **ESP32 Firmware**: Missing from repository - audio capture & WiFi
5. ⚠️ **Security**: Email-based auth is weak, needs API key implementation
6. ⚠️ **Performance**: Stats calculation reads all conversations (optimization needed)

### Next Priority

**Highest Priority:**
1. Document/provide backend API repository
2. Implement Firestore security rules
3. Add device API key authentication

**Medium Priority:**
4. Optimize Cloud Functions stats calculation
5. Implement ESP32 heartbeat system
6. Add comprehensive error handling

**Low Priority:**
7. Batch stats updates for performance
8. Add offline support
9. Implement monitoring/logging

---

**Document Version:** 1.0
**Last Reviewed:** December 15, 2025
**Maintained By:** Development Team