// src/components/ChildCard.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";

interface ChildCardProps {
  childName: string;
  age: number;
  toyName: string;
  toyStatus: "online" | "offline";
  playtimeToday: string;
  activitiesCount: number;
  lastActivity: string;
  flagsCount: number;
  onPress?: () => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({
  childName,
  age,
  toyName,
  toyStatus,
  playtimeToday,
  activitiesCount,
  lastActivity,
  flagsCount,
  onPress,
}) => {
  const isOnline = toyStatus === "online";
  const hasFlags = flagsCount > 0;

  return (
    <TouchableOpacity
      style={styles.cardOuter}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.card}>
        {/* subtle warm accent */}
        <View style={styles.accentGlow} />
        <View style={styles.cornerGlow} />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.childName} numberOfLines={1}>
              {childName}
            </Text>
            <Text style={styles.age}>(Age {age})</Text>
          </View>

          {hasFlags ? (
            <View style={styles.flagChip}>
              <Text style={styles.flagChipIcon}>⚠️</Text>
              <Text style={styles.flagChipText}>
                {flagsCount} flag{flagsCount > 1 ? "s" : ""}
              </Text>
            </View>
          ) : (
            <View style={styles.okChip}>
              <Text style={styles.okChipText}>✓ No flags</Text>
            </View>
          )}
        </View>

        {/* TOY STATUS */}
        <View style={styles.toyRow}>
          <View
            style={[
              styles.statusDot,
              isOnline ? styles.statusDotOnline : styles.statusDotOffline,
            ]}
          />
          <Text style={styles.toyText} numberOfLines={1}>
            {toyName}{" "}
            <Text style={styles.toyTextDim}>
              • {isOnline ? "Online" : "Offline"}
            </Text>
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{playtimeToday}</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Activities</Text>
            <Text style={styles.statValue}>{activitiesCount}</Text>
          </View>
        </View>

        <Text style={styles.lastActivity} numberOfLines={2}>
          Last activity:{" "}
          <Text style={styles.lastActivityValue}>{lastActivity}</Text>
        </Text>

        {/* FOOTER MESSAGE */}
        {hasFlags ? (
          <View style={styles.footerWarning}>
            <Text style={styles.footerWarningText}>
              Review {flagsCount} flag{flagsCount > 1 ? "s" : ""} to keep things
              safe.
            </Text>
            <Text style={styles.footerChevron}>›</Text>
          </View>
        ) : (
          <View style={styles.footerOk}>
            <Text style={styles.footerOkText}>All clear for now.</Text>
            <Text style={styles.footerChevron}>›</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const GOLD = "#FDBD4B";

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: spacing[4],
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 6 },
    }),
  },

  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    ...shadows.md,
  },

  accentGlow: {
    position: "absolute",
    width: scaleSize(220),
    height: scaleSize(220),
    borderRadius: 999,
    left: -scaleSize(90),
    top: -scaleSize(110),
    backgroundColor: "rgba(253,189,75,0.16)",
  },
  cornerGlow: {
    position: "absolute",
    right: -scaleSize(30),
    top: -scaleSize(30),
    width: scaleSize(110),
    height: scaleSize(110),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
    gap: spacing[2],
  },
  childName: {
    fontSize: typography.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    maxWidth: "70%",
  },
  age: {
    fontSize: typography.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },

  flagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "rgba(255,77,77,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.22)",
  },
  flagChipIcon: { fontSize: 12 },
  flagChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "#FFD1D1",
    letterSpacing: 0.3,
  },

  okChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.20)",
  },
  okChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.95)",
    letterSpacing: 0.3,
  },

  toyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  statusDot: {
    width: scaleSize(9),
    height: scaleSize(9),
    borderRadius: 999,
    marginRight: spacing[2],
  },
  statusDotOnline: {
    backgroundColor: GOLD,
  },
  statusDotOffline: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  toyText: {
    fontSize: typography.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
    flex: 1,
  },
  toyTextDim: {
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  statPill: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  lastActivity: {
    fontSize: typography.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    marginBottom: spacing[3],
    lineHeight: typography.fontSize.sm * 1.5,
  },
  lastActivityValue: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
  },

  footerOk: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  footerOkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "rgba(253,189,75,0.92)",
  },

  footerWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  footerWarningText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "#FFD1D1",
  },

  footerChevron: {
    fontSize: 22,
    fontWeight: "900",
    color: "rgba(255,255,255,0.70)",
    marginLeft: spacing[2],
  },
});
