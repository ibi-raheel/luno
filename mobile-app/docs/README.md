# Luno Toys Mobile App - Documentation

Welcome to the Luno Toys documentation! This directory contains all technical and user-facing documentation for the Luno Toys mobile application.

---

## 📚 Documentation Index

### 🚀 Getting Started
Start here if you're new to the project or setting up the development environment.

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Quick Start Guide](./QUICK_START.md)** | Step-by-step setup and running the app | Developers |
| **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** | High-level architecture and technical decisions | Developers, Tech Leads |

---

### 🗄️ Database & Backend
Technical documentation for Firebase Firestore and Cloud Functions.

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Firestore Structure](./FIRESTORE_STRUCTURE.md)** | Complete database schema and data models | Backend Developers, Full-stack |
| **[Firestore Data Flow](./FIRESTORE_DATA_FLOW.md)** | Data flow patterns and CRUD operations | Backend Developers, Full-stack |
| **[Cloud Functions Setup](./CLOUD_FUNCTIONS_SETUP.md)** | Firebase Cloud Functions configuration | Backend Developers, DevOps |

---

### ⚖️ Legal & Compliance
User-facing legal documents and privacy policies.

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Privacy Policy](./privacy_policy.md)** | Data collection and privacy practices | End Users, Legal, Compliance |
| **[Terms & Conditions](./terms_and_conditions.md)** | Legal terms of service | End Users, Legal, Compliance |

---

## 📖 Reading Path by Role

### For New Developers
1. Start with [`QUICK_START.md`](./QUICK_START.md) - Get the app running locally
2. Read [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Understand the architecture
3. Review [`FIRESTORE_STRUCTURE.md`](./FIRESTORE_STRUCTURE.md) - Learn the data model
4. Study [`FIRESTORE_DATA_FLOW.md`](./FIRESTORE_DATA_FLOW.md) - Understand data operations

### For Backend Engineers
1. [`FIRESTORE_STRUCTURE.md`](./FIRESTORE_STRUCTURE.md) - Database schema
2. [`FIRESTORE_DATA_FLOW.md`](./FIRESTORE_DATA_FLOW.md) - Data operations
3. [`CLOUD_FUNCTIONS_SETUP.md`](./CLOUD_FUNCTIONS_SETUP.md) - Cloud Functions
4. [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Full technical context

### For Product/Legal Teams
1. [`privacy_policy.md`](./privacy_policy.md) - Privacy practices
2. [`terms_and_conditions.md`](./terms_and_conditions.md) - Legal terms
3. [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Feature overview

---

## 📝 Document Descriptions

### QUICK_START.md
**Purpose:** Get developers up and running quickly

**Contents:**
- Prerequisites and dependencies
- Firebase setup instructions
- Local development setup
- Running the app on iOS/Android
- Troubleshooting common issues
- Development workflow

**Use when:** Setting up the project for the first time or onboarding new developers.

---

### IMPLEMENTATION_SUMMARY.md
**Purpose:** Comprehensive technical overview of the entire application

**Contents:**
- Project architecture
- Technology stack details
- Feature implementations
- Screen-by-screen breakdown
- Component structure
- State management patterns
- Navigation flow
- Design system details
- Security implementations

**Use when:** Need to understand how the app works at a high level or making architectural decisions.

---

### FIRESTORE_STRUCTURE.md
**Purpose:** Complete database schema reference

**Contents:**
- Collection and document structure
- Data model definitions
- Field types and constraints
- Relationships between collections
- Security rules overview
- Indexing strategy

**Use when:** Adding new features that require database changes, or understanding data relationships.

---

### FIRESTORE_DATA_FLOW.md
**Purpose:** Detailed guide to data operations and flows

**Contents:**
- CRUD operation patterns
- Real-time listener implementations
- Data synchronization strategies
- User authentication flow
- Child profile management
- Toy pairing and connection flow
- Conversation storage and retrieval
- Safety flagging system
- Batch operations and transactions

**Use when:** Implementing features that interact with Firestore or debugging data flow issues.

---

### CLOUD_FUNCTIONS_SETUP.md
**Purpose:** Configure and deploy Firebase Cloud Functions

**Contents:**
- Cloud Functions setup
- Deployment instructions
- Environment variables
- Function triggers and schedules
- Testing strategies
- Monitoring and logging

**Use when:** Setting up backend logic, scheduled tasks, or server-side operations.

---

### privacy_policy.md
**Purpose:** User-facing privacy policy

**Contents:**
- Data collection practices
- How user data is used
- Children's privacy (COPPA compliance)
- WiFi credential handling
- Conversation data storage
- User rights and controls
- Third-party services
- Contact information

**Use when:** App Store submissions, legal compliance, or user inquiries about privacy.

**Displayed in:** App signup flow and Settings → Privacy & Data

---

### terms_and_conditions.md
**Purpose:** Legal terms of service

**Contents:**
- Legally binding agreement
- User responsibilities
- Parental supervision requirements
- Service limitations and disclaimers
- Liability limitations
- Intellectual property rights
- Account termination policies
- Dispute resolution and arbitration
- Privacy policy incorporation

**Use when:** App Store submissions, legal compliance, or user agreement requirements.

**Displayed in:** App signup flow

---

## 🔄 Document Maintenance

### Updating Documentation
When making changes to the app, update relevant documentation:

| Change Type | Documents to Update |
|-------------|-------------------|
| New feature | IMPLEMENTATION_SUMMARY.md, FIRESTORE_STRUCTURE.md (if DB changes) |
| Database schema change | FIRESTORE_STRUCTURE.md, FIRESTORE_DATA_FLOW.md |
| New screen | IMPLEMENTATION_SUMMARY.md |
| Privacy/data handling change | privacy_policy.md, IMPLEMENTATION_SUMMARY.md |
| Legal/terms change | terms_and_conditions.md |
| Setup/deployment change | QUICK_START.md, CLOUD_FUNCTIONS_SETUP.md |

### Version Control
- Always update "Last updated" dates in documents
- Document breaking changes clearly
- Keep version numbers in sync with `package.json` and `app.json`

---

## 🏗️ Project Context

### App Overview
Luno Toys is a **parental control and monitoring app** for smart plushie toys. Parents use the app to:
- Pair and configure Luno smart toys (Bluetooth + WiFi)
- Create and manage child profiles
- Monitor AI-powered conversations between children and toys
- Set parental controls (content filters, time limits, quiet hours)
- Review flagged conversations for safety concerns
- Track child engagement and activity timeline

### Technical Architecture
- **Frontend:** React Native + Expo + TypeScript
- **Backend:** Firebase (Auth + Firestore + Cloud Functions)
- **Hardware:** Bluetooth Low Energy (BLE) for toy pairing
- **Design:** Custom dark theme with responsive layout system

### Key Technologies
```json
{
  "framework": "React Native 0.81.5",
  "platform": "Expo ~54.0",
  "language": "TypeScript ~5.9",
  "database": "Firebase Firestore",
  "auth": "Firebase Authentication",
  "backend": "Firebase Cloud Functions",
  "bluetooth": "React Native BLE PLX ^3.2",
  "navigation": "React Navigation ^7.1"
}
```

---

## 🔗 External Resources

### Firebase Documentation
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)

### React Native
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

### Development Tools
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Native BLE PLX](https://github.com/dotintent/react-native-ble-plx)

---

## 📧 Documentation Support

If you have questions about the documentation or need clarification:

**Email:** auracampusapp@gmail.com

---

## 📋 Quick Reference

### File Locations
```
docs/
├── README.md                      # This file - Documentation index
├── QUICK_START.md                 # Setup and getting started
├── IMPLEMENTATION_SUMMARY.md      # Architecture and features
├── FIRESTORE_STRUCTURE.md         # Database schema
├── FIRESTORE_DATA_FLOW.md         # Data operations
├── CLOUD_FUNCTIONS_SETUP.md       # Cloud Functions
├── privacy_policy.md              # Privacy policy (user-facing)
└── terms_and_conditions.md        # Terms of service (user-facing)
```

### Common Tasks

| Task | Start Here |
|------|-----------|
| Setup dev environment | [`QUICK_START.md`](./QUICK_START.md) |
| Add new feature | [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) + [`FIRESTORE_STRUCTURE.md`](./FIRESTORE_STRUCTURE.md) |
| Modify database | [`FIRESTORE_STRUCTURE.md`](./FIRESTORE_STRUCTURE.md) |
| Debug data issues | [`FIRESTORE_DATA_FLOW.md`](./FIRESTORE_DATA_FLOW.md) |
| Deploy Cloud Functions | [`CLOUD_FUNCTIONS_SETUP.md`](./CLOUD_FUNCTIONS_SETUP.md) |
| App Store submission | [`privacy_policy.md`](./privacy_policy.md) + [`terms_and_conditions.md`](./terms_and_conditions.md) |

---

**Documentation Version:** 2.0.0
**Last Updated:** December 24, 2025

