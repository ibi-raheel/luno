// src/screens/ParentalControlsScreen.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  typography,
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  layout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { StarryBackground } from "../components/StarryBackground";

type ModalType = "content" | "time" | "privacy" | "alerts" | null;

interface ChildControl {
  id: string;
  name: string;
  age: number;

  contentFilterEnabled: boolean;
  quietHoursEnabled: boolean;
  dailyLimitEnabled: boolean;
  dailyLimitHours: number;
  creativeModeEnabled: boolean;

  recordConversations: boolean;

  ageLevel: string;
  blockedTopics: {
    violence: boolean;
    matureContent: boolean;
    politics: boolean;
    religion: boolean;
    personalInfo: boolean;
  };

  alertTypes: {
    personalInfo: boolean;
    inappropriateContent: boolean;
    emotionalDistress: boolean;
    unusualPatterns: boolean;
  };

  alertSensitivity: "Low" | "Medium" | "High";
}

type DraftPatch = Partial<
  Pick<
    ChildControl,
    | "contentFilterEnabled"
    | "quietHoursEnabled"
    | "dailyLimitEnabled"
    | "dailyLimitHours"
    | "creativeModeEnabled"
    | "recordConversations"
    | "ageLevel"
    | "blockedTopics"
    | "alertTypes"
    | "alertSensitivity"
  >
>;

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

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "gold" | "neutral" | "red" | "green";
}) {
  const toneStyle = useMemo(() => {
    switch (tone) {
      case "gold":
        return {
          bg: "rgba(253,189,75,0.14)",
          border: "rgba(253,189,75,0.24)",
          text: "#FDBD4B",
        };
      case "green":
        return {
          bg: "rgba(46, 204, 113, 0.12)",
          border: "rgba(46, 204, 113, 0.22)",
          text: "rgba(46, 204, 113, 0.95)",
        };
      case "red":
        return {
          bg: "rgba(255, 77, 77, 0.12)",
          border: "rgba(255, 77, 77, 0.22)",
          text: "rgba(255, 160, 160, 0.95)",
        };
      default:
        return {
          bg: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.14)",
          text: "rgba(255,255,255,0.72)",
        };
    }
  }, [tone]);

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
      ]}
    >
      <Text style={[styles.pillText, { color: toneStyle.text }]}>{label}</Text>
    </View>
  );
}

function QuickToggleRow({
  title,
  value,
  onValueChange,
  rightLabel,
  isLast,
}: {
  title: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  rightLabel?: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.quickRow, isLast && styles.quickRowLast]}>
      <View style={{ flex: 1, paddingRight: rs[3] }}>
        <Text style={styles.quickRowTitle}>{title}</Text>
      </View>

      <View style={styles.quickRowRight}>
        {!!rightLabel && (
          <Text style={styles.quickRowValue} numberOfLines={1}>
            {rightLabel}
          </Text>
        )}
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: "rgba(255,255,255,0.16)",
            true: "rgba(253,189,75,0.28)",
          }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

function ListRow({
  title,
  subtitle,
  value,
  pill,
  onPress,
  isLast,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  pill?: { label: string; tone: "gold" | "neutral" | "red" | "green" };
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.listRow, isLast && styles.listRowLast]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={{ flex: 1, paddingRight: rs[3] }}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.listRowSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.listRowRight}>
        {!!value && (
          <Text
            style={styles.listRowValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value}
          </Text>
        )}
        {!!pill && <StatusPill label={pill.label} tone={pill.tone} />}
        <Ionicons
          name="chevron-forward"
          size={scaleSize(16)}
          color="rgba(255,255,255,0.35)"
        />
      </View>
    </TouchableOpacity>
  );
}

function FullPageEditor({
  visible,
  title,
  onClose,
  onSave,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.editorRoot}>
        <StarryBackground />
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.editorSafeArea} edges={["top", "bottom"]}>
          <View style={styles.editorHeader}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.editorIconBtn}
            >
              <Ionicons name="close" size={scaleSize(20)} color="#FDBD4B" />
            </Pressable>

            <Text style={styles.editorTitle} numberOfLines={1}>
              {title}
            </Text>

            <Pressable
              onPress={onSave}
              hitSlop={10}
              style={styles.editorSaveBtn}
            >
              <Text style={styles.editorSaveText}>Save</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.editorContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
            <View style={{ height: rs[18] }} />
          </ScrollView>

          <View style={styles.editorFooter}>
            <TouchableOpacity
              style={styles.editorFooterBtn}
              onPress={onSave}
              activeOpacity={0.9}
            >
              <Text style={styles.editorFooterBtnText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default function ParentalControlsScreen({ navigation }: any) {
  const { currentUser } = useAuth();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [children, setChildren] = useState<ChildControl[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState<DraftPatch>({});

  const calculateAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const parts = birthDate.split("/");
    if (parts.length !== 3) return null;
    const [mm, dd, yyyy] = parts.map((p) => Number(p));
    if (!mm || !dd || !yyyy) return null;

    const dob = new Date(yyyy, mm - 1, dd);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    const hasHadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasHadBirthdayThisYear) age--;

    return age >= 0 ? age : null;
  };

  useEffect(() => {
    if (!currentUser) {
      setChildren([]);
      setLoading(false);
      return;
    }

    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubscribe = onSnapshot(childrenRef, (snapshot) => {
      const loadedChildren: ChildControl[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const age = calculateAge(data.birthDate);

        return {
          id: docSnap.id,
          name: data.name || "Child",
          age: age || 0,

          contentFilterEnabled: data.contentFilterEnabled ?? true,
          quietHoursEnabled: data.quietHoursEnabled ?? true,
          dailyLimitEnabled: data.dailyLimitEnabled ?? true,
          dailyLimitHours: data.dailyLimitHours || 2,
          creativeModeEnabled: data.creativeModeEnabled ?? false,

          recordConversations: data.recordConversations ?? true,

          ageLevel: data.ageLevel || "Late Elementary (9-11 years)",
          blockedTopics: data.blockedTopics || {
            violence: true,
            matureContent: true,
            politics: false,
            religion: false,
            personalInfo: true,
          },

          alertTypes: data.alertTypes || {
            personalInfo: true,
            inappropriateContent: true,
            emotionalDistress: true,
            unusualPatterns: true,
          },

          alertSensitivity: data.alertSensitivity || "Medium",
        };
      });

      setChildren(loadedChildren);

      // If no child is selected, or if the selected child no longer exists, select the first one
      if (loadedChildren.length > 0) {
        const selectedChildExists = loadedChildren.some(c => c.id === selectedChildId);
        if (!selectedChildId || !selectedChildExists) {
          setSelectedChildId(loadedChildren[0].id);
        }
      } else {
        // No children left, clear the selection
        setSelectedChildId(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  const patchLocalChild = (childId: string, patch: DraftPatch) => {
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        return {
          ...c,
          ...patch,
          ...(patch.blockedTopics
            ? { blockedTopics: patch.blockedTopics }
            : {}),
          ...(patch.alertTypes ? { alertTypes: patch.alertTypes } : {}),
        };
      })
    );
  };

  const updateChildSetting = async (key: keyof ChildControl, value: any) => {
    if (!currentUser || !selectedChildId) return;

    patchLocalChild(selectedChildId, { [key]: value } as DraftPatch);

    try {
      const childRef = doc(
        db,
        "users",
        currentUser.uid,
        "children",
        selectedChildId
      );
      await updateDoc(childRef, { [key]: value });
    } catch (error) {
      console.error("Error updating child setting:", error);
    }
  };

  const openEditor = (type: Exclude<ModalType, null>) => {
    if (!selectedChild) return;

    setActiveModal(type);

    if (type === "content") {
      setDraft({
        contentFilterEnabled: selectedChild.contentFilterEnabled,
        creativeModeEnabled: selectedChild.creativeModeEnabled,
        ageLevel: selectedChild.ageLevel,
        blockedTopics: { ...selectedChild.blockedTopics },
      });
    }

    if (type === "time") {
      setDraft({
        dailyLimitEnabled: selectedChild.dailyLimitEnabled,
        dailyLimitHours: selectedChild.dailyLimitHours,
        quietHoursEnabled: selectedChild.quietHoursEnabled,
      });
    }

    if (type === "privacy") {
      setDraft({
        recordConversations: selectedChild.recordConversations,
      });
    }

    if (type === "alerts") {
      setDraft({
        alertTypes: { ...selectedChild.alertTypes },
        alertSensitivity: selectedChild.alertSensitivity,
      });
    }
  };

  const closeEditor = () => {
    setActiveModal(null);
    setDraft({});
  };

  const saveDraft = async () => {
    if (!currentUser || !selectedChildId || !activeModal || !selectedChild)
      return;

    const childRef = doc(
      db,
      "users",
      currentUser.uid,
      "children",
      selectedChildId
    );

    let payload: DraftPatch = {};

    if (activeModal === "content") {
      payload = {
        contentFilterEnabled:
          draft.contentFilterEnabled ?? selectedChild.contentFilterEnabled,
        creativeModeEnabled:
          draft.creativeModeEnabled ?? selectedChild.creativeModeEnabled,
        ageLevel: draft.ageLevel ?? selectedChild.ageLevel,
        blockedTopics: draft.blockedTopics ?? selectedChild.blockedTopics,
      };
    }

    if (activeModal === "time") {
      payload = {
        dailyLimitEnabled:
          draft.dailyLimitEnabled ?? selectedChild.dailyLimitEnabled,
        dailyLimitHours: draft.dailyLimitHours ?? selectedChild.dailyLimitHours,
        quietHoursEnabled:
          draft.quietHoursEnabled ?? selectedChild.quietHoursEnabled,
      };
    }

    if (activeModal === "privacy") {
      payload = {
        recordConversations:
          draft.recordConversations ?? selectedChild.recordConversations,
      };
    }

    if (activeModal === "alerts") {
      payload = {
        alertTypes: draft.alertTypes ?? selectedChild.alertTypes,
        alertSensitivity:
          draft.alertSensitivity ?? selectedChild.alertSensitivity,
      };
    }

    try {
      patchLocalChild(selectedChildId, payload);
      await updateDoc(childRef, payload as any);
      closeEditor();
    } catch (e) {
      console.error("[ParentalControls] saveDraft error:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StarryBackground />
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>CONTROLS</Text>

              {/* Title row with lock on far right */}
              <View style={styles.headerRow}>
                <Text style={styles.pageTitle}>Parental Controls</Text>

                <View style={styles.headerIconRight}>
                  <Ionicons
                    name="lock-closed"
                    size={scaleSize(18)}
                    color="#FDBD4B"
                  />
                </View>
              </View>

              <Text style={styles.subTitle}>Loading child settings...</Text>
            </View>
          </View>

          <View style={styles.centerContentDark}>
            <Text style={styles.loadingTextDark}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!selectedChild) {
    return (
      <View style={styles.container}>
        <StarryBackground />
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>CONTROLS</Text>

              <View style={styles.headerRow}>
                <Text style={styles.pageTitle}>Parental Controls</Text>

                <View style={styles.headerIconRight}>
                  <Ionicons
                    name="lock-closed"
                    size={scaleSize(18)}
                    color="#FDBD4B"
                  />
                </View>
              </View>

              <Text style={styles.subTitle}>
                Add a child to configure safety
              </Text>
            </View>
          </View>

          <View style={styles.centerContentDark}>
            <Text style={styles.emptyTextDark}>
              No children found. Add a child profile to configure parental
              controls.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const enabledAlertsCount = Object.values(selectedChild.alertTypes).filter(
    Boolean
  ).length;

  return (
    <View style={styles.container}>
      <StarryBackground />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>CONTROLS</Text>

              <View style={styles.headerRow}>
                <Text style={styles.pageTitle}>Parental Controls</Text>

                {/* Far-right lock icon */}
                <View style={styles.headerIconRight}>
                  <Ionicons
                    name="lock-closed"
                    size={scaleSize(18)}
                    color="#FDBD4B"
                  />
                </View>
              </View>

              <Text style={styles.subTitle}>
                Fine-tune how Luno behaves with {selectedChild.name}
              </Text>
            </View>
          </View>

          {/* CHILD SELECTOR */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.childSelectorScroll}
            contentContainerStyle={styles.childSelector}
          >
            {children.map((child) => {
              const isActive = selectedChildId === child.id;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childTab, isActive && styles.childTabActive]}
                  onPress={() => setSelectedChildId(child.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.childTabText,
                      isActive && styles.childTabTextActive,
                    ]}
                  >
                    {child.name}
                  </Text>
                  <Text
                    style={[
                      styles.childTabAge,
                      isActive && styles.childTabAgeActive,
                    ]}
                  >
                    {child.age} yrs
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* QUICK CONTROLS */}
          <SectionHeader kicker="QUICK" title="Controls" />
          <View style={styles.quickActionsCard}>
            <QuickToggleRow
              title="Content filters"
              value={selectedChild.contentFilterEnabled}
              onValueChange={(v) =>
                updateChildSetting("contentFilterEnabled", v)
              }
              rightLabel={selectedChild.contentFilterEnabled ? "On" : "Off"}
            />
            <QuickToggleRow
              title="Daily time limit"
              value={selectedChild.dailyLimitEnabled}
              onValueChange={(v) => updateChildSetting("dailyLimitEnabled", v)}
              rightLabel={
                selectedChild.dailyLimitEnabled
                  ? `${selectedChild.dailyLimitHours}h`
                  : "Off"
              }
            />
            <QuickToggleRow
              title="Quiet hours"
              value={selectedChild.quietHoursEnabled}
              onValueChange={(v) => updateChildSetting("quietHoursEnabled", v)}
              rightLabel={selectedChild.quietHoursEnabled ? "On" : "Off"}
            />
            <QuickToggleRow
              title="Creative mode"
              value={selectedChild.creativeModeEnabled}
              onValueChange={(v) =>
                updateChildSetting("creativeModeEnabled", v)
              }
              rightLabel={selectedChild.creativeModeEnabled ? "On" : "Off"}
              isLast
            />
          </View>

          {/* DETAILED SETTINGS */}
          <SectionHeader kicker="DETAILED" title="Settings" />
          <View style={styles.detailsCard}>
            <ListRow
              title="Content & age"
              subtitle="Age level, blocked topics, creative rules"
              value="Configured"
              pill={{
                label: selectedChild.contentFilterEnabled ? "Active" : "Off",
                tone: selectedChild.contentFilterEnabled ? "gold" : "neutral",
              }}
              onPress={() => openEditor("content")}
            />

            <ListRow
              title="Time management"
              subtitle="Daily limits and quiet hours"
              value={
                selectedChild.dailyLimitEnabled
                  ? `${selectedChild.dailyLimitHours}h/day`
                  : "No limit"
              }
              pill={{
                label:
                  selectedChild.dailyLimitEnabled ||
                  selectedChild.quietHoursEnabled
                    ? "On"
                    : "Off",
                tone:
                  selectedChild.dailyLimitEnabled ||
                  selectedChild.quietHoursEnabled
                    ? "gold"
                    : "neutral",
              }}
              onPress={() => openEditor("time")}
            />

            <ListRow
              title="Privacy & data"
              subtitle="Recording, export, deletion"
              value={selectedChild.recordConversations ? "Recording" : "Off"}
              pill={{
                label: selectedChild.recordConversations ? "On" : "Off",
                tone: selectedChild.recordConversations ? "gold" : "neutral",
              }}
              onPress={() => openEditor("privacy")}
            />

            <ListRow
              title="Safety alerts"
              subtitle="Which alerts trigger + sensitivity"
              value={`${enabledAlertsCount}/4`}
              pill={{
                label: selectedChild.alertSensitivity,
                tone: enabledAlertsCount > 0 ? "gold" : "neutral",
              }}
              onPress={() => openEditor("alerts")}
              isLast
            />
          </View>

          {/* EXTRA SPACE so floating menu doesn't hide last rows */}
          <View style={{ height: rs[26] }} />
        </ScrollView>

        {/* FULL-PAGE EDITORS */}
        <FullPageEditor
          visible={activeModal === "content"}
          title="Content & age"
          onClose={closeEditor}
          onSave={saveDraft}
        >
          {/* Keep existing editor content from your current version */}
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
            (Editor content unchanged — keep your current content blocks here)
          </Text>
        </FullPageEditor>

        <FullPageEditor
          visible={activeModal === "time"}
          title="Time management"
          onClose={closeEditor}
          onSave={saveDraft}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
            (Editor content unchanged — keep your current content blocks here)
          </Text>
        </FullPageEditor>

        <FullPageEditor
          visible={activeModal === "privacy"}
          title="Privacy & data"
          onClose={closeEditor}
          onSave={saveDraft}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
            (Editor content unchanged — keep your current content blocks here)
          </Text>
        </FullPageEditor>

        <FullPageEditor
          visible={activeModal === "alerts"}
          title="Safety alerts"
          onClose={closeEditor}
          onSave={saveDraft}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
            (Editor content unchanged — keep your current content blocks here)
          </Text>
        </FullPageEditor>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },
  content: { padding: layout?.screenPadding ?? rs[5] },

  topBar: {
    marginBottom: rs[5],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kicker: {
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  // Title row with far-right icon
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  pageTitle: {
    flex: 1,
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },
  headerIconRight: {
    width: scaleSize(34),
    height: scaleSize(34),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: rs[3],
  },

  subTitle: {
    marginTop: 6,
    fontSize: rt.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  centerContentDark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: rs[5],
  },
  loadingTextDark: {
    fontSize: rt.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },
  emptyTextDark: {
    fontSize: rt.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

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

  // Child selector
  childSelectorScroll: { paddingBottom: rs[4], maxHeight: scaleSize(80) },
  childSelector: { flexDirection: "row", gap: rs[3] },
  childTab: {
    minWidth: scaleSize(110),
    borderRadius: rbr.lg,
    paddingVertical: rs[3],
    paddingHorizontal: rs[4],
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
  },
  // Darker active pill so white text is readable
  childTabActive: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(253,189,75,0.34)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  childTabText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.88)",
    marginBottom: 2,
  },
  childTabTextActive: { color: "#FFFFFF" },
  childTabAge: {
    fontSize: rt.fontSize.xs,
    fontWeight: "800",
    color: "rgba(255,255,255,0.60)",
  },
  childTabAgeActive: { color: "rgba(255,255,255,0.85)" },

  // Quick controls card (same as before; keep your shadow settings here)
  quickActionsCard: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.42,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 14 },
      },
      android: { elevation: 10 },
    }),
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[4],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  quickRowLast: { borderBottomWidth: 0 },
  quickRowTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },
  quickRowRight: { flexDirection: "row", alignItems: "center", gap: rs[2] },
  quickRowValue: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.70)",
    maxWidth: scaleSize(72),
  },

  detailsCard: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    borderRadius: rbr.xl,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[4],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  listRowLast: { borderBottomWidth: 0 },
  listRowTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },
  listRowSubtitle: {
    marginTop: 4,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.58)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },
  listRowRight: { flexDirection: "row", alignItems: "center", gap: rs[2] },
  listRowValue: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.70)",
    maxWidth: scaleSize(90),
  },

  pill: {
    paddingHorizontal: rs[3],
    paddingVertical: rs[1],
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },
  pillText: {
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  editorRoot: { flex: 1, backgroundColor: "#000" },
  editorSafeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },
  editorHeader: {
    paddingHorizontal: rs[5],
    paddingTop: rs[2],
    paddingBottom: rs[4],
    flexDirection: "row",
    alignItems: "center",
    gap: rs[3],
  },
  editorIconBtn: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  editorTitle: {
    flex: 1,
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  editorSaveBtn: {
    paddingHorizontal: rs[4],
    paddingVertical: rs[2],
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.18)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.28)",
  },
  editorSaveText: { color: "#FDBD4B", fontWeight: "900" },
  editorContent: { padding: layout?.screenPadding ?? rs[5], paddingTop: rs[2] },
  editorFooter: {
    paddingHorizontal: rs[5],
    paddingBottom: rs[5],
    paddingTop: rs[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  editorFooterBtn: {
    backgroundColor: "rgba(253,189,75,0.18)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.28)",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    alignItems: "center",
  },
  editorFooterBtnText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },
});
