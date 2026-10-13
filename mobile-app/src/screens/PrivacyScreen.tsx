// src/screens/PrivacyScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  typography,
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { LinearGradient } from "expo-linear-gradient";
import { StarryBackground } from "../components/StarryBackground";

export default function PrivacyScreen({ navigation }: any) {
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  return (
    <View style={styles.container}>
      <StarryBackground />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header with back button */}
        <View
          style={[styles.header, { paddingHorizontal: screenPadding }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons
              name="arrow-back"
              size={scaleSize(24)}
              color="#FDBD4B"
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>PRIVACY</Text>
            <Text style={styles.pageTitle}>Privacy Policy</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: screenPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#050506", "#1A1206", "rgba(253,189,75,0.15)"]}
            locations={[0, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.card}>
              <Text style={styles.lastUpdated}>Last updated: December 24, 2025</Text>

              <Text style={styles.intro}>
                This Data Privacy Policy explains how <Text style={styles.bold}>LUNO</Text> ("LUNO," "we," "our," "us") collects, uses, stores, protects, shares, and deletes information when you use the <Text style={styles.bold}>LUNO mobile application</Text> (the "App") and LUNO's designated hardware devices (the "LUNO Toys").
              </Text>

              <Text style={styles.intro}>
                We wrote this policy in clear language so it's easy to understand. If you have any questions, contact us at <Text style={styles.email}>auracampusapp@gmail.com</Text>.
              </Text>

              {/* Section 1 */}
              <Text style={styles.sectionTitle}>1. Scope & Definitions</Text>

              <Text style={styles.subsectionTitle}>1.1 What this policy covers</Text>
              <Text style={styles.body}>This policy applies to:</Text>
              <Text style={styles.bullet}>• The LUNO mobile app (iOS and Android)</Text>
              <Text style={styles.bullet}>• Hardware pairing, setup, and use with LUNO Toys</Text>
              <Text style={styles.bullet}>• Cloud services used by the App (including Firebase/Firestore and other infrastructure needed to operate the service)</Text>
              <Text style={styles.bullet}>• AI-powered features used to generate responses and experiences</Text>
              <Text style={styles.bullet}>• Data transmitted to and stored on LUNO Toy hardware devices</Text>

              <Text style={styles.subsectionTitle}>1.2 What this policy does not cover</Text>
              <Text style={styles.body}>This policy does not cover:</Text>
              <Text style={styles.bullet}>• Third-party sites/services you access from the App (their own policies apply)</Text>
              <Text style={styles.bullet}>• Apple's policies (e.g., iCloud, App Store, Apple ID), which are governed by Apple's terms</Text>

              {/* Section 2 - Data Collection */}
              <Text style={styles.sectionTitle}>2. Data We Collect</Text>
              <Text style={styles.body}>
                We collect information to run the App, connect to the hardware, and provide the features you expect. The exact data collected depends on which features you use.
              </Text>

              <Text style={styles.subsectionTitle}>2.1 Account & Authentication Data</Text>
              <Text style={styles.body}>Collected to allow you to sign in and secure your account.</Text>
              <Text style={styles.bullet}>• Email address (or login credential identifier)</Text>
              <Text style={styles.bullet}>• Account ID (internal identifier)</Text>
              <Text style={styles.bullet}>• Authentication tokens (used to keep you logged in securely)</Text>
              <Text style={styles.highlight}>
                We do not store your Apple ID password or other external provider passwords in LUNO.
              </Text>

              <Text style={styles.subsectionTitle}>2.2 Child / Family Data</Text>
              <Text style={styles.body}>Collected only if you choose to add it.</Text>
              <Text style={styles.bullet}>• Child profile name</Text>
              <Text style={styles.bullet}>• Birth date (MM/DD/YYYY format)</Text>
              <Text style={styles.bullet}>• Avatar/emoji selection</Text>
              <Text style={styles.bullet}>• Age level (preschool, elementary, upper)</Text>
              <Text style={styles.bullet}>• Gender (optional)</Text>
              <Text style={styles.bullet}>• Interests and preferences you set</Text>
              <Text style={styles.bullet}>• Assigned LUNO Toys associated with the child profile</Text>

              <Text style={styles.subsectionTitle}>Parental Control Settings:</Text>
              <Text style={styles.bullet}>• Daily time limit preferences</Text>
              <Text style={styles.bullet}>• Content filter settings and blocked topics</Text>
              <Text style={styles.bullet}>• Quiet hours schedules</Text>
              <Text style={styles.bullet}>• Alert preferences and sensitivity levels</Text>
              <Text style={styles.bullet}>• Conversation recording preference</Text>
              <Text style={styles.bullet}>• Creative mode settings</Text>

              <Text style={styles.subsectionTitle}>2.4 WiFi Network Configuration</Text>
              <Text style={styles.important}>
                IMPORTANT: During the initial setup of your LUNO Toy, the App collects and transmits WiFi network credentials to enable the toy to connect to the internet.
              </Text>
              <Text style={styles.body}>What we collect:</Text>
              <Text style={styles.bullet}>• WiFi network name (SSID)</Text>
              <Text style={styles.bullet}>• WiFi password</Text>
              <Text style={styles.bullet}>• Your email address (sent to the toy for backend authentication)</Text>
              <Text style={styles.bullet}>• List of available WiFi networks detected by the toy</Text>

              <Text style={styles.subsectionTitle}>Important security notes:</Text>
              <Text style={styles.bullet}>• WiFi passwords are transmitted securely over Bluetooth and are NOT stored in LUNO's cloud services</Text>
              <Text style={styles.bullet}>• WiFi passwords remain only on your local toy device</Text>
              <Text style={styles.bullet}>• The toy uses your email address to associate conversations and data with your account</Text>

              <Text style={styles.subsectionTitle}>2.5 Conversation & Interaction Data</Text>
              <Text style={styles.body}>
                Collected to provide conversation continuity and features like history and parental review.
              </Text>
              <Text style={styles.bullet}>• Full conversation transcripts (all messages between child and toy)</Text>
              <Text style={styles.bullet}>• Individual message content, sender, and timestamps</Text>
              <Text style={styles.bullet}>• Conversation metadata: start time, end time, duration, message count</Text>
              <Text style={styles.bullet}>• Safety and monitoring data (flagged conversations, severity levels, review status)</Text>
              <Text style={styles.highlight}>
                This data is only collected if you enable conversation recording in parental controls. You can disable this feature at any time.
              </Text>

              {/* Section 3 - How We Use Data */}
              <Text style={styles.sectionTitle}>3. How We Use Data</Text>
              <Text style={styles.body}>We use collected data only for the following purposes:</Text>
              <Text style={styles.bullet}>• Create and maintain your account</Text>
              <Text style={styles.bullet}>• Save your settings</Text>
              <Text style={styles.bullet}>• Discover and pair with a LUNO Toy using Bluetooth</Text>
              <Text style={styles.bullet}>• Process prompts and context required to generate AI responses</Text>
              <Text style={styles.bullet}>• Prevent unauthorized access and detect abuse</Text>
              <Text style={styles.bullet}>• Identify and fix bugs</Text>
              <Text style={styles.bullet}>• Respond to lawful requests and comply with legal obligations</Text>

              {/* Section 4 - Children's Privacy */}
              <Text style={styles.sectionTitle}>4. Children's Privacy</Text>
              <Text style={styles.body}>
                LUNO is intended for family use and may be used by children under parental supervision.
              </Text>
              <Text style={styles.subsectionTitle}>Our commitments:</Text>
              <Text style={styles.bullet}>• We do not knowingly collect personal data from children without parental/guardian involvement</Text>
              <Text style={styles.bullet}>• We do not sell children's data or personal information</Text>
              <Text style={styles.bullet}>• We do not use children's data for behavioral advertising</Text>
              <Text style={styles.bullet}>• Parents/guardians have full control over child profiles and conversation recording</Text>
              <Text style={styles.bullet}>• Parents can delete all child data at any time through the App</Text>

              {/* Section 5 - Data Deletion */}
              <Text style={styles.sectionTitle}>5. In-App Data Deletion & User Controls</Text>
              <Text style={styles.body}>
                LUNO provides in-app controls so you can delete your data without emailing support.
              </Text>
              <Text style={styles.subsectionTitle}>What happens when you delete your account:</Text>
              <Text style={styles.bullet}>• All child profiles and associated data are deleted</Text>
              <Text style={styles.bullet}>• All conversation history and messages are deleted</Text>
              <Text style={styles.bullet}>• All toy associations are removed</Text>
              <Text style={styles.bullet}>• Your user preferences and settings are deleted</Text>
              <Text style={styles.bullet}>• Aggregate statistics are removed</Text>

              {/* Section 6 - No Tracking or Advertising */}
              <Text style={styles.sectionTitle}>6. "Tracking" and Advertising</Text>
              <Text style={styles.body}>
                LUNO does not use your personal data for behavioral advertising across third-party apps or websites.
              </Text>
              <Text style={styles.subsectionTitle}>What we do NOT do:</Text>
              <Text style={styles.bullet}>• We do not sell personal data or children's information</Text>
              <Text style={styles.bullet}>• We do not use your data for cross-site tracking</Text>
              <Text style={styles.bullet}>• We do not share data with advertising networks</Text>
              <Text style={styles.bullet}>• We do not use location data for advertising purposes</Text>
              <Text style={styles.bullet}>• We do not create advertising profiles based on your child's conversations</Text>

              {/* Contact */}
              <Text style={styles.sectionTitle}>7. Contact Us</Text>
              <Text style={styles.body}>
                If you have questions about privacy or data practices, contact:
              </Text>
              <Text style={styles.contact}>LUNO</Text>
              <Text style={styles.contact}>Email: <Text style={styles.email}>auracampusapp@gmail.com</Text></Text>
            </View>
          </LinearGradient>

          {/* Extra bottom space */}
          <View style={{ height: scaleSize(100) }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    marginBottom: rs[3],
  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: rs[3],
  },
  kicker: {
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  pageTitle: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },

  // Content
  content: {
    paddingBottom: rs[6],
  },

  cardGradient: {
    borderRadius: rbr.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.24,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 5 },
    }),
  },

  card: {
    padding: rs[5],
  },

  lastUpdated: {
    fontSize: rt.fontSize.sm,
    fontWeight: "800",
    color: "rgba(253,189,75,0.85)",
    marginBottom: rs[4],
  },

  intro: {
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.80)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
    marginBottom: rs[4],
  },

  sectionTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FDBD4B",
    marginTop: rs[5],
    marginBottom: rs[3],
    letterSpacing: 0.2,
  },

  subsectionTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    marginTop: rs[4],
    marginBottom: rs[2],
    letterSpacing: 0.1,
  },

  body: {
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
    marginBottom: rs[2],
  },

  bullet: {
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
    marginBottom: rs[2],
    paddingLeft: rs[2],
  },

  bold: {
    fontWeight: "900",
    color: "#FFFFFF",
  },

  email: {
    color: "#FDBD4B",
    fontWeight: "800",
  },

  highlight: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(253,189,75,0.90)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
    marginTop: rs[2],
    marginBottom: rs[3],
    fontStyle: "italic",
  },

  important: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,160,160,0.95)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
    marginBottom: rs[3],
    marginTop: rs[2],
  },

  contact: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
    marginBottom: rs[1],
  },
});
