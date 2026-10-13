// src/components/ProductShowcaseCard.tsx
import React from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { spacing, typography, borderRadius } from "../constants/theme";
import { scaleSize } from "../utils/responsive";

export function ProductShowcaseCard() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(253,189,75,0.10)",
          "rgba(0,0,0,0.64)",
          "rgba(0,0,0,0.92)",
        ]}
        start={{ x: 0.05, y: 0.0 }}
        end={{ x: 0.95, y: 1.0 }}
        style={styles.card}
      >
        {/* subtle highlight + corner glow */}
        <View style={styles.topHighlight} />
        <View style={styles.cornerGlow} />

        {/* Badge */}
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>MEET LUNO</Text>
        </View>

        {/* BIG CENTER LUNO */}
        <View style={styles.hero}>
          <View style={styles.glowCircle} />
          <Image
            source={require("../../assets/plushie_model2.png")}
            style={styles.plushie}
            resizeMode="contain"
          />
        </View>

        {/* Byline (tight) */}
        <Text style={styles.byline}>
          Your child’s companion, always present.
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing[5] },

  card: {
    borderRadius: borderRadius.xl,
    paddingTop: spacing[4],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    backgroundColor: "rgba(0,0,0,0.55)",
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

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: scaleSize(80),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cornerGlow: {
    position: "absolute",
    top: -scaleSize(46),
    right: -scaleSize(46),
    width: scaleSize(170),
    height: scaleSize(170),
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.10)",
  },

  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
  },
  badgeDot: {
    width: scaleSize(7),
    height: scaleSize(7),
    borderRadius: 999,
    backgroundColor: "#FDBD4B",
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.95)",
    letterSpacing: 1.4,
  },

  hero: {
    marginTop: spacing[2],
    marginBottom: spacing[2],
    alignItems: "center",
    justifyContent: "center",
    minHeight: scaleSize(240),
  },
  glowCircle: {
    position: "absolute",
    width: scaleSize(240),
    height: scaleSize(240),
    borderRadius: scaleSize(120),
    backgroundColor: "rgba(253,189,75,0.16)",
    shadowColor: "#FDBD4B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 34,
    elevation: 10,
  },
  plushie: {
    width: scaleSize(290),
    height: scaleSize(300),
    marginTop: -scaleSize(10),
  },

  byline: {
    textAlign: "center",
    fontSize: typography.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
  },
});
