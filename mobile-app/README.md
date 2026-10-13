# Luno Toys Mobile App

**Version:** 2.0.0
**Platform:** iOS & Android
**Framework:** React Native (Expo)

<div align="center">

🧸 **Smart Plushie Companion App for Parents** 🧸

Control, monitor, and manage your child's Luno smart toy experiences

</div>

---

## 📱 About

**Luno Toys** is a parental control and monitoring application designed for parents to manage their children's interactions with Luno smart plushie toys. The app provides:

- 🎮 **Toy Management** - Pair and configure Luno smart toys via Bluetooth and WiFi
- 👨‍👩‍👧 **Child Profiles** - Create and manage profiles for multiple children
- 💬 **Conversation Monitoring** - Review AI-powered conversations between children and toys
- 🛡️ **Parental Controls** - Set content filters, time limits, and safety alerts
- 📊 **Activity Timeline** - Track engagement patterns and flagged content
- ⚙️ **Safety Features** - Automated content filtering and parental alerts

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (Xcode on macOS) or **Android Emulator** (Android Studio)
- **Firebase project** with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luno-toys-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Email/Password authentication
   - Create Firestore database
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Update `src/lib/firebase.ts` with your Firebase config

4. **Run the app**
   ```bash
   # iOS Simulator
   npm run ios

   # Android Emulator
   npm run android

   # Expo Go (Development)
   npm start
   ```

---

## 📚 Documentation

All project documentation is located in the **[`docs/`](./docs)** directory:

| Document | Description |
|----------|-------------|
| **[Quick Start Guide](./docs/QUICK_START.md)** | Step-by-step setup and configuration |
| **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** | Architecture and technical overview |
| **[Firestore Structure](./docs/FIRESTORE_STRUCTURE.md)** | Database schema and data models |
| **[Firestore Data Flow](./docs/FIRESTORE_DATA_FLOW.md)** | Data flow and CRUD operations |
| **[Cloud Functions Setup](./docs/CLOUD_FUNCTIONS_SETUP.md)** | Firebase Cloud Functions configuration |
| **[Privacy Policy](./docs/privacy_policy.md)** | App privacy policy (user-facing) |
| **[Terms & Conditions](./docs/terms_and_conditions.md)** | Legal terms of service (user-facing) |

👉 **New to the project?** Start with **[`docs/README.md`](./docs/README.md)** for a documentation overview.

---

## 🏗️ Tech Stack

### Frontend
- **React Native** 0.81.5 - Mobile framework
- **Expo** ~54.0 - Development platform
- **TypeScript** ~5.9 - Type safety
- **React Navigation** ^7.1 - Navigation system

### Backend & Services
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Cloud database
- **Firebase Cloud Functions** - Backend logic
- **React Native BLE PLX** ^3.2 - Bluetooth Low Energy

### UI & Styling
- **Expo Linear Gradient** - Gradient backgrounds
- **Custom Responsive System** - Adaptive layouts
- **Ionicons** - Icon library

---

## 📁 Project Structure

```
luno-toys-mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React Context providers (Auth, etc.)
│   ├── screens/             # App screens/pages
│   ├── navigation/          # Navigation configuration
│   ├── lib/                 # Firebase and external services
│   ├── services/            # BLE, toy pairing services
│   ├── constants/           # Theme, colors, spacing
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── assets/                  # Images, icons, fonts
├── functions/               # Firebase Cloud Functions
├── docs/                    # 📚 All project documentation
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

---

## 🔑 Key Features

### 1. **Multi-Child Management**
- Create profiles for multiple children
- Assign toys to specific children
- Individual parental control settings per child

### 2. **Bluetooth & WiFi Setup**
- Scan and pair Luno toys via Bluetooth
- Configure WiFi credentials on toys
- Real-time connection status monitoring

### 3. **Conversation Monitoring**
- View full conversation transcripts
- AI-powered safety flagging system
- Parental review of flagged content
- Configurable alert sensitivity levels

### 4. **Parental Controls**
- **Content Filters:** Block topics (violence, mature content, politics, religion)
- **Time Limits:** Set daily usage limits
- **Quiet Hours:** Schedule automatic toy downtime
- **Creative Mode:** Toggle free-form vs. structured conversations

### 5. **Safety Alerts**
- Personal info sharing detection
- Inappropriate content detection
- Emotional distress indicators
- Unusual conversation patterns

---

## 🔐 Security & Privacy

- ✅ **COPPA Compliant** - Children's Online Privacy Protection Act
- ✅ **Data Encryption** - All data encrypted in transit (HTTPS/TLS)
- ✅ **Parental Consent** - Required for all child data collection
- ✅ **User Control** - In-app data deletion capabilities
- ✅ **No Advertising** - No behavioral advertising or data selling
- ✅ **Secure Authentication** - Firebase Auth with email/password

See [`docs/privacy_policy.md`](./docs/privacy_policy.md) for full details.

---

## 🎨 Design System

- **Dark Theme:** Black background (#000) with golden accents (#FDBD4B)
- **Starry Background:** Animated star field for immersive experience
- **Gradient Cards:** Linear gradients with golden borders
- **Responsive Typography:** Scales across device sizes
- **Accessible UI:** High contrast, clear hierarchy

---

## 📱 Supported Platforms

| Platform | Minimum Version | Status |
|----------|----------------|--------|
| **iOS** | 12.0+ | ✅ Supported |
| **Android** | API 21+ (5.0 Lollipop) | ✅ Supported |

---

## 🧪 Development

### Available Scripts

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser (limited functionality)
```

### Environment Variables

Create a `.env` file (not tracked in git) for sensitive configuration:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Bluetooth not working on iOS**
- Ensure `Info.plist` has Bluetooth permissions (`NSBluetoothAlwaysUsageDescription`)
- Location permission required for BLE scanning on iOS

**2. Firestore permissions error**
- Check Firestore security rules
- Ensure user is authenticated before accessing data

**3. WiFi setup fails**
- Verify SSID and password are correct
- Check that toy is in pairing mode (LED indicator)

See [`docs/QUICK_START.md`](./docs/QUICK_START.md) for more troubleshooting tips.

---

## 📄 License

This project is proprietary and confidential. All rights reserved by LUNO.

---

## 📧 Support

For questions, issues, or support:

**Email:** auracampusapp@gmail.com

---

## 🙏 Acknowledgments

- **Firebase** - Backend infrastructure
- **Expo** - Mobile development platform
- **React Native Community** - Open source contributions

---

## 🗺️ Roadmap

- [ ] Push notifications for safety alerts
- [ ] Multi-language support (Spanish, French)
- [ ] Voice message playback in timeline
- [ ] Export conversation history (PDF/CSV)
- [ ] Analytics dashboard for child development insights
- [ ] Toy firmware OTA updates

---

**Built with ❤️ for safer, smarter play**

*Last updated: December 24, 2025*
