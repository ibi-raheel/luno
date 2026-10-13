// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Local-only demo user (no Firebase account)
  const createDemoUser = (): Partial<User> => ({
    uid: "demo-user-123",
    email: "demo@lunotoys.com",
    displayName: "Demo User",
    photoURL: null,
    emailVerified: true,
  });

  async function signInAsGuest() {
    console.log("[Auth] signInAsGuest (demo)");
    const demoUser = createDemoUser() as User;
    setCurrentUser(demoUser);
    setIsDemoMode(true);
  }

  async function signUp(email: string, password: string, displayName: string) {
    try {
      console.log("[Auth] signUp start", email);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      console.log("[Auth] Firebase user created:", user.uid);

      // Update displayName in Firebase Auth
      await updateProfile(user, { displayName });
      console.log("[Auth] Auth profile updated with displayName:", displayName);

      // Create Firestore user document with full structure
      const userRef = doc(db, "users", user.uid);

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: serverTimestamp(),

        // App-level prefs
        preferences: {
          notifications: true,
          theme: "light",
        },

        // Children & toys summary
        childrenCount: 0,
        toys: [],

        // Aggregate stats across ALL children (initialized)
        stats: {
          totalConversations: 0,
          totalConversationDurationSec: 0,
          flaggedConversations: 0,
          lastConversationAt: null,
          lastFlaggedAt: null,
        },

        // Onboarding flow flag (used by AppNavigator)
        onboardingCompleted: false,

        // For future activity tracking
        lastActivityAt: serverTimestamp(),
      });

      console.log("[Auth] Firestore user document created for", user.uid);
    } catch (error) {
      console.error("[Auth] signUp error:", error);
      throw error;
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    console.log("[Auth] signIn", email);
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function signOut() {
    if (isDemoMode) {
      console.log("[Auth] signOut demo user");
      setCurrentUser(null);
      setIsDemoMode(false);
    } else {
      console.log("[Auth] signOut Firebase user");
      await firebaseSignOut(auth);
    }
  }

  async function resetPassword(email: string) {
    console.log("[Auth] resetPassword", email);
    await sendPasswordResetEmail(auth, email.trim());
  }

  useEffect(() => {
    console.log("[Auth] Setting up onAuthStateChanged listener");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[Auth] onAuthStateChanged user:", user?.uid ?? "null");
      setCurrentUser(user || null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInAsGuest,
    signOut,
    resetPassword,
    isDemoMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* AppNavigator uses `loading` + `currentUser` to decide what to show */}
      {children}
    </AuthContext.Provider>
  );
}
