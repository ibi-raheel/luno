# Cloud Functions Setup Guide

This guide will help you deploy Firebase Cloud Functions to automatically update dashboard stats when conversations change.

## Quick Start

### 1. Update Firebase Project ID

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR_ACTUAL_PROJECT_ID"
  }
}
```

You can find your project ID in the Firebase Console or in your `src/lib/firebase.ts` file.

### 2. Install Dependencies

```bash
cd functions
npm install
```

### 3. Build Functions

```bash
npm run build
```

### 4. Deploy to Firebase

Make sure you're logged in:
```bash
firebase login
```

Deploy the functions:
```bash
cd ..
firebase deploy --only functions
```

This will deploy 4 functions:
- `onConversationCreated` - Triggers when a conversation is created
- `onConversationUpdated` - Triggers when a conversation is updated
- `onConversationDeleted` - Triggers when a conversation is deleted
- `manualRecalculateStats` - Callable function to manually recalculate stats

## How It Works

### Before Cloud Functions

When you generated fake conversations, the stats on the dashboard didn't update because they were reading from a pre-aggregated `users/{userId}.stats` field that wasn't being maintained.

### After Cloud Functions

1. **Automatic Updates**: Whenever a conversation is created, updated, or deleted, the Cloud Function automatically recalculates all stats for that user
2. **Real-time Dashboard**: The dashboard continues using its Firestore listener, which now sees the updated stats immediately
3. **Always Accurate**: Stats are always accurate because they're recalculated from the source data

## Verify Deployment

After deploying, you can verify the functions are running:

1. Check the Firebase Console → Functions section
2. Generate some fake data in your app
3. Watch the dashboard stats update automatically
4. Check function logs:
   ```bash
   firebase functions:log
   ```

## First-Time Setup: Recalculate Existing Stats

If you have existing conversations, you can manually recalculate stats for your account:

Add this code temporarily to your app (e.g., in DashboardScreen):

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

// Add this button somewhere in your UI
<Button
  title="Recalculate My Stats"
  onPress={async () => {
    const functions = getFunctions();
    const recalculateStats = httpsCallable(functions, 'manualRecalculateStats');
    await recalculateStats({ userId: currentUser.uid });
    alert('Stats recalculated!');
  }}
/>
```

## Cost Considerations

Firebase Cloud Functions pricing:
- **Free tier**: 2M invocations/month, 400K GB-seconds, 200K CPU-seconds
- Your usage: ~3 function calls per conversation change (create/update/delete)

For typical development and small-scale production, you'll stay within the free tier.

## Troubleshooting

### Stats still not updating?

1. Check if functions deployed successfully:
   ```bash
   firebase functions:list
   ```

2. Check function logs for errors:
   ```bash
   firebase functions:log
   ```

3. Verify your `.firebaserc` has the correct project ID

4. Make sure you're creating conversations in the correct Firestore path:
   ```
   users/{userId}/children/{childId}/conversations/{conversationId}
   ```

### Permission errors?

Make sure you have the necessary permissions in Firebase Console:
- Firebase Admin
- Cloud Functions Admin

## Next Steps

Once deployed, your dashboard will automatically stay in sync with your conversation data. No manual updates needed!

For more details, see `functions/README.md`.
