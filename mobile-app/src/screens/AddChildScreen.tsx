// src/screens/AddChildScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  typography,
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";
import { LinearGradient } from "expo-linear-gradient";

type AddChildStep =
  | "intro"
  | "name"
  | "birth-date"
  | "avatar"
  | "controls"
  | "success";

const infoIcon = require("../../assets/screentime_icon.png");

// Keep emojis, but remove unicorn (professional + on-brand)
const avatarOptions = ["👦", "👧", "🧒", "👶", "🐻", "🦁", "🐨", "🦊"];

const ageLevels = [
  { id: "preschool", label: "Preschool", subtitle: "3–5 years" },
  { id: "elementary", label: "Early Elementary", subtitle: "6–8 years" },
  { id: "upper", label: "Upper Elementary", subtitle: "9–12 years" },
];

function GradientCard({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[
        "rgba(253,189,75,0.22)",
        "rgba(255,255,255,0.10)",
        "rgba(0,0,0,0.30)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardInner}>{children}</View>
    </LinearGradient>
  );
}

function SectionHeader({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        {!!kicker && <Text style={styles.sectionKicker}>{kicker}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

export default function AddChildScreen({ navigation }: any) {
  const [step, setStep] = useState<AddChildStep>("intro");
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("👶");
  const [ageLevel, setAgeLevel] = useState<string>("elementary");
  const [dailyLimit, setDailyLimit] = useState<string>("2");
  const [saving, setSaving] = useState(false);
  const isCreatingChild = useRef(false);

  const { currentUser, isDemoMode } = useAuth();
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  const handleNameConfirm = () => {
    if (!childName.trim()) {
      Alert.alert("Name Required", "Please enter your child's name.");
      return;
    }
    setStep("birth-date");
  };

  const handleBirthDateConfirm = () => {
    if (!birthDate.trim()) {
      Alert.alert("Date Required", "Please enter your child's date of birth.");
      return;
    }
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(birthDate)) {
      Alert.alert("Invalid Date", "Please enter date in MM/DD/YYYY format.");
      return;
    }
    setStep("avatar");
  };

  const handleControlsConfirm = async () => {
    if (isCreatingChild.current) return;

    if (!childName.trim()) {
      Alert.alert("Missing Info", "Please enter your child's name.");
      setStep("name");
      return;
    }

    isCreatingChild.current = true;

    try {
      setSaving(true);

      if (!isDemoMode) {
        if (!currentUser) {
          Alert.alert(
            "Not Signed In",
            "We couldn't find your account. Please log in again."
          );
          return;
        }

        const childrenRef = collection(
          db,
          "users",
          currentUser.uid,
          "children"
        );

        const newChildDoc = await addDoc(childrenRef, {
          name: childName.trim(),
          birthDate,
          avatar: selectedAvatar,
          ageLevel,
          dailyLimitHours: Number(dailyLimit),
          createdAt: serverTimestamp(),

          contentFilterEnabled: true,
          quietHoursEnabled: false,
          dailyLimitEnabled: true,
          creativeModeEnabled: true,
          recordConversations: true,
          blockedTopics: {
            violence: true,
            matureContent: true,
            politics: false,
            religion: false,
            personalInfo: true,
          },
          alertTypes: {
            personalInfo: true,
            inappropriateContent: true,
            emotionalDistress: true,
            unusualPatterns: true,
          },
          alertSensitivity: "Medium",
        });

        // Auto-assign any unassigned toys to this child
        const toysRef = collection(db, "users", currentUser.uid, "toys");
        const toysSnapshot = await getDocs(toysRef);

        const updatePromises = toysSnapshot.docs
          .filter((toyDoc) => !toyDoc.data().assignedChildId)
          .map((toyDoc) =>
            updateDoc(toyDoc.ref, {
              assignedChildId: newChildDoc.id,
            })
          );

        await Promise.all(updatePromises);

        console.log(`Auto-assigned ${updatePromises.length} unassigned toys to ${childName}`);
      }

      setStep("success");
    } catch (error) {
      console.error("Error creating child profile:", error);
      Alert.alert(
        "Error",
        "We couldn't create this profile right now. Please try again."
      );
    } finally {
      setSaving(false);
      isCreatingChild.current = false;
    }
  };

  const handleFinish = async () => {
    if (!isDemoMode && currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(
          userDocRef,
          { onboardingCompleted: true },
          { merge: true }
        );
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error(
          "[AddChildScreen] Error setting onboardingCompleted:",
          err
        );
      }
    }

    // Navigate to Main screen - the AppNavigator will handle redirect since onboardingCompleted is now true
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Use navigate instead of replace to let the AppNavigator logic handle it
      navigation.navigate("Main" as never);
    }
  };

  const handleHeaderBack = () => {
    if (saving) return;

    if (step === "intro") {
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }
    if (step === "name") setStep("intro");
    else if (step === "birth-date") setStep("name");
    else if (step === "avatar") setStep("birth-date");
    else if (step === "controls") setStep("avatar");
    else if (step === "success") handleFinish();
    else setStep("intro");
  };

  return (
    <View style={styles.container}>
      <StarryBackground />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
            <TouchableOpacity
              onPress={handleHeaderBack}
              style={[styles.headerBtn, saving && { opacity: 0.6 }]}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Ionicons name="close" size={scaleSize(20)} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>CHILD PROFILE</Text>
              <Text style={styles.pageTitle}>Add child</Text>
              <Text style={styles.subTitle}>
                Build a profile for safer conversations and better parental
                controls.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Why do we ask this?",
                  "We use age and time limits to help keep content appropriate and build healthier routines."
                )
              }
            >
              <Image source={infoIcon} style={styles.headerIconImg} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingHorizontal: screenPadding },
            ]}
            contentInsetAdjustmentBehavior="automatic"
          >
            {/* INTRO */}
            {step === "intro" && (
              <>
                <SectionHeader kicker="SETUP" title="Create a child profile" />
                <GradientCard>
                  <View style={styles.block}>
                    <View style={styles.bigIconBubble}>
                      <Ionicons
                        name="person"
                        size={scaleSize(18)}
                        color="#FDBD4B"
                      />
                    </View>

                    <Text style={styles.blockTitle}>Quick, guided setup</Text>
                    <Text style={styles.blockBody}>
                      You’ll enter basic details, choose an avatar, then set
                      initial safety controls. You can change everything later.
                    </Text>

                    <View style={styles.bulletList}>
                      {[
                        { icon: "id-card", text: "Name & birthday" },
                        { icon: "happy", text: "Choose an avatar" },
                        {
                          icon: "shield-checkmark",
                          text: "Set parental controls",
                        },
                      ].map((item) => (
                        <View key={item.text} style={styles.bulletRow}>
                          <View style={styles.bulletIcon}>
                            <Ionicons
                              name={item.icon as any}
                              size={scaleSize(16)}
                              color="rgba(255,255,255,0.85)"
                            />
                          </View>
                          <Text style={styles.bulletText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setStep("name")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Get started</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* NAME */}
            {step === "name" && (
              <>
                <SectionHeader kicker="STEP 1" title="Child’s name" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      What should we call your child?
                    </Text>

                    <View style={{ marginTop: rs[4] }}>
                      <Text style={styles.inputLabel}>Full name</Text>
                      <TextInput
                        style={styles.input}
                        value={childName}
                        onChangeText={setChildName}
                        placeholder="e.g., Emma"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleNameConfirm}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={handleHeaderBack}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* DOB */}
            {step === "birth-date" && (
              <>
                <SectionHeader kicker="STEP 2" title="Date of birth" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      This helps us recommend age-appropriate content.
                    </Text>

                    <View style={{ marginTop: rs[4] }}>
                      <Text style={styles.inputLabel}>Birth date</Text>
                      <TextInput
                        style={styles.input}
                        value={birthDate}
                        onChangeText={setBirthDate}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        keyboardType="numbers-and-punctuation"
                      />
                      <View style={styles.tipBox}>
                        <Text style={styles.tipText}>
                          Tip: Use the format MM/DD/YYYY (example: 04/16/2018).
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleBirthDateConfirm}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("name")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* AVATAR */}
            {step === "avatar" && (
              <>
                <SectionHeader kicker="STEP 3" title="Choose an avatar" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      Pick an avatar for{" "}
                      {childName?.trim() ? childName : "your child"}.
                    </Text>

                    <View style={styles.avatarGrid}>
                      {avatarOptions.map((avatar) => {
                        const isSelected = selectedAvatar === avatar;
                        return (
                          <TouchableOpacity
                            key={avatar}
                            style={[
                              styles.avatarOption,
                              isSelected && styles.avatarOptionSelected,
                            ]}
                            activeOpacity={0.9}
                            onPress={() => setSelectedAvatar(avatar)}
                          >
                            <Text style={styles.avatarEmoji}>{avatar}</Text>
                            {isSelected && (
                              <View style={styles.avatarCheck}>
                                <Ionicons
                                  name="checkmark"
                                  size={scaleSize(12)}
                                  color="#0B0B0D"
                                />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setStep("controls")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("birth-date")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* CONTROLS */}
            {step === "controls" && (
              <>
                <SectionHeader kicker="STEP 4" title="Parental controls" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      Choose initial settings. You can always change these
                      later.
                    </Text>

                    <View style={{ marginTop: rs[5] }}>
                      <Text style={styles.cardTitle}>Age level</Text>
                      <View style={{ marginTop: rs[3] }}>
                        {ageLevels.map((lvl, idx) => {
                          const selected = ageLevel === lvl.id;
                          return (
                            <View key={lvl.id}>
                              {idx > 0 && <View style={{ height: rs[2] }} />}
                              <TouchableOpacity
                                style={[
                                  styles.rowCard,
                                  selected && styles.rowCardSelected,
                                ]}
                                activeOpacity={0.9}
                                onPress={() => setAgeLevel(lvl.id)}
                              >
                                <View style={{ flex: 1, paddingRight: rs[3] }}>
                                  <Text style={styles.rowTitle}>
                                    {lvl.label}
                                  </Text>
                                  <Text style={styles.rowSubtitle}>
                                    {lvl.subtitle}
                                  </Text>
                                </View>
                                {selected ? (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={scaleSize(18)}
                                    color="#FDBD4B"
                                  />
                                ) : (
                                  <Ionicons
                                    name="radio-button-off"
                                    size={scaleSize(18)}
                                    color="rgba(255,255,255,0.35)"
                                  />
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ marginTop: rs[5] }}>
                      <Text style={styles.cardTitle}>Daily time limit</Text>
                      <View style={styles.timeLimitRow}>
                        {["1", "2", "3", "4"].map((h) => {
                          const selected = dailyLimit === h;
                          return (
                            <TouchableOpacity
                              key={h}
                              style={[
                                styles.limitPill,
                                selected && styles.limitPillSelected,
                              ]}
                              activeOpacity={0.9}
                              onPress={() => setDailyLimit(h)}
                            >
                              <Text
                                style={[
                                  styles.limitText,
                                  selected && styles.limitTextSelected,
                                ]}
                              >
                                {h}h
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        saving && styles.disabledButton,
                      ]}
                      onPress={handleControlsConfirm}
                      activeOpacity={0.9}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#0B0B0D" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Create profile
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("avatar")}
                      activeOpacity={0.9}
                      disabled={saving}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <>
                <SectionHeader kicker="DONE" title="Profile created" />
                <GradientCard>
                  <View style={styles.block}>
                    <View style={styles.successIcon}>
                      <Ionicons
                        name="checkmark"
                        size={scaleSize(18)}
                        color="#0B0B0D"
                      />
                    </View>

                    <Text style={styles.blockTitle}>All set!</Text>
                    <Text style={styles.blockBody}>
                      {childName}’s profile is ready. You can now assign toys
                      and monitor activity.
                    </Text>

                    <View style={styles.summaryCard}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Name</Text>
                        <Text style={styles.summaryValue}>{childName}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Age level</Text>
                        <Text style={styles.summaryValue}>
                          {ageLevels.find((l) => l.id === ageLevel)?.label}
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Daily limit</Text>
                        <Text style={styles.summaryValue}>
                          {dailyLimit} hours
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleFinish}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* Extra bottom spacing for nav bar / safe tap area */}
            <View style={{ height: scaleSize(160) }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },

  header: {
    paddingTop: rs[4],
    paddingBottom: rs[4],
    flexDirection: "row",
    alignItems: "center",
    gap: rs[3],
  },
  headerBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconImg: {
    width: scaleSize(18),
    height: scaleSize(18),
    resizeMode: "contain",
    opacity: 0.95,
  },
  kicker: {
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 3,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  pageTitle: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },
  subTitle: {
    marginTop: 6,
    fontSize: rt.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  content: { paddingTop: rs[2] },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: rs[3],
    marginBottom: rs[3],
    paddingHorizontal: 2,
  },
  sectionKicker: {
    fontSize: rt.fontSize.xs,
    letterSpacing: 1.6,
    color: "rgba(253,189,75,0.85)",
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: rt.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  cardGradient: {
    borderRadius: rbr.xl,
    padding: 1,
    marginBottom: rs[3],
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
  cardInner: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },

  block: { padding: rs[5] },

  bigIconBubble: {
    width: scaleSize(52),
    height: scaleSize(52),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: rs[3],
  },

  blockTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: rs[2],
  },
  blockBody: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  bulletList: { marginTop: rs[5], gap: rs[3] },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: rs[3] },
  bulletIcon: {
    width: scaleSize(34),
    height: scaleSize(34),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: { color: "rgba(255,255,255,0.86)", fontWeight: "800" },

  inputLabel: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.80)",
    marginBottom: rs[2],
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.30)",
    borderRadius: rbr.lg,
    paddingHorizontal: rs[4],
    paddingVertical: rs[4],
    fontSize: rt.fontSize.base,
    color: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  tipBox: {
    marginTop: rs[3],
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.20)",
    borderRadius: rbr.lg,
    padding: rs[4],
  },
  tipText: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
    fontSize: rt.fontSize.sm,
  },

  avatarGrid: {
    marginTop: rs[5],
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: rs[3],
  },
  avatarOption: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: rbr.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarOptionSelected: {
    backgroundColor: "rgba(253,189,75,0.10)",
    borderColor: "rgba(253,189,75,0.30)",
  },
  avatarEmoji: { fontSize: scaleSize(28) },
  avatarCheck: {
    position: "absolute",
    top: scaleSize(6),
    right: scaleSize(6),
    width: scaleSize(18),
    height: scaleSize(18),
    borderRadius: 999,
    backgroundColor: "#FDBD4B",
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    fontSize: rt.fontSize.xs,
    letterSpacing: 1.2,
    color: "rgba(253,189,75,0.85)",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: rbr.lg,
    padding: rs[4],
  },
  rowCardSelected: {
    backgroundColor: "rgba(253,189,75,0.10)",
    borderColor: "rgba(253,189,75,0.30)",
  },
  rowTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.60)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  timeLimitRow: { flexDirection: "row", marginTop: rs[3], gap: rs[3] },
  limitPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: rs[4],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  limitPillSelected: {
    backgroundColor: "rgba(253,189,75,0.18)",
    borderColor: "rgba(253,189,75,0.32)",
  },
  limitText: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },
  limitTextSelected: { color: "#FDBD4B" },

  primaryButton: {
    marginTop: rs[5],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDBD4B",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 4 },
    }),
  },
  primaryButtonText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },

  ghostButton: {
    marginTop: rs[3],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ghostButtonText: { color: "rgba(255,255,255,0.82)", fontWeight: "900" },

  disabledButton: { opacity: 0.6 },

  successIcon: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    backgroundColor: "#FDBD4B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs[3],
  },

  summaryCard: {
    marginTop: rs[5],
    borderRadius: rbr.lg,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: rs[4],
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: rs[2],
  },
  summaryLabel: { color: "rgba(255,255,255,0.60)", fontWeight: "800" },
  summaryValue: { color: "rgba(255,255,255,0.90)", fontWeight: "900" },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: rs[2],
  },
});
