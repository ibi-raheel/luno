# Security Checklist - Before Pushing to Public Repository

**Date:** December 24, 2025
**Status:** ⚠️ **ACTION REQUIRED**

---

## 🚨 CRITICAL ISSUES FOUND

### 1. **HARDCODED FIREBASE CREDENTIALS** ⚠️ **MUST FIX**

**Location:** `src/lib/firebase.ts` (lines 12-18)

**Issue:** Firebase API keys and credentials are hardcoded directly in the source code.

**Risk Level:** 🔴 **CRITICAL**

**Current Code:**
```typescript
const firebaseConfig = {
  apiKey: "AIza...REDACTED",  // ⚠️ EXPOSED
  authDomain: "luno-companion-app-dev.firebaseapp.com",
  projectId: "luno-companion-app-dev",
  // ... more credentials
};
```

**Impact if pushed:**
- Anyone can access your Firebase project
- Unauthorized database access
- Potential data breaches
- Abuse of your Firebase quota
- Security rules bypass attempts

**REQUIRED ACTION:**
Move credentials to environment variables immediately (see fix below).

---

### 2. **PRIVATE KEY FILE IN REPOSITORY** ⚠️ **MUST REMOVE**

**Location:** `keys/plushie_ai_new.pem`

**Risk Level:** 🔴 **CRITICAL**

**Issue:** A `.pem` private key file is present in the repository.

**Impact if pushed:**
- Complete compromise of associated service
- Unauthorized access to encrypted data
- Impersonation attacks
- Cannot be revoked without regenerating

**REQUIRED ACTION:**
1. Delete from repository: `git rm -r keys/`
2. If already committed: Use `git filter-branch` or BFG Repo-Cleaner
3. Regenerate the key pair (this one is now compromised)
4. Store keys securely (1Password, AWS Secrets Manager, etc.)

---

## ✅ GOOD - Already Protected

### Protected Files (in .gitignore)
- ✅ `keys/` directory - Will be ignored
- ✅ `.env` files - Will be ignored
- ✅ `*.pem` files - Will be ignored
- ✅ `node_modules/` - Already ignored
- ✅ `/ios` and `/android` - Generated folders ignored

### Files Tracked (Safe to Push)
- ✅ `.env.example` - Contains only placeholder values
- ✅ Documentation files - No sensitive data
- ✅ Source code - No other hardcoded secrets found

---

## 🔧 REQUIRED FIXES BEFORE PUSHING

### Fix 1: Move Firebase Credentials to Environment Variables

**Step 1:** Create `.env` file in root directory

```bash
# Create .env file (will be ignored by git)
cat > .env << 'EOF'
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...REDACTED
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=luno-companion-app-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=luno-companion-app-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=luno-companion-app-dev.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1045141937894
EXPO_PUBLIC_FIREBASE_APP_ID=1:1045141937894:web:1548a3ef0e419815ad6527
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-X2Y60KCRC3
EOF
```

**Step 2:** Update `src/lib/firebase.ts`

Replace hardcoded config with environment variables:

```typescript
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import Constants from "expo-constants";

// Get Firebase config from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase configuration is missing. Please check your .env file."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const db = getFirestore(app);
const functions = getFunctions(app);

export const recalculateStats = httpsCallable(functions, "manualRecalculateStats");
export { app, auth, db, functions };
```

**Step 3:** Install expo-constants (if not already installed)

```bash
npx expo install expo-constants
```

**Step 4:** Verify `.env` is in `.gitignore`

✅ Already done - `.env` is now properly ignored.

---

### Fix 2: Remove Private Key from Repository

**If the keys/ directory has NEVER been committed:**

```bash
# Simply remove it (already in .gitignore)
rm -rf keys/
```

**If the keys/ directory WAS ALREADY committed to git history:**

⚠️ **WARNING:** This rewrites git history. Inform all team members.

```bash
# Option 1: Using git filter-branch (built-in)
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch keys/' \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Using BFG Repo-Cleaner (faster, recommended)
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-folders keys
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push to overwrite remote history
git push origin --force --all
```

**IMPORTANT:** After removing, regenerate the key pair as the old one is compromised.

---

## 🔒 Additional Security Recommendations

### 1. Bundle Identifier Change (Recommended)

**Current:** `com.anonymous.luno-toys-mobile` (contains "anonymous")

**Recommended:** Change to professional identifier:
- `com.lunotoys.companion`
- `com.lunotoys.parent`
- `com.lunotoys.app`

**Where to change:**
- `app.json` → `expo.ios.bundleIdentifier`
- `app.json` → `expo.android.package`

⚠️ **Note:** Do this BEFORE first App Store submission (can't change after).

---

### 2. Firebase Security Rules

Ensure Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Check your rules at:** [Firebase Console](https://console.firebase.google.com)

---

### 3. App Secret Management

For production, consider using:
- **Expo Secrets** for environment variables
- **Firebase Remote Config** for dynamic configuration
- **AWS Secrets Manager** or **HashiCorp Vault** for sensitive keys
- **1Password** or **Doppler** for team secret sharing

---

### 4. Pre-commit Hooks (Optional but Recommended)

Install git hooks to prevent accidental commits of secrets:

```bash
# Install husky for git hooks
npm install --save-dev husky
npx husky install

# Add pre-commit hook to check for secrets
npx husky add .husky/pre-commit "npm run check-secrets"
```

Add to `package.json`:
```json
{
  "scripts": {
    "check-secrets": "git diff --cached --name-only | grep -E '\\.(ts|tsx|js|jsx)$' | xargs grep -l 'AIzaSy\\|sk-\\|SECRET\\|PASSWORD' && echo '⚠️  Secrets detected!' && exit 1 || exit 0"
  }
}
```

---

## ✅ Pre-Push Checklist

Before pushing to a public repository, verify:

- [ ] **Firebase credentials moved to .env** ✅ (Fix provided above)
- [ ] **`.env` file created and NOT committed** ⚠️ (Do this)
- [ ] **`keys/` directory removed from repository** ⚠️ (Critical)
- [ ] **`src/lib/firebase.ts` updated to use env vars** ⚠️ (Do this)
- [ ] **`.gitignore` updated** ✅ (Already done)
- [ ] **No API keys in source code** ⚠️ (Fix firebase.ts first)
- [ ] **No `.pem` or `.key` files tracked** ✅ (Will be ignored)
- [ ] **No `google-services.json` tracked** ✅ (Will be ignored)
- [ ] **Bundle identifier changed from "anonymous"** ⚠️ (Recommended)
- [ ] **Firebase security rules configured** ⚠️ (Check Firebase Console)
- [ ] **Run:** `git status` to verify nothing sensitive is staged

---

## 📋 Quick Command Reference

```bash
# Check what files will be committed
git status

# Check if any sensitive files are tracked
git ls-files | grep -E "\.env|\.pem|keys/|credentials"

# Remove file from git but keep locally
git rm --cached path/to/file

# Check for hardcoded secrets
grep -r "AIzaSy\|sk-\|SECRET\|PASSWORD" src/

# Verify .gitignore is working
git check-ignore -v keys/plushie_ai_new.pem
```

---

## 🚦 Status Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| .gitignore updated | ✅ DONE | None |
| Firebase credentials | 🔴 EXPOSED | Move to .env immediately |
| Private keys (.pem) | 🔴 PRESENT | Delete and regenerate |
| Environment variables | 🟡 MISSING | Create .env file |
| Bundle identifier | 🟡 "ANONYMOUS" | Change before App Store |
| Documentation | ✅ SAFE | None |

---

## 🆘 Emergency: Already Pushed Secrets?

If you've already pushed sensitive credentials to GitHub:

1. **Immediately rotate all credentials:**
   - Regenerate Firebase API keys
   - Create new private keys
   - Update all services

2. **Remove from git history:**
   - Use BFG Repo-Cleaner or git filter-branch
   - Force push to remote

3. **Check for exposure:**
   - Search GitHub for your API keys
   - Monitor Firebase usage for anomalies
   - Check Firebase logs for unauthorized access

4. **Notify team:**
   - Inform all developers
   - Update credential documentation
   - Implement pre-commit hooks

---

## 📧 Questions?

If you need help with any of these fixes:

**Email:** auracampusapp@gmail.com

---

**⚠️ DO NOT PUSH TO PUBLIC REPOSITORY UNTIL FIXES ARE COMPLETED ⚠️**

**Last Updated:** December 24, 2025
