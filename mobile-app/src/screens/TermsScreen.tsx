// src/screens/TermsScreen.tsx
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

export default function TermsScreen({ navigation }: any) {
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

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
            <Text style={styles.kicker}>LEGAL</Text>
            <Text style={styles.pageTitle}>Terms & Conditions</Text>
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
              <Text style={styles.lastUpdated}>
                Last updated: December 24, 2025 • Version 1.0
              </Text>

              <Text style={styles.important}>
                IMPORTANT - PLEASE READ CAREFULLY
              </Text>

              <Text style={styles.intro}>
                These Terms and Conditions ("Terms", "Agreement") constitute a
                legally binding agreement between you and LUNO governing your
                use of the LUNO mobile application and LUNO smart toy hardware
                devices.
              </Text>

              <Text style={styles.highlight}>
                BY CREATING AN ACCOUNT OR USING LUNO SERVICES, YOU ACKNOWLEDGE
                THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE
                TERMS.
              </Text>

              {/* Section 1 - Acceptance */}
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>

              <Text style={styles.subsectionTitle}>1.1 Binding Agreement</Text>
              <Text style={styles.body}>
                By accessing or using the LUNO App or LUNO Toys, you agree to
                comply with and be bound by these Terms, our Privacy Policy, and
                all applicable laws and regulations.
              </Text>

              <Text style={styles.subsectionTitle}>1.2 Age Requirement</Text>
              <Text style={styles.body}>
                You must be at least 18 years of age to create an account and
                use LUNO services. By creating an account, you represent that you
                are at least 18 years old.
              </Text>

              <Text style={styles.subsectionTitle}>
                1.3 Parental Responsibility
              </Text>
              <Text style={styles.body}>
                As a parent or legal guardian, you acknowledge that you are
                solely responsible for:
              </Text>
              <Text style={styles.bullet}>
                • Supervising your child's use of LUNO Toys
              </Text>
              <Text style={styles.bullet}>
                • Creating and managing child profiles
              </Text>
              <Text style={styles.bullet}>
                • Setting appropriate parental controls
              </Text>
              <Text style={styles.bullet}>
                • Reviewing conversation content
              </Text>
              <Text style={styles.bullet}>• Ensuring age-appropriate usage</Text>

              {/* Section 2 - Service */}
              <Text style={styles.sectionTitle}>2. Service Description</Text>
              <Text style={styles.body}>LUNO provides:</Text>
              <Text style={styles.bullet}>
                • A mobile application for iOS and Android devices
              </Text>
              <Text style={styles.bullet}>
                • Smart plushie toy hardware with AI-powered conversation
                capabilities
              </Text>
              <Text style={styles.bullet}>
                • Cloud-based services for conversation storage and parental
                monitoring
              </Text>
              <Text style={styles.bullet}>
                • WiFi and Bluetooth connectivity features for device pairing
              </Text>
              <Text style={styles.bullet}>
                • Parental control and safety monitoring tools
              </Text>

              <Text style={styles.subsectionTitle}>Service Availability</Text>
              <Text style={styles.body}>
                We do not guarantee uninterrupted or error-free service. We
                reserve the right to modify, suspend, or discontinue any aspect
                of the service at any time.
              </Text>

              {/* Section 3 - Account */}
              <Text style={styles.sectionTitle}>
                3. Account Creation and Security
              </Text>
              <Text style={styles.body}>You are responsible for:</Text>
              <Text style={styles.bullet}>
                • Maintaining the confidentiality of your account credentials
              </Text>
              <Text style={styles.bullet}>
                • All activities that occur under your account
              </Text>
              <Text style={styles.bullet}>
                • Notifying LUNO immediately of any unauthorized access
              </Text>
              <Text style={styles.bullet}>
                • Not sharing your account credentials with others
              </Text>

              {/* Section 4 - Hardware */}
              <Text style={styles.sectionTitle}>
                4. LUNO Toys - Hardware Usage
              </Text>

              <Text style={styles.subsectionTitle}>
                4.1 Device Pairing and WiFi
              </Text>
              <Text style={styles.body}>
                By pairing a LUNO Toy with your account, you acknowledge that:
              </Text>
              <Text style={styles.bullet}>
                • Your WiFi password will be transmitted to and stored on the
                physical toy device
              </Text>
              <Text style={styles.bullet}>
                • Your email address will be stored on the toy for backend
                authentication
              </Text>
              <Text style={styles.bullet}>
                • The toy will connect to LUNO's backend services via your WiFi
                network
              </Text>
              <Text style={styles.bullet}>
                • You are responsible for maintaining the security of your WiFi
                network
              </Text>

              <Text style={styles.subsectionTitle}>
                4.2 Toy Usage and Supervision
              </Text>
              <Text style={styles.highlight}>
                LUNO Toys are designed for children under parental supervision.
                You will supervise your child's interactions with the toy. LUNO
                Toys are not a substitute for parental care or supervision.
              </Text>

              <Text style={styles.subsectionTitle}>4.3 Prohibited Uses</Text>
              <Text style={styles.body}>You agree NOT to:</Text>
              <Text style={styles.bullet}>
                • Attempt to hack, modify, or reverse engineer the toy
              </Text>
              <Text style={styles.bullet}>
                • Use the toy to collect information from children without
                parental consent
              </Text>
              <Text style={styles.bullet}>
                • Share access to your toy with unauthorized third parties
              </Text>
              <Text style={styles.bullet}>
                • Attempt to bypass safety features or parental controls
              </Text>

              {/* Section 5 - User Content */}
              <Text style={styles.sectionTitle}>
                5. User Content and Conversations
              </Text>
              <Text style={styles.body}>By using LUNO services, you acknowledge that:</Text>
              <Text style={styles.bullet}>
                • Conversations between your child and the toy are transmitted to
                LUNO's servers
              </Text>
              <Text style={styles.bullet}>
                • Conversation data is processed by AI services to generate
                responses
              </Text>
              <Text style={styles.bullet}>
                • Conversations may be stored for parental review (if enabled)
              </Text>
              <Text style={styles.bullet}>
                • You can enable or disable conversation recording at any time
              </Text>

              {/* Section 6 - IP */}
              <Text style={styles.sectionTitle}>
                6. Intellectual Property Rights
              </Text>
              <Text style={styles.body}>
                All content, features, and functionality of LUNO services,
                including software, code, algorithms, text, graphics, logos, AI
                models, and trademarks are owned by LUNO and protected by
                intellectual property laws.
              </Text>

              <Text style={styles.subsectionTitle}>Limited License</Text>
              <Text style={styles.body}>
                LUNO grants you a limited, non-exclusive, non-transferable,
                revocable license to use the App and LUNO Toys for personal,
                non-commercial use.
              </Text>

              {/* Section 7 - Privacy */}
              <Text style={styles.sectionTitle}>
                7. Privacy and Data Protection
              </Text>
              <Text style={styles.body}>
                Our Privacy Policy is incorporated into these Terms. We comply
                with the Children's Online Privacy Protection Act (COPPA) and do
                not knowingly collect personal information from children without
                parental consent.
              </Text>

              {/* Section 8 - Disclaimers */}
              <Text style={styles.sectionTitle}>
                8. Disclaimers and Limitation of Liability
              </Text>

              <Text style={styles.important}>
                LUNO SERVICES AND TOYS ARE PROVIDED "AS IS" AND "AS AVAILABLE"
                WITHOUT WARRANTIES OF ANY KIND.
              </Text>

              <Text style={styles.subsectionTitle}>AI Content Disclaimer</Text>
              <Text style={styles.body}>You acknowledge that:</Text>
              <Text style={styles.bullet}>
                • AI-generated responses may contain errors or inaccuracies
              </Text>
              <Text style={styles.bullet}>
                • LUNO does not guarantee the appropriateness of all AI responses
              </Text>
              <Text style={styles.bullet}>
                • Parents should actively monitor conversations
              </Text>
              <Text style={styles.bullet}>
                • LUNO is not responsible for AI-generated content that may be
                inappropriate
              </Text>

              <Text style={styles.subsectionTitle}>Limitation of Liability</Text>
              <Text style={styles.important}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUNO SHALL NOT BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES. IN NO EVENT SHALL LUNO'S TOTAL LIABILITY EXCEED $100.
              </Text>

              <Text style={styles.subsectionTitle}>
                Parental Responsibility
              </Text>
              <Text style={styles.important}>
                YOU ACKNOWLEDGE THAT YOU ARE SOLELY RESPONSIBLE FOR SUPERVISING
                YOUR CHILD'S USE OF LUNO TOYS. LUNO IS NOT LIABLE FOR HARM
                RESULTING FROM LACK OF PARENTAL SUPERVISION.
              </Text>

              {/* Section 9 - Indemnification */}
              <Text style={styles.sectionTitle}>9. Indemnification</Text>
              <Text style={styles.body}>
                You agree to indemnify, defend, and hold harmless LUNO from any
                claims, liabilities, damages, losses, or expenses arising from:
              </Text>
              <Text style={styles.bullet}>• Your violation of these Terms</Text>
              <Text style={styles.bullet}>
                • Your use of LUNO services or toys
              </Text>
              <Text style={styles.bullet}>
                • Your child's use of LUNO Toys
              </Text>
              <Text style={styles.bullet}>
                • Unauthorized access to your account due to your failure to
                maintain security
              </Text>

              {/* Section 10 - Termination */}
              <Text style={styles.sectionTitle}>10. Termination</Text>
              <Text style={styles.body}>
                You may terminate your account at any time using the "Delete
                account" feature in the App. LUNO may terminate your account
                immediately if you breach these Terms.
              </Text>

              {/* Section 11 - Dispute Resolution */}
              <Text style={styles.sectionTitle}>
                11. Dispute Resolution and Governing Law
              </Text>
              <Text style={styles.body}>
                These Terms shall be governed by the laws of the United States.
                All disputes will be resolved through binding arbitration. You
                waive your right to a jury trial and class action lawsuits.
              </Text>

              {/* Section 12 - General */}
              <Text style={styles.sectionTitle}>12. General Provisions</Text>
              <Text style={styles.body}>
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and LUNO. LUNO may modify these
                Terms at any time with notice.
              </Text>

              {/* Final Acknowledgment */}
              <Text style={styles.sectionTitle}>13. Acknowledgment</Text>
              <Text style={styles.highlight}>
                BY CREATING AN ACCOUNT OR USING LUNO SERVICES, YOU ACKNOWLEDGE
                THAT YOU HAVE READ AND UNDERSTOOD THESE TERMS, AGREE TO BE BOUND
                BY THEM, ARE AT LEAST 18 YEARS OF AGE, AND WILL SUPERVISE YOUR
                CHILD'S USE OF LUNO TOYS.
              </Text>

              <Text style={styles.important}>
                THESE TERMS CONTAIN A BINDING ARBITRATION CLAUSE AND CLASS ACTION
                WAIVER. THEY AFFECT YOUR LEGAL RIGHTS. PLEASE READ THEM
                CAREFULLY.
              </Text>

              {/* Contact */}
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.contact}>LUNO</Text>
              <Text style={styles.contact}>
                Email:{" "}
                <Text style={styles.email}>auracampusapp@gmail.com</Text>
              </Text>
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
    lineHeight: rt.fontSize.sm * 1.5,
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
    lineHeight: rt.fontSize.sm * 1.5,
    marginBottom: rs[2],
  },

  bullet: {
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    lineHeight: rt.fontSize.sm * 1.5,
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
    fontWeight: "900",
    color: "#FDBD4B",
    lineHeight: rt.fontSize.sm * 1.5,
    marginTop: rs[2],
    marginBottom: rs[4],
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  important: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,100,100,0.95)",
    lineHeight: rt.fontSize.sm * 1.5,
    marginBottom: rs[4],
    marginTop: rs[2],
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  contact: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    lineHeight: rt.fontSize.sm * 1.5,
    marginBottom: rs[1],
  },
});
