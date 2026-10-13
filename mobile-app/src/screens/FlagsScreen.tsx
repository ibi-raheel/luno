// src/screens/FlagsScreen.tsx

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  spacing,
  borderRadius,
  shadows,
  layout,
  typography,
  responsiveSpacing as rs,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { FlagCard } from "../components/FlagCard";
import { StarryBackground } from "../components/StarryBackground";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { safeTimestampToDate } from "../utils/dateHelpers";

type FlagFilter = "unreviewed" | "reviewed";

interface Child {
  id: string;
  name: string;
}

interface FlagItem {
  id: string; // conversation id
  childId: string;
  childName: string;
  flagType:
    | "personal_info"
    | "inappropriate"
    | "distress"
    | "mature_topic"
    | "unusual_behavior";
  severity: "low" | "medium" | "high" | "critical";
  messagePreview: string;
  timestamp: Date;
  timestampLabel: string;
  status: "unreviewed" | "reviewed";
}

/** Dashboard-consistent section header */
function SectionHeader({
  kicker,
  title,
  actionLabel,
  onPress,
}: {
  kicker?: string;
  title: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        {!!kicker && <Text style={styles.sectionKicker}>{kicker}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {actionLabel && onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          <View style={styles.sectionActionBtn}>
            <Text style={styles.sectionActionText}>{actionLabel}</Text>
            <Text style={styles.sectionActionArrow}>›</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function FlagsScreen({ navigation }: any) {
  const { currentUser } = useAuth();

  const [filter, setFilter] = useState<FlagFilter>("unreviewed");
  const [children, setChildren] = useState<Child[]>([]);
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  // Track component mount status
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // --- Load children ---
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubscribe = onSnapshot(
      childrenRef,
      (snapshot) => {
        const loaded: Child[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name || "Child",
        }));
        setChildren(loaded);
      },
      (err) => console.error("[FlagsScreen] Error loading children:", err)
    );

    return unsubscribe;
  }, [currentUser]);

  // --- Load flagged conversations from unified collection ---
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // NEW: Query unified conversations collection for flagged items
    const convRef = collection(
      db,
      "users",
      currentUser.uid,
      "conversations"
    );

    const q = query(
      convRef,
      where("flagged", "==", true),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allFlags: FlagItem[] = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();

          const startTime = safeTimestampToDate(data.startTime);

          const flagType: FlagItem["flagType"] = [
            "personal_info",
            "inappropriate",
            "distress",
            "mature_topic",
            "unusual_behavior",
          ].includes(data.flagType)
            ? data.flagType
            : "personal_info";

          const severity: FlagItem["severity"] = [
            "low",
            "medium",
            "high",
            "critical",
          ].includes(data.severity)
            ? data.severity
            : "medium";

          const timestampLabel = startTime.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          const messagePreview: string =
            data.firstMessagePreview ||
            data.messagePreview ||
            data.flagReason ||
            "Flagged content in this conversation.";

          const status: "unreviewed" | "reviewed" =
            data.flagStatus === "reviewed" ? "reviewed" : "unreviewed";

          // Get child name from children array
          const child = children.find((c) => c.id === data.childId);

          return {
            id: docSnap.id,
            childId: data.childId || "",
            childName: child?.name || data.childName || "Child",
            flagType,
            severity,
            messagePreview,
            timestamp: startTime,
            timestampLabel,
            status,
          };
        });

        setFlags(allFlags);
        setLoading(false);
      },
      (err) => {
        console.error("[FlagsScreen] Error loading flags:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, children]);

  // Filter flags
  const filteredFlags = useMemo(() => {
    return flags.filter((f) => f.status === filter);
  }, [flags, filter]);

  const unreviewedCount = useMemo(
    () => flags.filter((f) => f.status === "unreviewed").length,
    [flags]
  );

  const totalFlags = flags.length;
  const reviewedCount = totalFlags - unreviewedCount;

  const handleDismiss = async (flag: FlagItem) => {
    if (!currentUser) return;

    try {
      // NEW: Update in unified conversations collection
      const convRef = doc(
        db,
        "users",
        currentUser.uid,
        "conversations",
        flag.id
      );

      await updateDoc(convRef, {
        flagged: false,
        flagReason: null,
        flagStatus: null,
        flagType: null,
        severity: null,
      });

      if (isMountedRef.current) {
        Alert.alert("Flag dismissed", "This flag has been resolved.");
      }
    } catch (err) {
      console.error("[FlagsScreen] Error dismissing flag:", err);
      if (isMountedRef.current) {
        Alert.alert("Error", "Could not dismiss this flag. Please try again.");
      }
    }
  };

  const handleReview = (flag: FlagItem) => {
    navigation.navigate("Conversation", {
      conversationId: flag.id,
      childId: flag.childId,
      childName: flag.childName,
    });
  };

  const handleDeleteAllFlags = async () => {
    if (!currentUser) return;

    if (flags.length === 0) {
      Alert.alert("No Flags", "There are no flags to delete.");
      return;
    }

    Alert.alert(
      "Clear All Flags",
      `Are you sure you want to clear all ${flags.length} flag${
        flags.length > 1 ? "s" : ""
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // NEW: Update all flags in unified conversations collection
              const ops = flags.map((flag) => {
                const convRef = doc(
                  db,
                  "users",
                  currentUser.uid,
                  "conversations",
                  flag.id
                );
                return updateDoc(convRef, {
                  flagged: false,
                  flagReason: null,
                  flagStatus: null,
                });
              });

              await Promise.all(ops);
              if (isMountedRef.current) {
                Alert.alert("Success", "All flags have been cleared.");
              }
            } catch (err) {
              console.error("[FlagsScreen] Error clearing all flags:", err);
              if (isMountedRef.current) {
                Alert.alert("Error", "Could not clear all flags.");
              }
            }
          },
        },
      ]
    );
  };

  // Auto-delete reviewed flags at end of day
  useEffect(() => {
    if (!currentUser) return;

    const checkAndDeleteOldReviewedFlags = async () => {
      try {
        const lastCleanupDate = await AsyncStorage.getItem("lastFlagCleanup");
        const today = new Date().toDateString();

        if (lastCleanupDate !== today) {
          const reviewedFlags = flags.filter((f) => f.status === "reviewed");

          if (reviewedFlags.length > 0) {
            // NEW: Auto-cleanup in unified conversations collection
            const ops = reviewedFlags.map((flag) => {
              const convRef = doc(
                db,
                "users",
                currentUser.uid,
                "conversations",
                flag.id
              );
              return updateDoc(convRef, {
                flagged: false,
                flagReason: null,
                flagStatus: null,
              });
            });

            await Promise.all(ops);
          }

          await AsyncStorage.setItem("lastFlagCleanup", today);
        }
      } catch (err) {
        console.error("[FlagsScreen] Error in auto-cleanup:", err);
      }
    };

    checkAndDeleteOldReviewedFlags();
  }, [currentUser, flags]);

  const FilterPill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>SAFETY</Text>
              <Text style={styles.pageTitle}>Safety Center</Text>
              <Text style={styles.subtitle}>
                Monitor and review flagged conversations
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.topActionBtn,
                totalFlags === 0 && styles.topActionBtnDisabled,
              ]}
              onPress={totalFlags > 0 ? handleDeleteAllFlags : undefined}
              activeOpacity={totalFlags > 0 ? 0.85 : 1}
              disabled={totalFlags === 0}
            >
              <Ionicons
                name="trash"
                size={scaleSize(18)}
                color={totalFlags > 0 ? "#FDBD4B" : "rgba(255,255,255,0.3)"}
              />
            </TouchableOpacity>
          </View>

          {/* STATS */}
          <SectionHeader kicker="OVERVIEW" title="Flags summary" />

          <LinearGradient
            colors={["#050506", "#120C04", "rgba(253,189,75,0.16)"]}
            locations={[0, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalFlags}</Text>
              <Text style={styles.statLabel}>TOTAL</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  unreviewedCount > 0 && styles.statValueAlert,
                ]}
              >
                {unreviewedCount}
              </Text>
              <Text style={styles.statLabel}>UNREVIEWED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reviewedCount}</Text>
              <Text style={styles.statLabel}>REVIEWED</Text>
            </View>
          </LinearGradient>

          {/* FILTERS */}
          <View style={styles.filtersRow}>
            <FilterPill
              label="Unreviewed"
              active={filter === "unreviewed"}
              onPress={() => setFilter("unreviewed")}
            />
            <FilterPill
              label="Reviewed"
              active={filter === "reviewed"}
              onPress={() => setFilter("reviewed")}
            />
          </View>

          {/* LIST */}
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#FDBD4B" />
              <Text style={styles.loadingText}>Loading flags...</Text>
            </View>
          ) : (
            <>
              {filteredFlags.length > 0 ? (
                filteredFlags.map((flag) => (
                  <FlagCard
                    key={`${flag.childId}-${flag.id}`}
                    childName={flag.childName}
                    flagType={flag.flagType}
                    severity={flag.severity}
                    messagePreview={flag.messagePreview}
                    timestamp={flag.timestampLabel}
                    onReview={() => handleReview(flag)}
                    onDismiss={() => handleDismiss(flag)}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="shield-checkmark"
                      size={scaleSize(28)}
                      color="#FDBD4B"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>All Clear</Text>
                  <Text style={styles.emptyText}>
                    {filter === "unreviewed"
                      ? "No unreviewed flags."
                      : "No reviewed flags to show."}
                  </Text>
                </View>
              )}

              <View style={{ height: rs[20] }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },
  content: { padding: layout.screenPadding },

  // Top bar
  topBar: {
    marginBottom: spacing[5],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing[4],
  },
  greeting: {
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  pageTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },
  topActionBtn: {
    width: scaleSize(38),
    height: scaleSize(38),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topActionBtnDisabled: {
    opacity: 0.4,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: spacing[3],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionKicker: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 1.6,
    color: "rgba(253,189,75,0.85)",
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  sectionActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(253, 189, 75, 0.22)",
  },
  sectionActionText: {
    fontSize: typography.fontSize.sm,
    color: "#FDBD4B",
    fontWeight: "900",
  },
  sectionActionArrow: {
    fontSize: typography.fontSize.lg,
    color: "#FDBD4B",
    marginTop: -1,
    fontWeight: "900",
  },

  // Stats
  statsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    flexDirection: "row",
    ...shadows.md,
    marginBottom: spacing[4],
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statValueAlert: { color: "#FF4D4D" },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1.1,
  },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.14)" },

  // Filters
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  filterPillActive: {
    backgroundColor: "rgba(253,189,75,0.18)",
    borderColor: "rgba(253,189,75,0.28)",
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.72)",
  },
  filterTextActive: { color: "#FDBD4B" },

  // Loading
  loadingCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[8],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    gap: spacing[3],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 4 },
    }),
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    textAlign: "center",
  },

  // Empty
  emptyState: {
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacing[10],
    marginTop: spacing[4],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...shadows.md,
  },
  emptyIconContainer: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: "rgba(255,255,255,0.70)",
    textAlign: "center",
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    fontWeight: "700",
  },
});
