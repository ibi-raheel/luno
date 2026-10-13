// src/screens/DashboardScreen.tsx

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

import { useAuth } from "../contexts/AuthContext";
import { db, recalculateStats } from "../lib/firebase";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  layout,
  responsiveSpacing as rs,
} from "../constants/theme";
import { scaleSize, scaleFont } from "../utils/responsive";
import { safeTimestampToDate } from "../utils/dateHelpers";

import { InsightCard } from "../components/InsightCard";
import { ActivityStatsGridMini } from "../components/ActivityStatsGrid";
import { RecentActivityList, Activity } from "../components/RecentActivityList";
import { ProductShowcaseCard } from "../components/ProductShowcaseCard";
import { StarryBackground } from "../components/StarryBackground";
import { getTodaysInsights } from "../data/mockInsights";

type ChildDoc = {
  id: string;
  name: string;
  birthDate?: string;
  ageLevel?: string;
  dailyLimitHours?: number | null;
  avatar?: string;
};

type ToyDoc = {
  id: string;
  name: string;
  emoji?: string;
  status?: "online" | "offline" | "charging" | string;
  assignedChildId?: string | null;
};

type ParentStats = {
  totalConversations: number;
  totalConversationDurationSec: number;
  flaggedConversations: number;
};

function calculateAge(birthDate?: string): number | null {
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
}

function formatHoursOnly(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0H";
  const hours = Math.floor(totalSeconds / 3600);
  return `${hours}H`;
}

/**
 * Consistent section header: KICKER (caps) + Title (premium)
 */
function SectionHeader({
  kicker,
  title,
  actionLabel,
  onPress,
  actionDisabled,
}: {
  kicker?: string;
  title: string;
  actionLabel?: string;
  onPress?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        {!!kicker && <Text style={styles.sectionKicker}>{kicker}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {actionLabel && onPress ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          disabled={actionDisabled}
          style={actionDisabled ? { opacity: 0.6 } : undefined}
        >
          <View style={styles.sectionActionBtn}>
            <Text style={styles.sectionActionText}>{actionLabel}</Text>
            <Text style={styles.sectionActionArrow}>›</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const { currentUser } = useAuth();
  const name = currentUser?.displayName || "Parent";

  const [children, setChildren] = useState<ChildDoc[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const [toys, setToys] = useState<ToyDoc[]>([]);
  const [loadingToys, setLoadingToys] = useState(true);

  const [stats, setStats] = useState<ParentStats>({
    totalConversations: 0,
    totalConversationDurationSec: 0,
    flaggedConversations: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [allFlags, setAllFlags] = useState<any[]>([]);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);

  const isMountedRef = useRef(true);

  const todaysInsights = getTodaysInsights();

  // Track component mount status
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setChildren([]);
      setLoadingChildren(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const childrenCol = collection(userRef, "children");
    const q = query(childrenCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChildDoc[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "Child",
            birthDate: data.birthDate,
            ageLevel: data.ageLevel,
            dailyLimitHours: data.dailyLimitHours ?? null,
            avatar: data.avatar,
          };
        });

        setChildren(list);
        setLoadingChildren(false);
      },
      (error) => {
        console.error("[Dashboard] Error loading children:", error);
        setLoadingChildren(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setToys([]);
      setLoadingToys(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const toysCol = collection(userRef, "toys");
    const q = query(toysCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ToyDoc[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "Luno Companion",
            emoji: data.emoji,
            status: data.status ?? "offline",
            assignedChildId: data.assignedChildId ?? null,
          };
        });

        setToys(list);
        setLoadingToys(false);
      },
      (error) => {
        console.error("[Dashboard] Error loading toys:", error);
        setLoadingToys(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setStats({
        totalConversations: 0,
        totalConversationDurationSec: 0,
        flaggedConversations: 0,
      });
      setLoadingStats(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const s = data.stats || {};
          setStats({
            totalConversations: s.totalConversations ?? 0,
            totalConversationDurationSec: s.totalConversationDurationSec ?? 0,
            flaggedConversations: s.flaggedConversations ?? 0,
          });
        } else {
          setStats({
            totalConversations: 0,
            totalConversationDurationSec: 0,
            flaggedConversations: 0,
          });
        }
        setLoadingStats(false);
      },
      (err) => {
        console.error("[Dashboard] Error loading stats:", err);
        setLoadingStats(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || children.length === 0) {
      setAllFlags([]);
      return;
    }

    // NEW: Query unified conversations collection for flagged items
    const convRef = collection(
      db,
      "users",
      currentUser.uid,
      "conversations"
    );

    const q = query(convRef, where("flagged", "==", true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allFlags = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();
          return {
            id: docSnap.id,
            childId: data.childId || "",
            flagStatus: data.flagStatus || "unreviewed",
          };
        });

        setAllFlags(allFlags);
      },
      (err) => {
        console.error("[Dashboard] Error loading flags:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser, children]);

  useEffect(() => {
    if (!currentUser) {
      setRecentConversations([]);
      return;
    }

    // NEW: Query unified conversations collection
    const convRef = collection(
      db,
      "users",
      currentUser.uid,
      "conversations"
    );

    const unsubscribe = onSnapshot(
      convRef,
      (snapshot) => {
        const allConvs = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();

          // Get child name from children array
          const child = children.find((c) => c.id === data.childId);

          return {
            id: docSnap.id,
            childId: data.childId || "",
            childName: child?.name || data.childName || "Child",
            createdAt: safeTimestampToDate(data.startTime || data.createdAt),
            flagged: data.flagged || false,
            summary: data.title || data.summary || "",
          };
        });

        const sorted = allConvs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 12);

        setRecentConversations(sorted);
      },
      (err) => {
        console.error("[Dashboard] Error loading conversations:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser, children]);

  const childrenCount = children.length;

  const unreviewedFlagsCount = useMemo(
    () => allFlags.filter((f) => f.flagStatus !== "reviewed").length,
    [allFlags]
  );

  const totalScreenTimeHours = formatHoursOnly(
    stats.totalConversationDurationSec
  );
  const conversationsCount = stats.totalConversations;
  const alertsCount = unreviewedFlagsCount;

  const recentActivities: Activity[] = useMemo(
    () =>
      recentConversations.map((conv) => ({
        id: conv.id,
        icon: conv.flagged ? "alert" : "chat",
        description: conv.flagged ? "Safety alert flagged" : "New conversation",
        timestamp: conv.createdAt,
        childName: conv.childName,
      })),
    [recentConversations]
  );

  const showStatsBanner = !loadingStats;
  const showAlertBanner = alertsCount > 0;

  const handleRecalculateStats = async () => {
    if (!currentUser) return;

    try {
      if (isMountedRef.current) {
        setLoadingStats(true);
      }
      await recalculateStats({ userId: currentUser.uid });
      if (isMountedRef.current) {
        Alert.alert("Success", "Stats have been recalculated successfully!");
      }
    } catch (error: any) {
      console.error("Error recalculating stats:", error);
      if (isMountedRef.current) {
        Alert.alert("Error", error.message || "Failed to recalculate stats.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStats(false);
      }
    }
  };

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
            <View>
              <Text style={styles.greeting}>GOOD MORNING</Text>
              <Text style={styles.name}>{name}</Text>
            </View>

            {/* Rocket icon - Navigate to Catalog */}
            <TouchableOpacity
              style={styles.rocketBtn}
              activeOpacity={0.75}
              onPress={() => navigation.navigate("Catalog")}
            >
              <Text style={styles.rocketIcon}>🚀</Text>
            </TouchableOpacity>
          </View>

          {/* HERO: MEET LUNO */}
          <ProductShowcaseCard />

          {/* SAFETY ALERT (moved directly below Meet Luno) */}
          {showAlertBanner && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => navigation.navigate("Safety")}
              activeOpacity={0.8}
            >
              <View style={styles.alertLeft}>
                <View style={styles.alertDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {alertsCount} safety{" "}
                    {alertsCount === 1 ? "alert" : "alerts"}
                  </Text>
                  <Text style={styles.alertSubtitle}>
                    Review recent conversations that need attention.
                  </Text>
                </View>
              </View>

              <Text style={styles.alertChevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* TODAY'S ACTIVITY + Sync action (replaces View All + removes top sync) */}
          {showStatsBanner && (
            <View style={{ marginTop: spacing[2] }}>
              <SectionHeader
                kicker="OVERVIEW"
                title="Today’s activity"
                actionLabel={loadingStats ? "Syncing..." : "Sync"}
                actionDisabled={loadingStats}
                onPress={handleRecalculateStats}
              />
              <ActivityStatsGridMini
                childrenCount={childrenCount}
                totalScreenTime={totalScreenTimeHours}
                conversationsCount={conversationsCount}
                // keep behavior (navigate Timeline) if your grid uses it internally
                onViewAllPress={() => navigation.navigate("Timeline")}
              />
            </View>
          )}

          {/* RECENT ACTIVITY */}
          {!loadingChildren && recentActivities.length > 0 && (
            <View style={{ marginTop: spacing[2] }}>
              <SectionHeader
                kicker="ACTIVITY"
                title="Recent activity"
                actionLabel="Timeline"
                onPress={() => navigation.navigate("Timeline")}
              />
              <RecentActivityList
                activities={recentActivities}
                onViewAll={() => navigation.navigate("Timeline")}
              />
            </View>
          )}

          {/* INSIGHTS */}
          {todaysInsights.length > 0 && (
            <View style={{ marginTop: spacing[2] }}>
              <SectionHeader kicker="INSIGHTS" title="AI insights" />
              {todaysInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  creativity_summary={insight.creativity_summary}
                  learning_themes={insight.learning_themes}
                  emotional_tone={insight.emotional_tone}
                  parent_note={insight.parent_note}
                  childName={insight.childName}
                />
              ))}
            </View>
          )}

          {/* CHILDREN */}
          <View style={{ marginTop: spacing[2] }}>
            <SectionHeader
              kicker="FAMILY"
              title="Your children"
              actionLabel="Add"
              onPress={() => navigation.navigate("AddChild")}
            />

            {loadingChildren ? (
              <Text style={styles.loadingText}>Loading children...</Text>
            ) : children.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyCard}
                onPress={() => navigation.navigate("AddChild")}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyTitle}>No child profiles yet</Text>
                <Text style={styles.emptySub}>
                  Tap to create your first profile.
                </Text>
              </TouchableOpacity>
            ) : (
              children.map((child) => {
                const age = calculateAge(child.birthDate);
                const dailyLimitText =
                  child.dailyLimitHours != null
                    ? `${child.dailyLimitHours}h daily limit`
                    : "No limit set";

                const childToys = toys.filter(
                  (toy) => toy.assignedChildId === child.id
                );
                const primaryToy = childToys[0];
                const toyStatus = primaryToy?.status || "offline";

                let statusText = "No toy connected";
                let statusDotStyle = styles.offlineDot;

                if (primaryToy) {
                  const toyName = primaryToy?.name || "Luno";
                  if (toyStatus === "online") {
                    statusText = `${toyName} is online`;
                    statusDotStyle = styles.onlineDot;
                  } else if (toyStatus === "charging") {
                    statusText = `${toyName} is charging`;
                    statusDotStyle = styles.chargingDot;
                  } else {
                    statusText = `${toyName} is offline`;
                    statusDotStyle = styles.offlineDot;
                  }
                }

                return (
                  <TouchableOpacity
                    key={child.id}
                    style={styles.childCard}
                    onPress={() =>
                      navigation.navigate("ChildProfile", {
                        childId: child.id,
                        childName: child.name,
                        childAge: age ?? undefined,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.childTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.childName}>
                          {child.name}
                          {age != null ? `, ${age}` : ""}
                        </Text>

                        <View style={styles.childStatusRow}>
                          <View style={[styles.statusDot, statusDotStyle]} />
                          <Text style={styles.statusText}>{statusText}</Text>
                        </View>
                      </View>

                      <View style={styles.childChip}>
                        <Text style={styles.childChipText}>
                          {child.dailyLimitHours != null
                            ? `${child.dailyLimitHours}h`
                            : "—"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.childBottom}>
                      <Text style={styles.childMeta}>{dailyLimitText}</Text>
                      <Text style={styles.childChevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* removed Safety + Controls buttons block */}

          <View style={{ height: rs[20] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },
  content: { padding: layout.screenPadding },

  topBar: {
    marginBottom: spacing[5],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  name: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },

  rocketBtn: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253, 189, 75, 0.20)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 4 },
    }),
  },
  rocketIcon: {
    fontSize: 18,
  },

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

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginTop: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: "rgba(255, 70, 70, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 70, 70, 0.22)",
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  alertDot: {
    width: scaleSize(10),
    height: scaleSize(10),
    borderRadius: 999,
    backgroundColor: "#FF4D4D",
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "900",
    color: "#FFD1D1",
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },
  alertChevron: {
    fontSize: scaleFont(26),
    color: "rgba(255,255,255,0.70)",
    marginLeft: spacing[2],
    fontWeight: "900",
  },

  loadingText: {
    color: "rgba(255,255,255,0.65)",
    marginBottom: spacing[3],
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
  },

  emptyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },

  childCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[3],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...shadows.md,
  },
  childTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  childName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: spacing[1],
  },
  childStatusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: {
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: 999,
    marginRight: spacing[2],
  },
  onlineDot: { backgroundColor: colors.semantic.online },
  chargingDot: { backgroundColor: colors.warning[400] },
  offlineDot: { backgroundColor: colors.semantic.offline },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },

  childChip: {
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: "rgba(253, 189, 75, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(253, 189, 75, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  childChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "#FDBD4B",
  },

  childBottom: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childMeta: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },
  childChevron: {
    fontSize: 22,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "900",
  },
});
