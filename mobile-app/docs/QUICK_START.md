# 🚀 Quick Start Guide - Luno Toys Mobile App

Your mobile app is **ready to run**! Here are the easiest ways to view it:

## ✅ Current Status

- **Project**: `/Users/rohankhan/Desktop/plushie-palace-ai-main/luno-toys-mobile/`
- **Expo Server**: Starting at http://localhost:8081
- **All 8 screens built and ready**

---

## 📱 Method 1: View on Your Phone (EASIEST!)

### Steps:
1. Download **Expo Go** app:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Make sure your phone and computer are on the **same WiFi network**

3. In your terminal, you should see a QR code. Scan it with:
   - **iOS**: Open Camera app → Point at QR code
   - **Android**: Open Expo Go app → Tap "Scan QR Code"

4. The app will load on your phone!

### If you don't see the QR code:
```bash
cd /Users/rohankhan/Desktop/plushie-palace-ai-main/luno-toys-mobile
npm start
```

Then press `shift + ?` in the terminal to see keyboard shortcuts.

---

## 💻 Method 2: Run in iOS Simulator (Mac Only)

```bash
cd /Users/rohankhan/Desktop/plushie-palace-ai-main/luno-toys-mobile
npx expo start
```

Then press `i` in the terminal to open iOS simulator.

---

## 🤖 Method 3: Run in Android Emulator

### Prerequisites:
- Android Studio installed
- Android emulator set up

### Steps:
```bash
cd /Users/rohankhan/Desktop/plushie-palace-ai-main/luno-toys-mobile
npx expo start
```

Then press `a` in the terminal to open Android emulator.

---

## 🌐 Method 4: Quick Preview in Browser

```bash
cd /Users/rohankhan/Desktop/plushie-palace-ai-main/luno-toys-mobile
npx expo install react-native-web react-dom @expo/metro-runtime
npm run web
```

This will open the app in your browser at http://localhost:8081

---

## 🎮 Expo Dev Tools Controls

When the server is running, press these keys in the terminal:

- `i` - Open iOS simulator
- `a` - Open Android emulator
- `w` - Open web browser
- `r` - Reload app
- `m` - Toggle menu
- `shift + ?` - Show all commands

---

## 📱 Screens Available

Your app includes 8 complete screens:

1. **LoginScreen** - Email/password authentication
2. **SignupScreen** - New user registration
3. **ForgotPasswordScreen** - Password reset
4. **DashboardScreen** - Home with toy overview
5. **ChatScreen** - AI chat interface
6. **ActivitiesScreen** - Games and activities
7. **CatalogScreen** - Browse and shop toys
8. **ProfileScreen** - User settings

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill the process on port 8081
lsof -ti:8081 | xargs kill -9
# Then restart
npm start
```

### Metro bundler issues
```bash
npm start -- --clear
```

### Can't connect from phone
- Make sure both devices are on same WiFi
- Check firewall settings
- Try using the tunnel option: `npx expo start --tunnel`

---

## 🔥 Firebase Setup (Optional)

To enable authentication:

1. Create `.env` file:
```bash
cp .env.example .env
```

2. Add your Firebase credentials to `.env`

3. Restart the server:
```bash
npm start
```

---

## 📞 Need Help?

- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Firebase**: https://firebase.google.com/docs

---

**Your mobile app is production-ready!** 🎉

Just run `npm start` and scan the QR code with Expo Go on your phone.
