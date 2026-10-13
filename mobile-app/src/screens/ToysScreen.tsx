// src/screens/ToysScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";

import {
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";
import { ToyCard } from "../components/ToyCard";

const infoIcon = require("../../assets/info_icon.png");

interface Toy {
  id: string;
  name: string;
  emoji: string;
  status: "online" | "offline" | "charging";
  assignedTo?: string;
  assignedChildId: string | null;
  batteryLevel: number;
  lastConnected: any;
  firmwareVersion: string;
  wifiConnected: boolean;
  wifiSSID?: string;
}

export default function ToysScreen({ navigation }: any) {
  const { currentUser } = useAuth();
  const [toys, setToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);
  const [childrenMap, setChildrenMap] = useState<Record<string, string>>({});

  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  // Load children first (separate effect to avoid N+1 queries)
  useEffect(() => {
    if (!currentUser) {
      setChildrenMap({});
      return;
    }

    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubscribe = onSnapshot(
      childrenRef,
      (snapshot) => {
        const map: Record<string, string> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          map[doc.id] = data.name || "Child";
        });
        setChildrenMap(map);
      },
      (err) => {
        console.error("[ToysScreen] Error loading children:", err);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Load toys (synchronous callback using childrenMap)
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const toysRef = collection(db, "users", currentUser.uid, "toys");

    const unsubscribe = onSnapshot(
      toysRef,
      (snapshot) => {
        const loadedToys: Toy[] = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();

          // Resolve assignedTo from childrenMap (no async needed!)
          const assignedTo = data.assignedChildId
            ? childrenMap[data.assignedChildId]
            : undefined;

          return {
            id: docSnap.id,
            name: data.name || "Toy",
            emoji: data.emoji || "🦄",
            status: data.status || "offline",
            assignedTo,
            assignedChildId: data.assignedChildId || null,
            batteryLevel: data.batteryLevel || 0,
            lastConnected: data.lastConnected,
            firmwareVersion: data.firmwareVersion || "v1.0.0",
            wifiConnected: data.wifiConnected || false,
            wifiSSID: data.wifiSSID,
          };
        });

        setToys(loadedToys);
        setLoading(false);
      },
      (err) => {
        console.error("[ToysScreen] onSnapshot error:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, childrenMap]);

  const { connectedToys, unassignedToys } = useMemo(() => {
    const connected = toys.filter((t) => t.assignedChildId !== null);
    const unassigned = toys.filter((t) => t.assignedChildId === null);
    return { connectedToys: connected, unassignedToys: unassigned };
  }, [toys]);

  const totalCount = connectedToys.length + unassignedToys.length;

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
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Connected Toys</Text>
            <Text style={styles.subtitle}>
              {loading
                ? "Loading…"
                : `${totalCount} toy${totalCount === 1 ? "" : "s"}`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={
              () => navigation.navigate("AddToy") // keep simple + useful
            }
            style={styles.headerBtn}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={scaleSize(20)} color="#0B0B0D" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              // replace with your help/tooltip route if you have one
              navigation.navigate("AddToy")
            }
            style={styles.headerIconBtn}
            activeOpacity={0.85}
          >
            <Image source={infoIcon} style={styles.headerInfoIcon} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingBottom: rs[12],
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Loading */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#FDBD4B" />
              <Text style={styles.loadingText}>Loading toys…</Text>
            </View>
          ) : totalCount === 0 ? (
            <LinearGradient
              colors={[
                "rgba(253,189,75,0.18)",
                "rgba(255,255,255,0.06)",
                "rgba(0,0,0,0.58)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyCard}
            >
              <View style={styles.emptyInner}>
                <View style={styles.emptyIconRing}>
                  <Ionicons
                    name="bluetooth-outline"
                    size={scaleSize(22)}
                    color="rgba(253,189,75,0.95)"
                  />
                </View>

                <Text style={styles.emptyTitle}>No toys yet</Text>
                <Text style={styles.emptySub}>
                  Pair a new toy to get started. You can assign it to a child
                  anytime.
                </Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => navigation.navigate("AddToy")}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.78)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnInner}
                  >
                    <Text style={styles.primaryBtnText}>Pair New Toy</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <>
              {/* Connected */}
              {connectedToys.map((toy) => (
                <ToyCard
                  key={toy.id}
                  toyName={toy.name}
                  toyEmoji={toy.emoji}
                  status={toy.status}
                  assignedTo={toy.assignedTo}
                  batteryLevel={toy.batteryLevel}
                  lastActive={""}
                  firmwareVersion={toy.firmwareVersion}
                  updateAvailable={false}
                  wifiConnected={toy.wifiConnected}
                  wifiSSID={toy.wifiSSID}
                  onPress={() =>
                    navigation.navigate("ToySettings", { toyId: toy.id })
                  }
                  onSettings={() =>
                    navigation.navigate("ToySettings", { toyId: toy.id })
                  }
                  onUpdate={() =>
                    navigation.navigate("ToySettings", { toyId: toy.id })
                  }
                />
              ))}

              {/* Unassigned */}
              {unassignedToys.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>UNASSIGNED TOYS</Text>

                  {unassignedToys.map((toy) => (
                    <ToyCard
                      key={toy.id}
                      toyName={toy.name}
                      toyEmoji={toy.emoji}
                      status={toy.status}
                      assignedTo={toy.assignedTo}
                      batteryLevel={toy.batteryLevel}
                      lastActive={""}
                      firmwareVersion={toy.firmwareVersion}
                      updateAvailable={false}
                      wifiConnected={toy.wifiConnected}
                      wifiSSID={toy.wifiSSID}
                      onPress={() =>
                        navigation.navigate("ToySettings", { toyId: toy.id })
                      }
                      onSettings={() =>
                        navigation.navigate("ToySettings", { toyId: toy.id })
                      }
                      onUpdate={() =>
                        navigation.navigate("ToySettings", { toyId: toy.id })
                      }
                    />
                  ))}
                </>
              )}

              {/* Bottom CTA */}
              <TouchableOpacity
                style={styles.pairBtn}
                onPress={() => navigation.navigate("AddToy")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[
                    "rgba(253,189,75,0.22)",
                    "rgba(255,255,255,0.06)",
                    "rgba(0,0,0,0.60)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pairBtnOuter}
                >
                  <View style={styles.pairBtnInner}>
                    <View style={styles.pairIconPill}>
                      <Ionicons
                        name="add"
                        size={scaleSize(16)}
                        color="#0B0B0D"
                      />
                    </View>
                    <Text style={styles.pairBtnText}>Pair New Toy</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

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
  headerLeft: { flex: 1 },
  title: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
  },

  headerBtn: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDBD4B",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
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
  headerInfoIcon: {
    width: scaleSize(22),
    height: scaleSize(22),
    resizeMode: "contain",
    opacity: 0.95,
  },

  sectionTitle: {
    marginTop: rs[6],
    marginBottom: rs[3],
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.85)",
    letterSpacing: 1.4,
  },

  loadingWrap: {
    paddingTop: rs[10],
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: rs[4],
    fontSize: rt.fontSize.base,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },

  emptyCard: {
    borderRadius: rbr.xl,
    padding: 1,
    marginTop: rs[4],
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  emptyInner: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(0,0,0,0.74)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    padding: rs[6],
    alignItems: "center",
  },
  emptyIconRing: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,189,75,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    marginBottom: rs[4],
  },
  emptyTitle: {
    fontSize: rt.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: rs[2],
  },
  emptySub: {
    fontSize: rt.fontSize.base,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginBottom: rs[5],
  },

  primaryBtn: {
    width: "100%",
    borderRadius: rbr.lg,
    overflow: "hidden",
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

  pairBtn: {
    marginTop: rs[5],
    borderRadius: rbr.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  pairBtnOuter: {
    padding: 1,
  },
  pairBtnInner: {
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    borderRadius: rbr.xl,
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs[3],
  },
  pairIconPill: {
    width: scaleSize(26),
    height: scaleSize(26),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDBD4B",
  },
  pairBtnText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
