// src/screens/ToySettingsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
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
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";

const infoIcon = require("../../assets/info_icon.png");
const conversationsIcon = require("../../assets/conversations_icon.png");

interface ToyData {
  id: string;
  name: string;
  emoji: string;
  status: string;
  batteryLevel: number;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  assignedChildId: string | null;
  assignedChildName?: string;
  assignedChildAge?: number;
  volume: number;
  ledBrightness: string;
  soundEffects: boolean;
  voiceType: string;
  autoUpdate: boolean;
  connectionType: string;
  wifiNetwork: string | null;
}

export default function ToySettingsScreen({ navigation, route }: any) {
  const { currentUser } = useAuth();
  const toyId = route?.params?.toyId;

  const [toyData, setToyData] = useState<ToyData | null>(null);
  const [loading, setLoading] = useState(true);

  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  useEffect(() => {
    if (!currentUser || !toyId) {
      setLoading(false);
      return;
    }

    const toyRef = doc(db, "users", currentUser.uid, "toys", toyId);

    const unsubscribe = onSnapshot(
      toyRef,
      async (docSnap) => {
        try {
          if (!docSnap.exists()) {
            setToyData(null);
            return;
          }

          const data: any = docSnap.data();

          // Resolve assigned child name + age
          let assignedChildName: string | undefined;
          let assignedChildAge: number | undefined;

          if (data.assignedChildId) {
            const childSnap = await getDocs(
              query(
                collection(db, "users", currentUser.uid, "children"),
                where("__name__", "==", data.assignedChildId)
              )
            );

            if (!childSnap.empty) {
              const childData: any = childSnap.docs[0].data();
              assignedChildName = childData.name;

              if (childData.birthDate) {
                const parts = String(childData.birthDate).split("/");
                if (parts.length === 3) {
                  const [mm, dd, yyyy] = parts.map((p: string) => Number(p));
                  const dob = new Date(yyyy, mm - 1, dd);
                  const today = new Date();
                  let age = today.getFullYear() - dob.getFullYear();
                  const hasHadBirthdayThisYear =
                    today.getMonth() > dob.getMonth() ||
                    (today.getMonth() === dob.getMonth() &&
                      today.getDate() >= dob.getDate());
                  if (!hasHadBirthdayThisYear) age--;
                  assignedChildAge = age >= 0 ? age : undefined;
                }
              }
            }
          }

          setToyData({
            id: docSnap.id,
            name: data.name || "Toy",
            emoji: data.emoji || "🦄",
            status: data.status || "offline",
            batteryLevel: data.batteryLevel || 0,
            model: data.model || "Unknown",
            serialNumber: data.serialNumber || "N/A",
            firmwareVersion: data.firmwareVersion || "N/A",
            assignedChildId: data.assignedChildId || null,
            assignedChildName,
            assignedChildAge,
            volume: data.volume || 70,
            ledBrightness: data.ledBrightness || "Medium",
            soundEffects: data.soundEffects ?? true,
            voiceType: data.voiceType || "Female, Child-friendly",
            autoUpdate: data.autoUpdate ?? true,
            connectionType: data.connectionType || "Wi-Fi",
            wifiNetwork: data.wifiNetwork || null,
          });
        } catch (e) {
          console.error("[ToySettingsScreen] load error:", e);
          setToyData(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("[ToySettingsScreen] onSnapshot error:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, toyId]);

  const statusLabel = useMemo(() => {
    if (!toyData) return "Offline";
    if (toyData.status === "online") return "Online";
    if (toyData.status === "charging") return "Charging";
    return "Offline";
  }, [toyData]);

  const statusTone = useMemo<"good" | "warn" | "bad">(() => {
    if (!toyData) return "bad";
    if (toyData.status === "online") return "good";
    if (toyData.status === "charging") return "warn";
    return "bad";
  }, [toyData]);

  const updateToySetting = async (key: keyof ToyData, value: any) => {
    if (!currentUser || !toyId) return;

    try {
      const toyRef = doc(db, "users", currentUser.uid, "toys", toyId);
      await updateDoc(toyRef, { [key]: value });
    } catch (error) {
      console.error("Error updating toy setting:", error);
      Alert.alert("Error", "Failed to update setting. Please try again.");
    }
  };

  const handleRemoveToy = () => {
    if (!currentUser || !toyId || !toyData) return;

    Alert.alert(
      "Remove Toy",
      `Remove ${toyData.name} from your account? The toy will need to be paired again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const toyRef = doc(db, "users", currentUser.uid, "toys", toyId);
              await deleteDoc(toyRef);
              navigation.goBack();
            } catch (error) {
              console.error("Error removing toy:", error);
              Alert.alert("Error", "Failed to remove toy. Please try again.");
            }
          },
        },
      ]
    );
  };

  // ---------- States ----------
  if (loading) {
    return (
      <View style={styles.container}>
        <StarryBackground />
        <LinearGradient
          colors={["rgba(0,0,0,0.90)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerIconBtn}
              activeOpacity={0.85}
            >
              <Ionicons
                name="chevron-back"
                size={scaleSize(20)}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Toy Settings</Text>
              <Text style={styles.headerSubtitle}>Loading…</Text>
            </View>
            <View style={{ width: scaleSize(44) }} />
          </View>

          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#FDBD4B" />
            <Text style={styles.loadingText}>Loading toy…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!toyData || !currentUser) {
    return (
      <View style={styles.container}>
        <StarryBackground />
        <LinearGradient
          colors={["rgba(0,0,0,0.90)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerIconBtn}
              activeOpacity={0.85}
            >
              <Ionicons
                name="chevron-back"
                size={scaleSize(20)}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Toy Settings</Text>
              <Text style={styles.headerSubtitle}>Toy not found</Text>
            </View>
            <View style={{ width: scaleSize(44) }} />
          </View>

          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Toy not found</Text>
            <Text style={styles.emptySub}>
              This toy may have been removed or you don’t have access to it.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.primaryBtn}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.78)"]}
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

  // ---------- Main ----------
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
            <Text style={styles.headerTitle}>{toyData.name}</Text>
            <Text style={styles.headerSubtitle}>Toy Settings</Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Toy Settings", "You can customize your toy here.")
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
              {/* UPDATED: use conversations icon instead of emoji */}
              <View style={styles.heroIconRing}>
                <Image
                  source={conversationsIcon}
                  style={styles.heroIconImage}
                />
              </View>

              <Text style={styles.toyName}>{toyData.name}</Text>

              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <View
                    style={[
                      styles.badgeDot,
                      statusTone === "good"
                        ? styles.dotGood
                        : statusTone === "warn"
                        ? styles.dotWarn
                        : styles.dotBad,
                    ]}
                  />
                  <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>

                <View style={styles.badge}>
                  <Ionicons
                    name="battery-half"
                    size={scaleSize(14)}
                    color="rgba(255,255,255,0.75)"
                  />
                  <Text style={styles.badgeText}>
                    {toyData.batteryLevel}% battery
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Device Info */}
          <Text style={styles.sectionTitle}>DEVICE INFORMATION</Text>

          <View style={styles.card}>
            <Row label="Model" value={toyData.model} />
            <Divider />
            <Row label="Serial Number" value={toyData.serialNumber} mono />
            <Divider />
            <Row
              label="Firmware Version"
              value={toyData.firmwareVersion}
              mono
            />
            <Divider />
            <Row
              label="Assigned To"
              value={
                toyData.assignedChildName
                  ? `${toyData.assignedChildName}${
                      toyData.assignedChildAge != null
                        ? `, ${toyData.assignedChildAge}`
                        : ""
                    }`
                  : "Not assigned"
              }
            />
          </View>

          {/* Device Settings */}
          <Text style={styles.sectionTitle}>DEVICE SETTINGS</Text>

          <View style={styles.card}>
            <PressRow
              title="Volume"
              value={`${toyData.volume}%`}
              onPress={() =>
                Alert.alert("Volume", "Volume adjustment coming soon")
              }
            />
            <Divider />
            <PressRow
              title="LED Brightness"
              value={toyData.ledBrightness}
              onPress={() =>
                Alert.alert(
                  "LED Brightness",
                  "Brightness adjustment coming soon"
                )
              }
            />
            <Divider />
            <SwitchRow
              title="Sound Effects"
              subtitle="Play sounds during responses"
              value={toyData.soundEffects}
              onChange={(v) => updateToySetting("soundEffects", v)}
            />
            <Divider />
            <PressRow
              title="Voice"
              value={toyData.voiceType}
              onPress={() =>
                Alert.alert("Voice", "Voice customization coming soon")
              }
            />
          </View>

          {/* Firmware */}
          <Text style={styles.sectionTitle}>FIRMWARE & UPDATES</Text>

          <View style={styles.card}>
            <SwitchRow
              title="Auto-Update"
              subtitle="Install updates automatically"
              value={toyData.autoUpdate}
              onChange={(v) => updateToySetting("autoUpdate", v)}
            />
            <Divider />
            <PressRow
              title="Check for Updates"
              value={`Up to date (${toyData.firmwareVersion})`}
              onPress={() =>
                Alert.alert(
                  "Up to Date",
                  "Your toy is running the latest firmware version."
                )
              }
            />
          </View>

          {/* Connection */}
          <Text style={styles.sectionTitle}>CONNECTION</Text>

          <View style={styles.card}>
            <Row label="Connection Type" value={toyData.connectionType} />
            <Divider />
            <PressRow
              title="Wi-Fi Network"
              value={toyData.wifiNetwork || "Not connected"}
              onPress={() =>
                Alert.alert(
                  "Wi-Fi Network",
                  "Network configuration coming soon"
                )
              }
            />
            <Divider />
            <PressRow
              title="Restart Toy"
              subtitle="Restart if experiencing issues"
              value=""
              onPress={() => {
                Alert.alert(
                  "Restart Toy",
                  "Are you sure you want to restart this toy?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Restart",
                      onPress: () =>
                        Alert.alert("Restarting", "Your toy is restarting..."),
                    },
                  ]
                );
              }}
            />
          </View>

          {/* Danger Zone */}
          <Text
            style={[styles.sectionTitle, { color: "rgba(255,80,80,0.85)" }]}
          >
            DANGER ZONE
          </Text>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleRemoveToy}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[
                "rgba(255,80,80,0.18)",
                "rgba(255,255,255,0.06)",
                "rgba(0,0,0,0.70)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dangerBtnOuter}
            >
              <View style={styles.dangerBtnInner}>
                <Ionicons
                  name="trash-outline"
                  size={scaleSize(16)}
                  color="rgba(255,120,120,0.95)"
                />
                <Text style={styles.dangerBtnText}>Remove Toy</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: rs[10] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------- Small UI helpers (kept in-file for copy/paste) ---------- */

function Divider() {
  return <View style={styles.divider} />;
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function PressRow({
  title,
  value,
  subtitle,
  onPress,
}: {
  title: string;
  value: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.pressRow}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1, paddingRight: rs[3] }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {value ? (
        <Text style={styles.settingValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      <Ionicons
        name="chevron-forward"
        size={scaleSize(16)}
        color="rgba(255,255,255,0.35)"
        style={{ marginLeft: rs[2] }}
      />
    </TouchableOpacity>
  );
}

function SwitchRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, paddingRight: rs[3] }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: "rgba(255,255,255,0.14)",
          true: "rgba(253,189,75,0.35)",
        }}
        thumbColor={"#FDBD4B"}
      />
    </View>
  );
}

/* ---------- Styles ---------- */

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
  headerInfoIcon: {
    width: scaleSize(22),
    height: scaleSize(22),
    resizeMode: "contain",
    opacity: 0.95,
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

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: rs[4],
    fontSize: rt.fontSize.base,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: rs[6],
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
    color: "rgba(255,255,255,0.62)",
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

  // UPDATED: conversations icon ring + image
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
    width: scaleSize(36),
    height: scaleSize(36),
    resizeMode: "contain",
    opacity: 0.95,
  },

  toyName: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  badgesRow: {
    flexDirection: "row",
    gap: rs[2],
    marginTop: rs[3],
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
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
  badgeDot: {
    width: scaleSize(7),
    height: scaleSize(7),
    borderRadius: 999,
  },
  dotGood: { backgroundColor: "rgba(56, 189, 248, 0.95)" },
  dotWarn: { backgroundColor: "rgba(253, 189, 75, 0.95)" },
  dotBad: { backgroundColor: "rgba(255, 80, 80, 0.95)" },
  badgeText: {
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

  card: {
    borderRadius: rbr.xl,
    padding: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  rowLabel: {
    fontSize: rt.fontSize.base,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },
  rowValue: {
    maxWidth: "55%",
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "right",
  },
  mono: { fontVariant: ["tabular-nums"] },

  pressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  settingTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
  },
  settingValue: {
    fontSize: rt.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.70)",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: rs[5],
  },

  dangerBtn: {
    borderRadius: rbr.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  dangerBtnOuter: { padding: 1, borderRadius: rbr.xl },
  dangerBtnInner: {
    borderRadius: rbr.xl,
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs[2],
  },
  dangerBtnText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,120,120,0.95)",
  },
});
