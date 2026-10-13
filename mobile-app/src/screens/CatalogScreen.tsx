// src/screens/CatalogScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";

const catalogIcon = require("../../assets/conversations_icon.png"); // requested main image (instead of bear)
const plushieIcon = require("../../assets/plushie_model2.png");

interface Toy {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
}

export default function CatalogScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  const categories = useMemo(
    () => ["All", "Unicorns", "Dragons", "Bears", "Robots"],
    []
  );

  const toys: Toy[] = useMemo(
    () => [
      {
        id: "1",
        name: "Luna the Unicorn",
        description: "A magical unicorn who loves stories",
        price: 49.99,
        icon: "🦄",
        category: "Unicorns",
      },
      {
        id: "2",
        name: "Spark the Dragon",
        description: "A friendly dragon who teaches math",
        price: 54.99,
        icon: "🐉",
        category: "Dragons",
      },
      {
        id: "3",
        name: "Honey the Bear",
        description: "A cuddly bear perfect for bedtime",
        price: 44.99,
        icon: "🐻",
        category: "Bears",
      },
      {
        id: "4",
        name: "Nova the Unicorn",
        description: "An adventurous unicorn explorer",
        price: 49.99,
        icon: "🦄",
        category: "Unicorns",
      },
      {
        id: "5",
        name: "Bolt the Robot",
        description: "A tech-savvy robot companion",
        price: 59.99,
        icon: "🤖",
        category: "Robots",
      },
      {
        id: "6",
        name: "Ember the Dragon",
        description: "A playful dragon who loves games",
        price: 54.99,
        icon: "🐲",
        category: "Dragons",
      },
    ],
    []
  );

  const filteredToys = useMemo(() => {
    return selectedCategory === "All"
      ? toys
      : toys.filter((toy) => toy.category === selectedCategory);
  }, [selectedCategory, toys]);

  const handlePurchase = (toy: Toy) => {
    Alert.alert(
      "Purchase Toy",
      `Would you like to purchase ${toy.name} for $${toy.price.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy Now",
          onPress: () => Alert.alert("Success", "Purchase complete!"),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StarryBackground />
      <LinearGradient
        colors={["rgba(0,0,0,0.90)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.96)"]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={scaleSize(20)} color="#FFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Catalog</Text>
            <Text style={styles.headerSubtitle}>Choose a companion</Text>
          </View>

          <View style={{ width: scaleSize(44) }} />
        </View>

        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingBottom: rs[12],
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient
            colors={[
              "rgba(253,189,75,0.18)",
              "rgba(255,255,255,0.06)",
              "rgba(0,0,0,0.70)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroInner}>
              {/* requested: use conversations_icon as the main image */}
              <View style={styles.heroIconRing}>
                <Image source={catalogIcon} style={styles.heroIconImage} />
              </View>

              <Text style={styles.heroTitle}>Toy Catalog</Text>
              <Text style={styles.heroSub}>
                Explore characters and pick the perfect companion.
              </Text>

              <View style={styles.heroPillsRow}>
                <View style={styles.heroPill}>
                  <Ionicons
                    name="sparkles-outline"
                    size={scaleSize(14)}
                    color="rgba(255,255,255,0.75)"
                  />
                  <Text style={styles.heroPillText}>Personalities</Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={scaleSize(14)}
                    color="rgba(255,255,255,0.75)"
                  />
                  <Text style={styles.heroPillText}>Parent-friendly</Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={scaleSize(14)}
                    color="rgba(255,255,255,0.75)"
                  />
                  <Text style={styles.heroPillText}>Stories</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Categories */}
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.85}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Toys */}
          <Text style={styles.sectionTitle}>AVAILABLE</Text>

          {filteredToys.map((toy) => (
            <View key={toy.id} style={styles.cardOuter}>
              <LinearGradient
                colors={["#050506", "#1A1206", "rgba(253,189,75,0.22)"]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.toyIconRing}>
                    <Image source={plushieIcon} style={styles.toyIconImage} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.toyName} numberOfLines={1}>
                      {toy.name}
                    </Text>
                    <Text style={styles.toyDescription} numberOfLines={2}>
                      {toy.description}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>{toy.category}</Text>
                      </View>
                      <View style={styles.metaPillMuted}>
                        <Text style={styles.metaPillTextMuted}>
                          ${toy.price.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => handlePurchase(toy)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.78)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buyBtnInner}
                  >
                    <Ionicons
                      name="cart-outline"
                      size={scaleSize(16)}
                      color="#0B0B0D"
                    />
                    <Text style={styles.buyBtnText}>Buy Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}

          <View style={{ height: rs[10] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, zIndex: 2 },

  header: {
    paddingTop: rs[2],
    paddingBottom: rs[4],
    flexDirection: "row",
    alignItems: "center",
    gap: rs[3],
  },
  headerIconBtn: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: {
    fontSize: rt.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.60)",
  },

  heroCard: {
    borderRadius: rbr.xl,
    padding: 1,
    marginTop: rs[2],
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  heroInner: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(0,0,0,0.74)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    paddingVertical: rs[6],
    paddingHorizontal: rs[5],
    alignItems: "center",
  },
  heroIconRing: {
    width: scaleSize(78),
    height: scaleSize(78),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,189,75,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    marginBottom: rs[3],
  },
  heroIconImage: {
    width: scaleSize(40),
    height: scaleSize(40),
    resizeMode: "contain",
    opacity: 0.95,
  },
  heroTitle: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  heroSub: {
    marginTop: rs[2],
    fontSize: rt.fontSize.base,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
    textAlign: "center",
  },
  heroPillsRow: {
    flexDirection: "row",
    gap: rs[2],
    marginTop: rs[4],
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs[2],
    paddingVertical: rs[2],
    paddingHorizontal: rs[3],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroPillText: {
    fontSize: rt.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
  },

  sectionTitle: {
    marginTop: rs[6],
    marginBottom: rs[3],
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.85)",
    letterSpacing: 1.4,
  },

  categoriesContent: { paddingVertical: rs[1], paddingRight: rs[2] },
  categoryChip: {
    paddingHorizontal: rs[4],
    paddingVertical: rs[2],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginRight: rs[2],
  },
  categoryChipActive: {
    backgroundColor: "rgba(253,189,75,0.18)",
    borderColor: "rgba(253,189,75,0.26)",
  },
  categoryText: {
    fontSize: rt.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },
  categoryTextActive: { color: "rgba(253,189,75,0.95)" },

  cardOuter: {
    borderRadius: rbr.xl,
    overflow: "hidden",
    marginBottom: rs[4],
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  card: {
    borderRadius: rbr.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.70)",
    padding: rs[5],
  },

  cardHeader: { flexDirection: "row", alignItems: "center", gap: rs[4] },

  toyIconRing: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,189,75,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
  },
  toyIcon: { fontSize: scaleSize(28) },
  toyIconImage: {
    width: scaleSize(36),
    height: scaleSize(36),
    resizeMode: "contain",
    opacity: 0.95,
  },

  toyName: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  toyDescription: {
    marginTop: 4,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
  },

  metaRow: {
    flexDirection: "row",
    gap: rs[2],
    marginTop: rs[3],
    flexWrap: "wrap",
  },
  metaPill: {
    paddingVertical: rs[1],
    paddingHorizontal: rs[3],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  metaPillText: {
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.6,
  },
  metaPillMuted: {
    paddingVertical: rs[1],
    paddingHorizontal: rs[3],
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
  },
  metaPillTextMuted: {
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.95)",
    letterSpacing: 0.6,
  },

  buyBtn: { marginTop: rs[4], borderRadius: 999, overflow: "hidden" },
  buyBtnInner: {
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: rs[2],
  },
  buyBtnText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },
});
