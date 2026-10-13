import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Check if a toy with the given deviceId already exists in any user's toys collection
 * @param deviceId The unique device identifier (e.g., "LUNO-TOY-AB12CD34")
 * @returns Object with exists (boolean) and ownerId (string | null)
 */
export async function checkToyAlreadyExists(
  deviceId: string
): Promise<{ exists: boolean; ownerId: string | null }> {
  try {
    // Use collectionGroup to query all 'toys' subcollections across all users
    // This searches: users/{anyUserId}/toys/{deviceId}
    const toysQuery = collectionGroup(db, 'toys');

    // Query for document with this specific ID
    // Since we're using deviceId as the document ID, we need to check if any
    // user has a toy document with this ID

    // Alternative approach: Check if the deviceId exists as a field
    // First, let's check if there's a toy with deviceId field matching
    const q = query(toysQuery, where('deviceId', '==', deviceId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Toy already exists
      const toyDoc = querySnapshot.docs[0];
      // Get the user ID from the document path: users/{userId}/toys/{toyId}
      const pathParts = toyDoc.ref.path.split('/');
      const ownerId = pathParts[1]; // The userId is at index 1

      return {
        exists: true,
        ownerId,
      };
    }

    return {
      exists: false,
      ownerId: null,
    };
  } catch (error: any) {
    console.error('Error checking toy existence:', error);

    // If missing Firestore index, skip duplicate check (dev only)
    if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
      console.warn('⚠️  Skipping duplicate toy check - Firestore index not created yet');
      console.warn('📝 Create index at:', error.message.match(/https:\/\/[^\s]+/)?.[0]);
      return { exists: false, ownerId: null };
    }

    throw new Error('Failed to validate toy ownership');
  }
}

/**
 * Check if the current user already has this toy
 * @param userId Current user's ID
 * @param deviceId The unique device identifier
 * @returns boolean indicating if user owns this toy
 */
export async function userOwnsToy(
  userId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const toysCollection = collection(db, 'users', userId, 'toys');
    const q = query(toysCollection, where('deviceId', '==', deviceId));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking user toy ownership:', error);
    return false;
  }
}

/**
 * Validate toy before pairing
 * Checks if toy is already registered and provides user-friendly error messages
 * @param deviceId The unique device identifier
 * @param currentUserId Current user's ID
 * @returns Object with valid (boolean) and error message
 */
export async function validateToyForPairing(
  deviceId: string,
  currentUserId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check if user already owns this toy
    const alreadyOwned = await userOwnsToy(currentUserId, deviceId);
    if (alreadyOwned) {
      return {
        valid: false,
        error: 'You have already paired this toy',
      };
    }

    // Check if another user owns this toy
    const { exists, ownerId } = await checkToyAlreadyExists(deviceId);
    if (exists && ownerId !== currentUserId) {
      return {
        valid: false,
        error: 'This toy is already registered to another account. Please contact support if you believe this is an error.',
      };
    }

    return {
      valid: true,
    };
  } catch (error: any) {
    console.error('Error validating toy:', error);
    console.error('Error details:', error?.message, error?.code);
    return {
      valid: false,
      error: `Failed to validate toy: ${error?.message || 'Please check your connection and try again.'}`,
    };
  }
}
