// src/components/FlagCard.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { typography, borderRadius, spacing, shadows } from "../constants/theme";
import { scaleSize } from "../utils/responsive";

interface FlagCardProps {
  childName: string;
  flagType:
    | "personal_info"
    | "inappropriate"
    | "distress"
    | "mature_topic"
    | "unusual_behavior";
  severity: "low" | "medium" | "high" | "critical";
  messagePreview: string;
  timestamp: string;
  onReview: () => void;
  onDismiss: () => void; // kept for compatibility
}

export const FlagCard: React.FC<FlagCardProps> = ({
  childName,
  flagType,
  severity,
  messagePreview,
  timestamp,
  onReview,
}) => {
  const info = useMemo(
    () => getFlagInfo(flagType, severity),
    [flagType, severity]
  );

  return (
    <TouchableOpacity
      style={styles.cardPress}
      onPress={onReview}
      activeOpacity={0.9}
    >
      {/* Black → Gold readable gradient */}
      <LinearGradient
        colors={["#050506", "#120C04", "rgba(253,189,75,0.16)"]}
        locations={[0, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <View style={styles.typeContainer}>
            <View style={[styles.typeDot, { backgroundColor: info.dot }]} />
            <Text style={styles.flagType} numberOfLines={1}>
              {info.label}
            </Text>
          </View>

          <View
            style={[
              styles.severityPill,
              { borderColor: info.sevBorder, backgroundColor: info.sevBg },
            ]}
          >
            <Ionicons
              name={info.sevIcon as any}
              size={scaleSize(14)}
              color={info.sevText}
            />
            <Text style={[styles.severityText, { color: info.sevText }]}>
              {severity.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* MESSAGE PREVIEW */}
        <Text style={styles.messageText} numberOfLines={2}>
          “{messagePreview}”
        </Text>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.meta}>
            <View style={styles.namePill}>
              <Text style={styles.childName} numberOfLines={1}>
                {childName}
              </Text>
            </View>

            <View style={styles.separator} />
            <Text style={styles.timestamp} numberOfLines={1}>
              {timestamp}
            </Text>
          </View>

          <View style={styles.viewPill}>
            <Text style={styles.viewPillText}>View</Text>
            <Text style={styles.viewPillArrow}>›</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const getFlagInfo = (
  type: FlagCardProps["flagType"],
  severity: FlagCardProps["severity"]
) => {
  const typeMap: Record<
    FlagCardProps["flagType"],
    { label: string; dot: string }
  > = {
    personal_info: { label: "Personal Information", dot: "#FF4D4D" },
    inappropriate: { label: "Inappropriate Content", dot: "#FF4D4D" },
    distress: { label: "Emotional Distress", dot: "#FF4D4D" },
    mature_topic: { label: "Mature Topic", dot: "#FDBD4B" },
    unusual_behavior: { label: "Unusual Pattern", dot: "#8BB8FF" },
  };

  const sevMap: Record<
    FlagCardProps["severity"],
    { bg: string; text: string; border: string; icon: string }
  > = {
    low: {
      bg: "rgba(255,255,255,0.06)",
      text: "rgba(255,255,255,0.78)",
      border: "rgba(255,255,255,0.14)",
      icon: "information-circle",
    },
    medium: {
      bg: "rgba(253,189,75,0.10)",
      text: "rgba(253,189,75,0.95)",
      border: "rgba(253,189,75,0.22)",
      icon: "alert-circle",
    },
    high: {
      bg: "rgba(255, 70, 70, 0.12)",
      text: "#FFD1D1",
      border: "rgba(255, 70, 70, 0.22)",
      icon: "warning",
    },
    critical: {
      bg: "rgba(255, 70, 70, 0.18)",
      text: "#FFD1D1",
      border: "rgba(255, 70, 70, 0.28)",
      icon: "skull",
    },
  };

  return {
    ...typeMap[type],
    sevBg: sevMap[severity].bg,
    sevText: sevMap[severity].text,
    sevBorder: sevMap[severity].border,
    sevIcon: sevMap[severity].icon,
  };
};

const styles = StyleSheet.create({
  cardPress: {
    marginBottom: spacing[3],
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 4 },
    }),
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
    gap: spacing[3],
  },

  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  flagType: {
    fontSize: typography.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  messageText: {
    fontSize: typography.fontSize.base,
    color: "rgba(255,255,255,0.78)",
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    marginBottom: spacing[3],
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    gap: spacing[3],
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  namePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    maxWidth: "55%",
  },
  childName: {
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "#FDBD4B",
  },

  separator: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginHorizontal: spacing[2],
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    flex: 1,
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
    borderColor: "rgba(255,255,255,0.12)",
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
});
