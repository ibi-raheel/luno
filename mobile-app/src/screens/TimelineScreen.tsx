// src/screens/TimelineScreen.tsx

import React, { useEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  responsiveSpacing as rs,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { StarryBackground } from "../components/StarryBackground";
import { populateFakeConversations } from "../utils/populateFakeData";
import { safeTimestampToDate } from "../utils/dateHelpers";

interface Child {
  id: string;
  name: string;
}

interface Conversation {
  id: string;
  childId: string | null;
  childName?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  type: string;
  title: string;
  messageCount: number;
  flagged: boolean;
}

type DayGroupKey = "today" | "yesterday" | "older";

interface DailyStats {
  day: string;
  hours: number;
  conversations: number;
}

/**
 * Dashboard-consistent section header: KICKER (caps) + Title + optional action pill.
 */
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

export default function TimelineScreen({ navigation }: any) {
  const { currentUser } = useAuth();

  const [filter, setFilter] = useState<string>("all");
  const [children, setChildren] = useState<Child[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CHILDREN ---
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubscribe = onSnapshot(
      childrenRef,
      (snapshot) => {
        const loadedChildren: Child[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name || "Child",
        }));
        setChildren(loadedChildren);
      },
      (err) => console.error("[TimelineScreen] Error loading children:", err)
    );

    return unsubscribe;
  }, [currentUser]);

  // --- CONVERSATIONS (unified collection) ---
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // NEW: Query unified conversations collection
    const convRef = collection(
      db,
      "users",
      currentUser.uid,
      "conversations"
    );

    const convQuery = query(
      convRef,
      orderBy("startTime", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      convQuery,
      (snapshot) => {
        const allConversations: Conversation[] = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();

          // Get child name from children array or use data.childName
          const child = children.find((c) => c.id === data.childId);

          return {
            id: docSnap.id,
            childId: data.childId || null,
            childName: child?.name || data.childName || "Child",
            startTime: safeTimestampToDate(data.startTime),
            endTime: data.endTime ? safeTimestampToDate(data.endTime) : undefined,
            duration: data.durationMinutes ?? data.duration ?? 0,
            type: data.type ?? "conversation",
            title: data.title ?? "New Conversation",
            messageCount: data.messageCount ?? 0,
            flagged: data.flagged ?? false,
          };
        });

        setConversations(allConversations);
        setLoading(false);
      },
      (err) => {
        console.error(
          "[TimelineScreen] Error loading conversations:",
          err
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, children]);

  // childId -> name map (fallback)
  const childNameMap = useMemo(
    () =>
      children.reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {}),
    [children]
  );

  // Apply filter and ensure childName
  const filteredConversations = useMemo(() => {
    const base =
      filter === "all"
        ? conversations
        : conversations.filter((item) => item.childId === filter);

    return base.map((c) => ({
      ...c,
      childName:
        c.childName ||
        (c.childId ? childNameMap[c.childId] : undefined) ||
        "Child",
    }));
  }, [conversations, filter, childNameMap]);

  // Helpers
  const formatTime = (date: Date): string => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : `${m}`;
    return `${displayH}:${displayM} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    const mins = minutes || 0;
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  };

  const groupConversationsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<DayGroupKey, Conversation[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    filteredConversations.forEach((conv) => {
      const convDate = new Date(conv.startTime);
      convDate.setHours(0, 0, 0, 0);

      if (convDate.getTime() === today.getTime()) groups.today.push(conv);
      else if (convDate.getTime() === yesterday.getTime())
        groups.yesterday.push(conv);
      else groups.older.push(conv);
    });

    return groups;
  };

  const grouped = groupConversationsByDate();

  // Summary (for filter)
  const summary = useMemo(() => {
    const totalMins = filteredConversations.reduce(
      (sum, c) => sum + (c.duration || 0),
      0
    );
    const flagged = filteredConversations.filter((c) => c.flagged).length;

    return {
      totalTime: formatDuration(totalMins),
      totalConversations: filteredConversations.length,
      flagged,
    };
  }, [filteredConversations]);

  // --- THIS WEEK BLOCK (same structure, new color scheme) ---
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const stats: DailyStats[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = weekDays[date.getDay()];

      const dayConversations = filteredConversations.filter((conv) => {
        const d = new Date(conv.startTime);
        return d.toDateString() === date.toDateString();
      });

      const totalMinutes = dayConversations.reduce(
        (sum, conv) => sum + (conv.duration || 0),
        0
      );

      const hours = totalMinutes / 60;

      stats.push({
        day: dayName,
        hours: parseFloat(hours.toFixed(1)),
        conversations: dayConversations.length,
      });
    }

    return stats;
  }, [filteredConversations]);

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1);

  const weeklySummary = useMemo(() => {
    const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);
    const totalConvs = weeklyData.reduce((sum, d) => sum + d.conversations, 0);
    const dailyAvg = totalHours / 7;

    return {
      totalHours: totalHours.toFixed(1),
      totalConvs,
      dailyAvg: dailyAvg.toFixed(1),
    };
  }, [weeklyData]);

  const handleGenerateTestData = async () => {
    if (!currentUser) {
      Alert.alert("Error", "Please log in first");
      return;
    }

    if (children.length === 0) {
      Alert.alert(
        "No Children Found",
        "Please add a child profile first before generating test data."
      );
      return;
    }

    Alert.alert(
      "Generate Test Data",
      "This will create sample conversations for testing. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            try {
              // Safe array access - already checked length above
              const firstChild = children[0];
              // NOTE: populateFakeConversations needs to be updated to use new unified structure
              await populateFakeConversations(currentUser.uid, firstChild.id);
              Alert.alert("Success", "Test data has been generated!");
            } catch (error) {
              console.error("Error generating test data:", error);
              Alert.alert(
                "Error",
                "Failed to generate test data. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllConversations = async () => {
    if (!currentUser) return;

    if (conversations.length === 0) {
      Alert.alert("No Conversations", "There are no conversations to delete.");
      return;
    }

    Alert.alert(
      "Delete All Conversations",
      `Are you sure you want to delete all ${conversations.length} conversation${
        conversations.length > 1 ? "s" : ""
      }? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              // Simply delete each conversation document (messages are now stored in the doc)
              const deletePromises = conversations.map((conv) =>
                deleteDoc(
                  doc(db, "users", currentUser.uid, "conversations", conv.id)
                )
              );

              await Promise.all(deletePromises);
              Alert.alert("Success", "All conversations have been deleted.");
            } catch (error) {
              console.error("Error deleting conversations:", error);
              Alert.alert(
                "Error",
                "Failed to delete conversations. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const FilterPill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => {
    return (
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
  };

  const DateBlock = ({
    label,
    kicker,
    items,
    emptyLabel,
  }: {
    label: string;
    kicker: string;
    items: Conversation[];
    emptyLabel?: string;
  }) => {
    return (
      <View style={{ marginTop: spacing[2] }}>
        <SectionHeader kicker={kicker} title={label} />

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{emptyLabel || "No activity"}</Text>
            <Text style={styles.emptySub}>
              Conversations will show up here as your child talks with Luno.
            </Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* LEFT BAR (dot + line) */}
              <View style={styles.timelineMarker}>
                <View
                  style={[
                    styles.timelineDot,
                    item.flagged
                      ? styles.timelineDotFlagged
                      : styles.timelineDotOk,
                  ]}
                />
                {index < items.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              {/* CARD */}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate("Conversation", {
                    conversationId: item.id,
                    childId: item.childId,
                    childName: item.childName,
                  });
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#050506", "#1A1206", "rgba(253,189,75,0.22)"]}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.timelineCard}
                >
                  <View style={styles.timelineTopRow}>
                    <View style={styles.timelineTitleWrap}>
                      <Text style={styles.timelineTitle} numberOfLines={1}>
                        {item.title || "New Conversation"}
                      </Text>
                      <Text style={styles.timelineMeta} numberOfLines={1}>
                        {item.childName} • {formatTime(item.startTime)} •{" "}
                        {formatDuration(item.duration)}
                      </Text>
                    </View>

                    {item.flagged ? (
                      <View style={styles.flagChip}>
                        <Ionicons
                          name="alert-circle"
                          size={scaleSize(16)}
                          color="#FFD1D1"
                        />
                        <Text style={styles.flagChipText}>Flag</Text>
                      </View>
                    ) : (
                      <View style={styles.okChip}>
                        <Ionicons
                          name="checkmark-circle"
                          size={scaleSize(16)}
                          color="rgba(253,189,75,0.95)"
                        />
                        <Text style={styles.okChipText}>OK</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.timelineBottomRow}>
                    <Text style={styles.timelineMessages}>
                      {item.messageCount} messages
                    </Text>

                    <View style={styles.viewPill}>
                      <Text style={styles.viewPillText}>View</Text>
                      <Text style={styles.viewPillArrow}>›</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );
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
              <Text style={styles.greeting}>ACTIVITY</Text>
              <Text style={styles.pageTitle}>Timeline</Text>
            </View>

            <View style={styles.topIconGroup}>
              <TouchableOpacity
                style={styles.topIconBtn}
                onPress={handleGenerateTestData}
                activeOpacity={0.85}
              >
                <Ionicons name="flask" size={scaleSize(18)} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topIconBtn,
                  conversations.length === 0 && styles.topIconBtnDisabled,
                ]}
                onPress={
                  conversations.length > 0
                    ? handleDeleteAllConversations
                    : undefined
                }
                activeOpacity={conversations.length > 0 ? 0.85 : 1}
                disabled={conversations.length === 0}
              >
                <Ionicons
                  name="trash-outline"
                  size={scaleSize(18)}
                  color={
                    conversations.length > 0 ? "#FDBD4B" : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* FILTER PILLS */}
          <View style={styles.filtersRow}>
            <FilterPill
              label="All"
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            {children.map((c) => (
              <FilterPill
                key={c.id}
                label={c.name}
                active={filter === c.id}
                onPress={() => setFilter(c.id)}
              />
            ))}
          </View>

          {/* SUMMARY STRIP */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryKicker}>TOTAL TIME</Text>
              <Text style={styles.summaryValue}>{summary.totalTime}</Text>
            </View>

            <View style={styles.summaryPill}>
              <Text style={styles.summaryKicker}>CONVERSATIONS</Text>
              <Text style={styles.summaryValue}>
                {summary.totalConversations}
              </Text>
            </View>

            <View style={styles.summaryPill}>
              <Text style={styles.summaryKicker}>FLAGS</Text>
              <Text style={styles.summaryValue}>{summary.flagged}</Text>
            </View>
          </View>

          {/* THIS WEEK ACTIVITY (same block, new colors) */}
          <View style={{ marginTop: spacing[2] }}>
            <SectionHeader kicker="OVERVIEW" title="This week’s activity" />

            <LinearGradient
              colors={["#050506", "#120C04", "rgba(253,189,75,0.16)"]}
              locations={[0, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.weekCard}
            >
              <Text style={styles.weekLabel}>Screen time (hours)</Text>

              <View style={styles.weekChart}>
                {weeklyData.map((d, idx) => {
                  const pct = Math.max((d.hours / maxHours) * 100, 6);
                  return (
                    <View key={`${d.day}-${idx}`} style={styles.weekBarCol}>
                      <View style={styles.weekBarTrack}>
                        <LinearGradient
                          colors={["rgba(253,189,75,0.25)", "#FDBD4B"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[styles.weekBarFill, { height: `${pct}%` }]}
                        />
                      </View>
                      <Text style={styles.weekDay}>{d.day}</Text>
                      <Text style={styles.weekValue}>{d.hours}h</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.weekSummaryRow}>
                <View style={styles.weekSummaryItem}>
                  <Text style={styles.weekSummaryValue}>
                    {weeklySummary.totalHours}h
                  </Text>
                  <Text style={styles.weekSummarySub}>Total time</Text>
                </View>

                <View style={styles.weekSummaryDivider} />

                <View style={styles.weekSummaryItem}>
                  <Text style={styles.weekSummaryValue}>
                    {weeklySummary.totalConvs}
                  </Text>
                  <Text style={styles.weekSummarySub}>Conversations</Text>
                </View>

                <View style={styles.weekSummaryDivider} />

                <View style={styles.weekSummaryItem}>
                  <Text style={styles.weekSummaryValue}>
                    {weeklySummary.dailyAvg}h
                  </Text>
                  <Text style={styles.weekSummarySub}>Daily avg</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* LIST */}
          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading timeline...</Text>
            </View>
          ) : (
            <>
              <DateBlock
                kicker="TODAY"
                label="Today"
                items={grouped.today}
                emptyLabel="No activity today"
              />
              <DateBlock
                kicker="YESTERDAY"
                label="Yesterday"
                items={grouped.yesterday}
                emptyLabel="No activity yesterday"
              />
              <DateBlock
                kicker="HISTORY"
                label="Older"
                items={grouped.older}
                emptyLabel="No older activity"
              />
            </>
          )}

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

  // Top bar (Dashboard style)
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
  pageTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },
  topIconGroup: {
    flexDirection: "row",
    gap: spacing[2],
  },
  topIconBtn: {
    width: scaleSize(38),
    height: scaleSize(38),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topIconBtnDisabled: {
    opacity: 0.4,
  },

  // Section header (Dashboard-consistent)
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
  filterTextActive: {
    color: "#FDBD4B",
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  summaryPill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  summaryKicker: {
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: typography.fontSize.lg,
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  // --- THIS WEEK CARD (new theme) ---
  weekCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    ...shadows.md,
  },
  weekLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.78)",
    marginBottom: spacing[3],
    letterSpacing: 0.2,
  },
  weekChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: scaleSize(140),
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  weekBarCol: {
    flex: 1,
    alignItems: "center",
  },
  weekBarTrack: {
    width: "100%",
    height: scaleSize(90),
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  weekBarFill: {
    width: "100%",
    borderRadius: 12,
  },
  weekDay: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "rgba(255,255,255,0.70)",
    letterSpacing: 0.6,
  },
  weekValue: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  weekSummaryRow: {
    flexDirection: "row",
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  weekSummaryItem: { flex: 1, alignItems: "center" },
  weekSummaryValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  weekSummarySub: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
  },
  weekSummaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  // --- TIMELINE (bar + cards) ---
  timelineItem: {
    flexDirection: "row",
    marginBottom: spacing[4],
  },
  timelineMarker: {
    width: scaleSize(22),
    alignItems: "center",
    marginRight: spacing[3],
  },
  timelineDot: {
    width: scaleSize(12),
    height: scaleSize(12),
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.65)",
    marginTop: spacing[1],
  },
  timelineDotOk: {
    backgroundColor: "rgba(253,189,75,0.95)",
    shadowColor: "#FDBD4B",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  timelineDotFlagged: {
    backgroundColor: "#FF4D4D",
    shadowColor: "#FF4D4D",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  timelineLine: {
    width: scaleSize(2),
    flex: 1,
    marginTop: spacing[2],
    backgroundColor: "rgba(253,189,75,0.22)",
  },

  // Timeline cards (LinearGradient container)
  timelineCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    ...shadows.md,
  },
  timelineTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  timelineTitleWrap: { flex: 1 },
  timelineTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: spacing[1],
  },
  timelineMeta: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
  },

  okChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
  },
  okChipText: {
    fontSize: typography.fontSize.xs,
    color: "rgba(253,189,75,0.95)",
    fontWeight: "900",
  },
  flagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 999,
    backgroundColor: "rgba(255, 70, 70, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 70, 70, 0.22)",
  },
  flagChipText: {
    fontSize: typography.fontSize.xs,
    color: "#FFD1D1",
    fontWeight: "900",
  },

  timelineBottomRow: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineMessages: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
  },
  viewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  viewPillText: {
    fontSize: typography.fontSize.sm,
    color: "#FDBD4B",
    fontWeight: "900",
  },
  viewPillArrow: {
    fontSize: typography.fontSize.lg,
    color: "#FDBD4B",
    marginTop: -1,
    fontWeight: "900",
  },

  // Loading / Empty
  loadingCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    textAlign: "center",
  },
  emptyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...shadows.md,
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
});
