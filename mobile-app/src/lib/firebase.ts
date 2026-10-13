// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { Platform } from "react-native";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your Firebase configuration (loaded from environment variables)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, // not used in RN, but can stay here
};

// Initialize core Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let auth;
if (Platform.OS === 'web') {
  // Web platform: use standard getAuth with browser persistence
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  // React Native platforms (ios/android): use initializeAuth with AsyncStorage
  // TypeScript typings are behind for RN, so we ignore this one line:
  // @ts-ignore
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

// Firestore (we'll use this soon for children, toys, conversations, etc.)
const db = getFirestore(app);

// Cloud Functions
const functions = getFunctions(app);

// Callable function to recalculate user stats
export const recalculateStats = httpsCallable(functions, "manualRecalculateStats");

export { app, auth, db, functions };
