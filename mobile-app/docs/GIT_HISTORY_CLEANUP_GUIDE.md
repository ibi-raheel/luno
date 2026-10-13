# Git History Cleanup Guide - Remove Sensitive Files

**Repository:** `git@github.com:rhkrohan/luno-mobile-app.git`
**Date:** December 24, 2025

---

## 🚨 CRITICAL: Files to Remove from Git History

The following sensitive files need to be removed from your **entire git history**:

1. ✅ `keys/` directory (contains `.pem` private keys)
2. ✅ `*.pem` files anywhere in the repo
3. ✅ `.env` files (except `.env.example`)
4. ✅ `google-services.json` (Firebase Android config)
5. ✅ `GoogleService-Info.plist` (Firebase iOS config)

---

## ⚠️ IMPORTANT WARNINGS

### Before You Start:

1. **🔴 This rewrites git history** - It cannot be undone easily
2. **🔴 All team members must re-clone** after you force push
3. **🔴 Create a backup** before running any commands
4. **🔴 Notify your team** before proceeding
5. **🔴 Close all pull requests** or they'll be affected
6. **🔴 After cleanup, ROTATE ALL CREDENTIALS** immediately

### Why This is Necessary:

Even if you delete files now, they still exist in git history. Anyone can access previous commits and retrieve:
- Your Firebase API keys
- Private encryption keys
- Database credentials
- Any other secrets

**Simply deleting and committing is NOT enough!**

---

## 🚀 METHOD 1: Automated Script (Recommended)

I've created a script that does everything for you.

### Run the Script:

```bash
# Make script executable (if not already)
chmod +x REMOVE_SECRETS_FROM_GIT.sh

# Run the script
./REMOVE_SECRETS_FROM_GIT.sh
```

### What the Script Does:

1. ✅ Creates automatic backup
2. ✅ Removes `keys/` directory from all history
3. ✅ Removes all `*.pem` files from all history
4. ✅ Removes `.env` files (keeps `.env.example`)
5. ✅ Removes Firebase config files
6. ✅ Cleans up git repository
7. ✅ Verifies files are gone
8. ✅ (Optional) Force pushes to GitHub

**Safe:** The script asks for confirmation at each critical step.

---

## 🛠️ METHOD 2: Manual Commands (Step-by-Step)

If you prefer to run commands manually:

### Step 1: Create Backup

```bash
# Create a backup of your repository
git clone --mirror . "../luno-toys-backup-$(date +%Y%m%d)"
```

### Step 2: Remove Sensitive Files from History

```bash
# Remove keys/ directory from all history
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch keys/' \
  --prune-empty --tag-name-filter cat -- --all

# Remove all .pem files
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch "*.pem"' \
  --prune-empty --tag-name-filter cat -- --all

# Remove .env files (but keep .env.example)
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch .env .env.local .env.development .env.production' \
  --prune-empty --tag-name-filter cat -- --all

# Remove Firebase config files
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch google-services.json GoogleService-Info.plist' \
  --prune-empty --tag-name-filter cat -- --all
```

### Step 3: Clean Up Repository

```bash
# Remove filter-branch backup refs
rm -rf .git/refs/original/

# Expire reflog entries
git reflog expire --expire=now --all

# Garbage collect and compress
git gc --prune=now --aggressive
```

### Step 4: Verify Files Are Gone

```bash
# Check if keys/ still exists in history
git log --all --full-history --diff-filter=A --summary -- keys/

# Check if .pem files still exist
git log --all --full-history --diff-filter=A --summary -- "*.pem"

# Check if .env files still exist
git log --all --full-history --diff-filter=A --summary -- .env

# Should return no results
```

### Step 5: Force Push to GitHub

```bash
# ⚠️ WARNING: This overwrites GitHub history
# Notify team members BEFORE running this!

# Push all branches
git push origin --force --all

# Push all tags
git push origin --force --tags
```

---

## 🚀 METHOD 3: Using BFG Repo-Cleaner (Fastest)

BFG is faster and simpler than `git filter-branch`, but requires Java.

### Install BFG

```bash
# Download BFG (macOS with Homebrew)
brew install bfg

# Or download manually from:
# https://rtyley.github.io/bfg-repo-cleaner/
```

### Run BFG

```bash
# Create backup first
git clone --mirror . "../luno-toys-backup-$(date +%Y%m%d)"

# Remove folders from history
bfg --delete-folders keys

# Remove files by pattern
bfg --delete-files "*.pem"
bfg --delete-files ".env"
bfg --delete-files "google-services.json"
bfg --delete-files "GoogleService-Info.plist"

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
git push origin --force --tags
```

---

## ✅ After Cleanup Checklist

Once you've cleaned git history and force pushed:

### 1. Rotate ALL Credentials Immediately

Your old credentials are compromised because they were in git. Rotate:

- [ ] **Firebase API Key** (Create new project or regenerate keys)
  - Go to: [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts

- [ ] **Private Keys** (Regenerate `.pem` files)
  - Delete old keys
  - Generate new key pairs
  - Update services that use them

- [ ] **Any Other Secrets** that were committed

### 2. Create `.env` File (Not Committed)

```bash
# Create .env with NEW credentials
cat > .env << 'EOF'
# NEW Firebase Configuration (after rotation)
EXPO_PUBLIC_FIREBASE_API_KEY=<NEW_API_KEY>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<NEW_AUTH_DOMAIN>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<NEW_PROJECT_ID>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<NEW_STORAGE_BUCKET>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<NEW_SENDER_ID>
EXPO_PUBLIC_FIREBASE_APP_ID=<NEW_APP_ID>
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=<NEW_MEASUREMENT_ID>
EOF

# Verify .env is NOT tracked
git status
# Should NOT show .env (it's in .gitignore)
```

### 3. Update `src/lib/firebase.ts`

Replace hardcoded credentials with environment variables:

```typescript
import Constants from "expo-constants";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error("Firebase configuration missing. Check .env file.");
}
```

### 4. Commit and Push Fixed Code

```bash
# Add updated files
git add src/lib/firebase.ts .gitignore

# Commit (firebase.ts now uses env vars, .gitignore protects .env)
git commit -m "Security: Move Firebase credentials to environment variables

- Update firebase.ts to read from .env
- Enhanced .gitignore to protect sensitive files
- Credentials now in .env (not committed)"

# Push (safe now)
git push origin main
```

### 5. Notify Team Members

Send this message to your team:

```
🚨 IMPORTANT: Git History Rewritten

The repository history has been cleaned to remove sensitive credentials.

ACTION REQUIRED:
1. Delete your local clone:
   cd .. && rm -rf luno-toys-mobile

2. Re-clone the repository:
   git clone git@github.com:rhkrohan/luno-mobile-app.git
   cd luno-toys-mobile

3. Create .env file with NEW credentials:
   [Share .env contents securely - use 1Password, not email!]

4. Install dependencies:
   npm install

DO NOT try to pull or merge your old local repository!
```

### 6. Monitor for Suspicious Activity

- [ ] Check Firebase Console for unusual activity
- [ ] Review Firebase Authentication logs
- [ ] Monitor Firestore usage metrics
- [ ] Set up Firebase alerts for quota usage

---

## 🔍 Verification Commands

After cleanup, verify everything is clean:

```bash
# 1. Check local repository status
git status
# Should be clean, .env should NOT appear

# 2. Verify .env is ignored
git check-ignore -v .env
# Should show: .gitignore:34:.env	.env

# 3. Check for any sensitive files in history
git log --all --oneline --name-only | grep -E "\.env$|\.pem$|keys/"
# Should return nothing

# 4. Verify what's tracked
git ls-files | grep -E "\.env|\.pem|keys/"
# Should only show .env.example (if anything)

# 5. Check remote repository
git ls-remote --heads origin
# Verify all branches are pushed
```

---

## 🆘 Troubleshooting

### Problem: "refusing to merge unrelated histories"

**Solution:** Team members must DELETE and re-clone, not pull:
```bash
cd .. && rm -rf luno-toys-mobile
git clone git@github.com:rhkrohan/luno-mobile-app.git
```

### Problem: "filter-branch: command not found"

**Solution:** Update git:
```bash
brew upgrade git
# Or use BFG method instead
```

### Problem: Files still showing up in history

**Solution:** Run verification command:
```bash
git log --all --full-history -- keys/
```
If files still appear, re-run cleanup commands.

### Problem: Can't push - "Updates were rejected"

**Solution:** Use `--force` flag (this is expected):
```bash
git push origin --force --all
```

### Problem: Already pushed secrets to GitHub

**Solution:**
1. Run this cleanup immediately
2. Rotate ALL credentials
3. Check GitHub for forks/clones of your repo
4. Consider making repo private temporarily

---

## 📋 Quick Command Reference

```bash
# Create backup
git clone --mirror . "../backup-$(date +%Y%m%d)"

# Check what's in git history
git log --all --full-history --summary -- path/to/file

# Remove file from all history
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch path/to/file' \
  --prune-empty -- --all

# Clean up after filter-branch
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Verify file is gone
git log --all -- path/to/file  # Should be empty

# Force push to remote
git push origin --force --all
git push origin --force --tags
```

---

## 🔐 Prevention - Never Let This Happen Again

### 1. Install Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run check-secrets"
```

Add to `package.json`:
```json
{
  "scripts": {
    "check-secrets": "git diff --cached --name-only -z | xargs -0 grep -l 'AIzaSy\\|sk-\\|-----BEGIN' && echo '⚠️ Secrets detected!' && exit 1 || exit 0"
  }
}
```

### 2. Use git-secrets

```bash
# Install git-secrets
brew install git-secrets

# Set up in repo
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'AIzaSy[0-9A-Za-z-_]{33}'
git secrets --add 'FIREBASE_[A-Z_]*=[^\s]+'
```

### 3. Always Use .env for Secrets

```bash
# Good ✅
FIREBASE_API_KEY=process.env.EXPO_PUBLIC_FIREBASE_API_KEY

# Bad ❌
FIREBASE_API_KEY="AIzaSyAbc123..."
```

### 4. Use .env.example as Template

```bash
# .env.example (safe to commit)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here

# .env (NEVER commit)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123RealKey
```

---

## 📧 Questions or Issues?

If you encounter problems during cleanup:

**Email:** auracampusapp@gmail.com

---

## 📚 Additional Resources

- [GitHub: Remove Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Branch](https://git-scm.com/docs/git-filter-branch)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)

---

**Last Updated:** December 24, 2025
**Status:** Ready to use
**Critical:** Run before making repository public!
