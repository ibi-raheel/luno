// src/screens/HelpScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
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

export default function HelpScreen({ navigation }: any) {
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  const handleContactSupport = () => {
    Linking.openURL("mailto:auracampusapp@gmail.com");
  };

  return (
    <View style={styles.container}>
      <StarryBackground />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header with back button */}
        <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={scaleSize(24)} color="#FDBD4B" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>SUPPORT</Text>
            <Text style={styles.pageTitle}>Help & Support</Text>
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
              <Text style={styles.sectionTitle}>Contact Support</Text>
              <Text style={styles.body}>
                Need help with your Luno Toys app? Our support team is here to
                assist you.
              </Text>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactSupport}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="mail-outline"
                  size={scaleSize(20)}
                  color="#0B0B0D"
                  style={{ marginRight: rs[2] }}
                />
                <Text style={styles.contactButtonText}>Email Support</Text>
              </TouchableOpacity>

              <Text style={styles.email}>auracampusapp@gmail.com</Text>

              <Text style={styles.sectionTitle}>Common Questions</Text>

              <View style={styles.faqItem}>
                <Text style={styles.question}>How do I pair my Luno Toy?</Text>
                <Text style={styles.answer}>
                  Go to Settings → Add new toy, then follow the on-screen
                  instructions to connect your toy via Bluetooth and set up WiFi.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.question}>
                  How do I delete my account?
                </Text>
                <Text style={styles.answer}>
                  Go to Settings → scroll to the bottom → tap "Delete account".
                  This will permanently delete all your data.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.question}>
                  Where can I view conversation history?
                </Text>
                <Text style={styles.answer}>
                  Go to Timeline or Safety tabs to view all conversations. You
                  can also view conversations from each child's profile page.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.question}>
                  How do I enable parental controls?
                </Text>
                <Text style={styles.answer}>
                  Go to Controls tab or Settings → Parental controls to manage
                  content filters, time limits, and safety settings for each
                  child.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>App Version</Text>
              <Text style={styles.version}>Luno Toys v2.0.0</Text>
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

  sectionTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FDBD4B",
    marginTop: rs[4],
    marginBottom: rs[3],
    letterSpacing: 0.2,
  },

  body: {
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    lineHeight: rt.fontSize.sm * 1.5,
    marginBottom: rs[4],
  },

  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDBD4B",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    marginBottom: rs[3],
  },

  contactButtonText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#0B0B0D",
  },

  email: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(253,189,75,0.85)",
    textAlign: "center",
    marginBottom: rs[3],
  },

  faqItem: {
    marginBottom: rs[4],
  },

  question: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    marginBottom: rs[2],
  },

  answer: {
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
    lineHeight: rt.fontSize.sm * 1.5,
  },

  version: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.60)",
  },
});
