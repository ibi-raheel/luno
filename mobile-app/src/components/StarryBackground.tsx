// src/components/StarryBackground.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Star = {
  id: string;
  left: number;
  top: number;
  size: number;
  opacity: number;
  color: string;
  glow: boolean;
};

type Moon = {
  id: string;
  left: number;
  top: number;
  size: number;
  opacity: number;
  rotation: string;
};

const GOLD = "#FDBD4B";
const WHITE = "#FFFFFF";

// deterministic-ish seed so it doesn’t “jump” between renders
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(count: number, rand: () => number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const isGold = rand() < 0.28; // ~28% gold stars
    const glow = rand() < 0.18; // some stars glow
    const size = rand() < 0.12 ? rand() * 3 + 3.5 : rand() * 2 + 1.2; // a few larger “hero” stars

    stars.push({
      id: `star-${i}`,
      left: rand() * SCREEN_WIDTH,
      top: rand() * SCREEN_HEIGHT,
      size,
      opacity: rand() * 0.45 + 0.35, // 0.35–0.80
      color: isGold ? GOLD : WHITE,
      glow,
    });
  }
  return stars;
}

// Simple crescent moon using 2 circles (foreground + cutout)
function CrescentMoon({
  left,
  top,
  size,
  opacity,
  rotation,
}: {
  left: number;
  top: number;
  size: number;
  opacity: number;
  rotation: string;
}) {
  return (
    <View
      style={[
        styles.moonWrap,
        {
          left,
          top,
          width: size,
          height: size,
          opacity,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      <View
        style={[
          styles.moonBase,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
      <View
        style={[
          styles.moonCutout,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            left: size * 0.28,
            top: -size * 0.02,
          },
        ]}
      />
    </View>
  );
}

export function StarryBackground() {
  const { stars, moons } = useMemo(() => {
    const rand = mulberry32(1337); // tweak seed if you want a different “sky”
    const stars = generateStars(180, rand); // more density

    // place a few subtle moons
    const moons: Moon[] = Array.from({ length: 4 }).map((_, idx) => {
      const size = rand() * 26 + 22; // 22–48
      return {
        id: `moon-${idx}`,
        left: rand() * (SCREEN_WIDTH - size),
        top: rand() * (SCREEN_HEIGHT * 0.7), // keep mostly upper 70%
        size,
        opacity: rand() * 0.18 + 0.12, // subtle
        rotation: `${(rand() * 40 - 20).toFixed(1)}deg`,
      };
    });

    return { stars, moons };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* faint vignette wash (adds depth on black) */}
      <View style={styles.vignette} />

      {/* moons (behind stars) */}
      {moons.map((m) => (
        <CrescentMoon
          key={m.id}
          left={m.left}
          top={m.top}
          size={m.size}
          opacity={m.opacity}
          rotation={m.rotation}
        />
      ))}

      {/* stars */}
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            star.glow ? styles.starGlow : null,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
              backgroundColor: star.color,
              shadowColor: star.color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: "#000000",
  },

  // subtle depth so it feels more premium than “flat stars”
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // super soft edges: slightly darker corners via opacity overlay
    opacity: 1,
  },

  star: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 1.5,
    elevation: 1,
  },
  starGlow: {
    shadowOpacity: 0.55,
    shadowRadius: 3.5,
    elevation: 2,
  },

  moonWrap: {
    position: "absolute",
  },
  moonBase: {
    position: "absolute",
    backgroundColor: "rgba(253, 189, 75, 0.85)", // warm moon
    shadowColor: "#FDBD4B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 1,
  },
  moonCutout: {
    position: "absolute",
    backgroundColor: "#000000", // cuts the crescent
  },
});
