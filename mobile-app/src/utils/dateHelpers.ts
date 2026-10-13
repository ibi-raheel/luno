// src/utils/dateHelpers.ts
// Safe utilities for handling Firestore timestamps and dates

/**
 * Safely converts a Firestore Timestamp or any date value to a valid Date object
 * @param timestamp - Can be Firestore Timestamp, Date, string, number, or null/undefined
 * @returns A valid Date object (defaults to current date if conversion fails)
 */
export function safeTimestampToDate(timestamp: any): Date {
  // Handle null/undefined
  if (!timestamp) return new Date();

  // Already a Date object
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? new Date() : timestamp;
  }

  // Firestore Timestamp object with toDate() method
  if (typeof timestamp?.toDate === 'function') {
    try {
      const date = timestamp.toDate();
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.warn('Error converting timestamp to date:', error);
    }
    return new Date();
  }

  // String or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) ? date : new Date();
  }

  // Fallback
  return new Date();
}

/**
 * Safely formats a timestamp to a locale date string
 * @param timestamp - Any timestamp value
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or fallback string
 */
export function safeFormatDate(
  timestamp: any,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = safeTimestampToDate(timestamp);
  try {
    return date.toLocaleDateString([], options);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Safely formats a timestamp to a locale time string
 * @param timestamp - Any timestamp value
 * @returns Formatted time string like "3:45 PM"
 */
export function safeFormatTime(timestamp: any): string {
  const date = safeTimestampToDate(timestamp);
  try {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return 'Invalid time';
  }
}
