// src/screens/ConversationScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import {
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";
import { safeTimestampToDate } from "../utils/dateHelpers";

const infoIcon = require("../../assets/info_icon.png");

interface Message {
  sender: "child" | "toy" | string;
  content: string;
  timestamp: any; // Firestore Timestamp
  flagged?: boolean;
  flagReason?: string | null;
}

interface ConversationDoc {
  childId?: string | null;
  childName?: string;
  toyName?: string;
  startTime?: any;
  endTime?: any;
  duration?: number; // minutes
  type?: string;
  title?: string;
  messageCount?: number;

  flagged?: boolean;
  flagReason?: string | null;
  flagType?: "personal_info" | "unusual_behavior" | "mature_topic" | "other";
  severity?: "low" | "medium" | "critical";

  // NEW: messages stored as array in the document
  messages?: Message[];
}

interface MessageDoc {
  id: string;
  sender: "child" | "toy" | string;
  content: string;
  timestamp: Date;
  flagged?: boolean;
  flagReason?: string | null;
}

export default function ConversationScreen({ route, navigation }: any) {
  const { currentUser } = useAuth();

  const conversationId: string | undefined = route?.params?.conversationId;
  // Note: childId is now stored in the conversation document, not passed as param
  const childNameFromRoute: string | undefined = route?.params?.childName;

  const [conversation, setConversation] = useState<ConversationDoc | null>(
    null
  );
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const listRef = useRef<FlatList<MessageDoc>>(null);
  const isMountedRef = useRef(true);

  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  // Track component mount status
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !conversationId) {
      setLoading(false);
      return;
    }

    // Fetch conversation with messages array from unified conversations collection
    const convRef = doc(
      db,
      "users",
      currentUser.uid,
      "conversations",
      conversationId
    );

    const unsubscribe = onSnapshot(
      convRef,
      (snap) => {
        if (!snap.exists()) {
          setConversation(null);
          setMessages([]);
          setLoading(false);
          return;
        }

        const data = snap.data() as ConversationDoc;
        setConversation(data);

        // Extract messages from the messages array in the document
        const messagesArray = data.messages || [];
        const loaded: MessageDoc[] = messagesArray.map((m, index) => ({
          id: `msg-${index}`, // Generate simple ID since we don't have doc IDs anymore
          sender: m.sender || "toy",
          content: m.content || "",
          timestamp: safeTimestampToDate(m.timestamp),
          flagged: !!m.flagged,
          flagReason: m.flagReason || null,
        }));

        if (isMountedRef.current) {
          setMessages(loaded);

          requestAnimationFrame(() => {
            if (isMountedRef.current && listRef.current) {
              listRef.current.scrollToEnd({ animated: false });
            }
          });
        }

        setLoading(false);
      },
      (err) => {
        console.error("[ConversationScreen] Error loading conversation:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, conversationId]);

  const computed = useMemo(() => {
    const childName = childNameFromRoute || conversation?.childName || "Child";
    const toyName = conversation?.toyName || "Luno";

    const durationLabel =
      conversation?.duration != null ? `${conversation.duration} min` : "—";

    let dateLabel = "Conversation";
    if (conversation?.startTime?.toDate) {
      const d = conversation.startTime.toDate();
      dateLabel = `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    const isFlagged = !!conversation?.flagged;
    const flagReason =
      conversation?.flagReason ||
      "Something in this conversation needs review.";
    const severityLabel = conversation?.severity
      ? conversation.severity.charAt(0).toUpperCase() +
        conversation.severity.slice(1)
      : null;

    return {
      childName,
      toyName,
      durationLabel,
      dateLabel,
      isFlagged,
      flagReason,
      severityLabel,
    };
  }, [conversation, childNameFromRoute]);

  const handleDismissFlag = async () => {
    if (!currentUser || !conversationId) return;

    try {
      // NEW: Update in unified conversations collection
      const convRef = doc(
        db,
        "users",
        currentUser.uid,
        "conversations",
        conversationId
      );

      await updateDoc(convRef, {
        flagStatus: "reviewed",
      });

      if (isMountedRef.current) {
        Alert.alert("Flag Reviewed", "This flag has been marked as reviewed.");
        navigation.goBack();
      }
    } catch (err) {
      console.error(
        "[ConversationScreen] Error marking flag as reviewed:",
        err
      );
      if (isMountedRef.current) {
        Alert.alert("Error", "Could not update flag status. Please try again.");
      }
    }
  };

  const handleBlockTopic = () => {
    Alert.alert(
      "Block Topic",
      "Wire this to parental controls (e.g., update blockedTopics on the child profile)."
    );
  };

  const handleInfoPress = () => {
    // Hook this up to whatever you want (details modal, help, etc.)
    Alert.alert("Info", "Conversation details / help can go here.");
  };

  const renderMessage = ({ item }: ListRenderItemInfo<MessageDoc>) => {
    const isChild = item.sender === "child";

    return (
      <View style={[styles.msgRow, isChild ? styles.msgRight : styles.msgLeft]}>
        <View style={[styles.bubbleWrap, { maxWidth: "84%" }]}>
          {isChild ? (
            <LinearGradient
              colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.75)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.bubble,
                styles.childBubble,
                item.flagged && styles.flaggedBubble,
              ]}
            >
              {item.flagged && (
                <View style={styles.flagPill}>
                  <Ionicons
                    name="warning"
                    size={scaleSize(12)}
                    color="#0B0B0D"
                  />
                  <Text style={styles.flagPillText}>Flagged</Text>
                </View>
              )}

              <Text style={[styles.msgText, styles.childText]}>
                {item.content}
              </Text>
              <Text style={[styles.timeText, styles.childTime]}>
                {item.timestamp.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.bubble,
                styles.toyBubble,
                item.flagged && styles.flaggedBubble,
              ]}
            >
              {item.flagged && (
                <View style={styles.flagPillDark}>
                  <Ionicons
                    name="warning"
                    size={scaleSize(12)}
                    color="#FDBD4B"
                  />
                  <Text style={styles.flagPillTextDark}>Flagged</Text>
                </View>
              )}

              <Text style={[styles.msgText, styles.toyText]}>
                {item.content}
              </Text>
              <Text style={[styles.timeText, styles.toyTime]}>
                {item.timestamp.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ---------- Missing params ----------
  if (!conversationId) {
    return (
      <View style={styles.container}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <StarryBackground />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.90)",
              "rgba(0,0,0,0.30)",
              "rgba(0,0,0,0.95)",
            ]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={[styles.center, { paddingHorizontal: screenPadding }]}>
            <Text style={styles.errorTitle}>No conversation selected</Text>
            <Text style={styles.errorSub}>Please go back and choose one.</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.75)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnInner}
              >
                <Text style={styles.primaryBtnText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---------- Loading ----------
  if (loading) {
    return (
      <View style={styles.container}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <StarryBackground />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.90)",
              "rgba(0,0,0,0.30)",
              "rgba(0,0,0,0.95)",
            ]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FDBD4B" />
            <Text style={styles.loadingText}>Loading conversation…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---------- Not found ----------
  if (!conversation) {
    return (
      <View style={styles.container}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <StarryBackground />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.90)",
              "rgba(0,0,0,0.30)",
              "rgba(0,0,0,0.95)",
            ]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={[styles.center, { paddingHorizontal: screenPadding }]}>
            <Text style={styles.errorTitle}>Conversation not found</Text>
            <Text style={styles.errorSub}>
              It may have been deleted or moved.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.75)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnInner}
              >
                <Text style={styles.primaryBtnText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---------- Main UI ----------
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <StarryBackground />
        <LinearGradient
          colors={["rgba(0,0,0,0.90)", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.95)"]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            activeOpacity={0.85}
          >
            <Ionicons
              name="chevron-back"
              size={scaleSize(22)}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {computed.childName} &amp; {computed.toyName}
            </Text>
            <Text style={styles.headerSubtitle}>
              {computed.dateLabel} • {computed.durationLabel}
            </Text>
          </View>

          {/* TOP RIGHT: info_icon from assets */}
          <TouchableOpacity
            onPress={handleInfoPress}
            style={styles.headerBtn}
            activeOpacity={0.85}
          >
            <Image source={infoIcon} style={styles.headerInfoIcon} />
          </TouchableOpacity>
        </View>

        {/* Flag banner */}
        {computed.isFlagged && (
          <View
            style={[styles.flagBanner, { paddingHorizontal: screenPadding }]}
          >
            <LinearGradient
              colors={["rgba(255,59,59,0.35)", "rgba(253,189,75,0.18)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.flagBannerGradient}
            >
              <View style={styles.flagLeft}>
                <View style={styles.flagIcon}>
                  <Ionicons
                    name="warning"
                    size={scaleSize(16)}
                    color="#0B0B0D"
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.flagTopRow}>
                  <Text style={styles.flagTitle}>Flagged Conversation</Text>

                  {!!computed.severityLabel && (
                    <View style={styles.severityPill}>
                      <Text style={styles.severityText}>
                        {computed.severityLabel}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.flagReason}>{computed.flagReason}</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingTop: rs[3],
            paddingBottom: scaleSize(150), // extra so messages don't hide behind bottom bar
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (Platform.OS === "ios") {
              requestAnimationFrame(() => {
                listRef.current?.scrollToEnd({ animated: false });
              });
            }
          }}
        />

        {/* Bottom actions + dark black shadow background */}
        <View style={styles.bottomWrap} pointerEvents="box-none">
          <View
            style={[
              styles.bottomBackdrop,
              { paddingHorizontal: screenPadding },
            ]}
          >
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGhost]}
                onPress={handleDismissFlag}
                activeOpacity={0.9}
              >
                <Text style={styles.actionGhostText}>Dismiss Flag</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={handleBlockTopic}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.75)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionPrimaryInner}
                >
                  <Text style={styles.actionPrimaryText}>Block Topic</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, zIndex: 2 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: {
    marginTop: rs[4],
    fontSize: rt.fontSize.base,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },

  errorTitle: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: rs[2],
  },
  errorSub: {
    fontSize: rt.fontSize.base,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginBottom: rs[6],
  },

  // Header
  header: {
    paddingTop: rs[2],
    paddingBottom: rs[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
    textAlign: "center",
  },
  headerInfoIcon: {
    width: scaleSize(22),
    height: scaleSize(22),
    resizeMode: "contain",
    opacity: 0.95,
  },

  // Flag banner
  flagBanner: { marginBottom: rs[3] },
  flagBannerGradient: {
    borderRadius: rbr.xl,
    padding: rs[4],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: rs[4],
  },
  flagLeft: { alignItems: "center", justifyContent: "center" },
  flagIcon: {
    width: scaleSize(38),
    height: scaleSize(38),
    borderRadius: 999,
    backgroundColor: "#FDBD4B",
    alignItems: "center",
    justifyContent: "center",
  },
  flagTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flagTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#0B0B0D",
  },
  severityPill: {
    paddingHorizontal: rs[3],
    paddingVertical: rs[1],
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  severityText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "900",
    fontSize: rt.fontSize.xs,
    letterSpacing: 0.2,
  },
  flagReason: {
    marginTop: rs[2],
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(11,11,13,0.78)",
  },

  // Messages
  msgRow: { marginBottom: rs[4] },
  msgLeft: { alignItems: "flex-start" },
  msgRight: { alignItems: "flex-end" },
  bubbleWrap: { maxWidth: "84%" },

  bubble: {
    borderRadius: rbr.xl,
    paddingVertical: rs[4],
    paddingHorizontal: rs[4],
  },
  childBubble: {
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
  },
  toyBubble: {
    backgroundColor: "rgba(0,0,0,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  flaggedBubble: {
    borderWidth: 2,
    borderColor: "rgba(255,59,59,0.75)",
  },

  flagPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: rs[2],
    paddingHorizontal: rs[3],
    paddingVertical: rs[1],
    borderRadius: 999,
    backgroundColor: "rgba(11,11,13,0.10)",
    marginBottom: rs[2],
  },
  flagPillText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.xs,
  },

  flagPillDark: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: rs[2],
    paddingHorizontal: rs[3],
    paddingVertical: rs[1],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: rs[2],
  },
  flagPillTextDark: {
    color: "rgba(255,255,255,0.80)",
    fontWeight: "900",
    fontSize: rt.fontSize.xs,
  },

  msgText: {
    fontSize: rt.fontSize.base,
    fontWeight: "700",
    lineHeight: rt.fontSize.base * 1.35,
  },
  childText: { color: "#0B0B0D" },
  toyText: { color: "rgba(255,255,255,0.92)" },

  timeText: { marginTop: rs[2], fontSize: rt.fontSize.xs, fontWeight: "800" },
  childTime: { color: "rgba(11,11,13,0.65)" },
  toyTime: { color: "rgba(255,255,255,0.45)" },

  // Bottom actions background + bar
  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: rs[2],
  },
  bottomBackdrop: {
    // dark solid black background behind the buttons area
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: rs[3],
    paddingBottom: rs[4],
    // heavy shadow behind the whole area
    shadowColor: "#000",
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -12 },
    elevation: 30,
  },
  bottomBar: {
    flexDirection: "row",
    gap: rs[3],
  },

  actionBtn: {
    flex: 1,
    borderRadius: rbr.xl,
    overflow: "hidden",
  },
  actionBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  actionGhostText: {
    color: "rgba(255,255,255,0.82)",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },
  actionBtnPrimary: {
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  actionPrimaryInner: {
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rbr.xl,
  },
  actionPrimaryText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },

  // Primary button (error states)
  primaryBtn: {
    width: "100%",
    maxWidth: scaleSize(420),
    borderRadius: rbr.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  primaryBtnInner: {
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },
});
