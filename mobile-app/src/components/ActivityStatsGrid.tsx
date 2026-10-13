// src/components/ActivityStatsGridMini.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { scaleSize } from "../utils/responsive";
import { typography, spacing, borderRadius } from "../constants/theme";

type Props = {
  childrenCount: number;
  totalScreenTime: string; // e.g. "2H"
  conversationsCount: number;
  onViewAllPress?: () => void;
};

type StatCardProps = {
  icon: any;
  stat: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  accent: string; // glow color
};

export function ActivityStatsGridMini({
  childrenCount,
  totalScreenTime,
  conversationsCount,
  onViewAllPress,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          icon={require("../../assets/children_icon.png")}
          stat={`${childrenCount}`}
          label="Children"
          sub="profiles"
          accent="#FDBD4B" // Luno gold
          onPress={onViewAllPress}
        />

        <StatCard
          icon={require("../../assets/screentime_icon.png")}
          stat={totalScreenTime}
          label="Talk time"
          sub="today"
          accent="#FFB347" // warm amber (no purple)
          onPress={onViewAllPress}
        />

        <StatCard
          icon={require("../../assets/conversations_icon.png")}
          stat={`${conversationsCount}`}
          label="Chats"
          sub="total"
          accent="#C77D2E" // rich caramel (no green)
          onPress={onViewAllPress}
        />
      </View>
    </View>
  );
}

function StatCard({ icon, stat, label, sub, onPress, accent }: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.cardOuter,
        pressed && onPress ? styles.cardPressed : null,
      ]}
      android_ripple={
        onPress
          ? { color: "rgba(253,189,75,0.14)", borderless: false }
          : undefined
      }
    >
      <LinearGradient
        // warm glass (still vibrant, still consistent)
        colors={["rgba(255, 210, 140, 0.16)", "rgba(0,0,0,0.10)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Accent glow */}
        <View style={[styles.accentGlow, { backgroundColor: accent }]} />

        {/* Big Luno icon */}
        <Image source={icon} style={styles.icon} resizeMode="contain" />

        {/* Center aligned text */}
        <View style={styles.centerWrap}>
          <Text style={styles.stat}>{stat}</Text>
          <Text style={styles.label}>{label}</Text>
          {!!sub && <Text style={styles.sub}>{sub}</Text>}
        </View>

        {/* warm corner highlight */}
        <View style={styles.cornerGlow} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[4],
    marginBottom: spacing[5],
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  overview: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 1.6,
    color: "rgba(253,189,75,0.85)",
    fontWeight: "900",
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  viewAllBtn: {
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
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: "#FDBD4B",
    fontWeight: "900",
  },
  viewAllArrow: {
    fontSize: typography.fontSize.lg,
    color: "#FDBD4B",
    marginTop: -1,
    fontWeight: "900",
  },

  row: {
    flexDirection: "row",
    gap: spacing[2],
  },

  cardOuter: {
    flex: 1,
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
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.98,
  },

  card: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    minHeight: scaleSize(172),

    borderWidth: 1,
    borderColor: "rgba(253, 189, 75, 0.18)",

    backgroundColor: "rgba(0,0,0,0.22)",
    overflow: "hidden",

    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: scaleSize(84),
    height: scaleSize(84),
    marginBottom: spacing[2],
  },

  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  stat: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textAlign: "center",
    lineHeight: typography.fontSize["2xl"] + 2,
  },
  label: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.86)",
    textAlign: "center",
  },
  sub: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.92)",
    textAlign: "center",
  },

  accentGlow: {
    position: "absolute",
    width: scaleSize(190),
    height: scaleSize(190),
    borderRadius: 999,
    opacity: 0.18,
    top: -scaleSize(70),
    left: -scaleSize(60),
  },

  cornerGlow: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: "rgba(255, 179, 71, 0.10)", // warm amber corner
  },
});
