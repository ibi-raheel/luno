# Firebase Cloud Functions - Stats Aggregation

This directory contains Firebase Cloud Functions that automatically maintain aggregated statistics for the Luno Toys mobile app.

## Overview

The functions listen to Firestore conversation changes and automatically update parent-level stats in the `users/{userId}` document.

### Triggers

1. **onConversationCreated** - Fires when a new conversation is added
2. **onConversationUpdated** - Fires when a conversation is modified (flagged status, duration, etc.)
3. **onConversationDeleted** - Fires when a conversation is deleted

All triggers automatically recalculate and update the following stats:
- `totalConversations` - Total number of conversations across all children
- `totalConversationDurationSec` - Total duration in seconds
- `flaggedConversations` - Number of flagged conversations

### Manual Recalculation

A callable function `manualRecalculateStats` is also available for:
- Initial setup when first deploying
- Fixing stats if they get out of sync
- Bulk recalculation

## Setup & Deployment

### Prerequisites

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Update `.firebaserc` with your Firebase project ID:
```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

### Install Dependencies

```bash
cd functions
npm install
```

### Build Functions

```bash
npm run build
```

### Deploy to Firebase

Deploy all functions:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:onConversationCreated
```

### Test Locally

Run the Firebase emulator:
```bash
npm run serve
```

## Usage in App

### Automatic Updates

Once deployed, stats will automatically update whenever conversations are:
- Created (e.g., when generating fake data)
- Updated (e.g., when marking as flagged)
- Deleted

The dashboard will show updated stats in real-time since it uses Firestore listeners.

### Manual Recalculation

If you need to manually recalculate stats for the current user:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const recalculateStats = httpsCallable(functions, 'manualRecalculateStats');

// Recalculate for current user
await recalculateStats({ userId: currentUser.uid });
```

## Data Flow

```
Conversation Created/Updated/Deleted
    ↓
Cloud Function Triggered
    ↓
Query All Conversations for User
    ↓
Calculate Aggregated Stats
    ↓
Update users/{userId}.stats
    ↓
Dashboard Auto-Updates (via Firestore listener)
```

## Cost Optimization

The functions use full recalculation on every change. For production with high traffic, consider:

1. **Incremental updates** - Add/subtract values instead of full recalculation
2. **Batching** - Queue updates and process in batches
3. **Caching** - Use Redis or Firestore for intermediate calculations

Current implementation prioritizes:
- ✅ Simplicity and reliability
- ✅ Data accuracy
- ⚠️ May need optimization at scale

## Monitoring

View function logs:
```bash
firebase functions:log
```

View specific function logs:
```bash
firebase functions:log --only onConversationCreated
```

## Troubleshooting

### Stats not updating?

1. Check function deployment status:
```bash
firebase functions:list
```

2. Check logs for errors:
```bash
firebase functions:log
```

3. Manually trigger recalculation:
```typescript
await recalculateStats({ userId: currentUser.uid });
```

### Functions not deploying?

1. Ensure you're using Node.js 18
2. Check `.firebaserc` has correct project ID
3. Verify you have permissions in Firebase Console

## Development

### File Structure

```
functions/
├── src/
│   └── index.ts          # Main functions file
├── lib/                  # Compiled JavaScript (git ignored)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

### Adding New Functions

Add new functions to `src/index.ts` and export them:

```typescript
export const myNewFunction = functions.firestore
  .document('path/{id}')
  .onCreate(async (snapshot, context) => {
    // Your code here
  });
```

Then deploy:
```bash
npm run build
firebase deploy --only functions:myNewFunction
```
