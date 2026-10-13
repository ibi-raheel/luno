// src/screens/ChildProfileScreen.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
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
} from "firebase/firestore";

import {
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";

const childrenIcon = require("../../assets/children_icon.png");

interface Toy {
  id: string;
  name: string;
  emoji?: string;
  status?: "online" | "offline" | "charging" | string;
  batteryLevel?: number;
  assignedChildId?: string | null;
}

export default function ChildProfileScreen({ navigation, route }: any) {
  const { currentUser } = useAuth();
  const childId = route?.params?.childId;

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatar, setAvatar] = useState("👧");
  const [ageLevel, setAgeLevel] = useState("");
  const [dailyLimitHours, setDailyLimitHours] = useState<number | null>(null);
  const [assignedToys, setAssignedToys] = useState<Toy[]>([]);
  const [allToys, setAllToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToySelector, setShowToySelector] = useState(false);

  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  // Calculate age from birthDate
  const childAge = useMemo(() => {
    if (!dateOfBirth) return null;
    const parts = String(dateOfBirth).split("/");
    if (parts.length !== 3) return null;
    const [mm, dd, yyyy] = parts.map((p) => Number(p));
    if (!mm || !dd || !yyyy) return null;
    const dob = new Date(yyyy, mm - 1, dd);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasHadBirthdayThisYear) age--;
    return age >= 0 ? age : null;
  }, [dateOfBirth]);

  // Load child data
  useEffect(() => {
    if (!currentUser || !childId) {
      setLoading(false);
      return;
    }

    const childRef = doc(db, "users", currentUser.uid, "children", childId);
    const unsubscribe = onSnapshot(
      childRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data: any = docSnap.data();
          setName(data.name || "");
          setDateOfBirth(data.birthDate || "");
          setAvatar(data.avatar || "👧");
          setAgeLevel(data.ageLevel || "");
          setDailyLimitHours(data.dailyLimitHours ?? null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("[ChildProfileScreen] child onSnapshot error:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, childId]);

  // Load all toys + assigned toys
  useEffect(() => {
    if (!currentUser || !childId) return;

    const toysRef = collection(db, "users", currentUser.uid, "toys");
    const unsubscribe = onSnapshot(
      toysRef,
      (snapshot) => {
        const loaded: Toy[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            name: data.name || "Luno Companion",
            emoji: data.emoji || "🧸",
            status: data.status || "offline",
            batteryLevel: data.batteryLevel ?? null,
            assignedChildId: data.assignedChildId ?? null,
          };
        });

        setAllToys(loaded);
        setAssignedToys(loaded.filter((t) => t.assignedChildId === childId));
      },
      (err) => console.error("[ChildProfileScreen] toys onSnapshot error:", err)
    );

    return unsubscribe;
  }, [currentUser, childId]);

  const getStatusDotColor = (status?: string) => {
    switch (status) {
      case "online":
        return "rgba(56, 189, 248, 0.95)"; // blue
      case "charging":
        return "rgba(253, 189, 75, 0.95)"; // gold
      case "offline":
      default:
        return "rgba(255,255,255,0.28)"; // muted
    }
  };

  const handleSave = async () => {
    if (!currentUser || !childId) {
      Alert.alert("Error", "Unable to save changes");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      const childRef = doc(db, "users", currentUser.uid, "children", childId);
      await updateDoc(childRef, {
        name: name.trim(),
        birthDate: dateOfBirth,
        avatar,
        ageLevel,
        dailyLimitHours,
      });
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save changes");
    }
  };

  const handleUnassignToy = async (toyId: string) => {
    if (!currentUser) return;
    try {
      const toyRef = doc(db, "users", currentUser.uid, "toys", toyId);
      await updateDoc(toyRef, { assignedChildId: null });
    } catch (error) {
      console.error("Error unassigning toy:", error);
      Alert.alert("Error", "Failed to unassign toy");
    }
  };

  const handleAssignToy = async (toyId: string) => {
    if (!currentUser || !childId) return;
    try {
      const toyRef = doc(db, "users", currentUser.uid, "toys", toyId);
      await updateDoc(toyRef, { assignedChildId: childId });
      setShowToySelector(false);
    } catch (error) {
      console.error("Error assigning toy:", error);
      Alert.alert("Error", "Failed to assign toy");
    }
  };

  const handleAssignAnotherToy = () => {
    if (!childId) return;
    if (allToys.length === 0) navigation.navigate("AddToy", { childId });
    else setShowToySelector(true);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete ${
        name || "this"
      } profile? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!currentUser || !childId) return;
            try {
              const childRef = doc(
                db,
                "users",
                currentUser.uid,
                "children",
                childId
              );
              await deleteDoc(childRef);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting profile:", error);
              Alert.alert("Error", "Failed to delete profile");
            }
          },
        },
      ]
    );
  };

  // ---------- Loading / Not found ----------
  if (loading) {
    return (
      <View style={styles.container}>
        <StarryBackground />
        <LinearGradient
          colors={["rgba(0,0,0,0.90)", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.96)"]}
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
              <Ionicons name="chevron-back" size={scaleSize(20)} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Child Profile</Text>
              <Text style={styles.headerSubtitle}>Loading…</Text>
            </View>
            <View style={{ width: scaleSize(44) }} />
          </View>

          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#FDBD4B" />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!childId || !currentUser) {
    return (
      <View style={styles.container}>
        <StarryBackground />
        <LinearGradient
          colors={["rgba(0,0,0,0.90)", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.96)"]}
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
              <Ionicons name="chevron-back" size={scaleSize(20)} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Child Profile</Text>
              <Text style={styles.headerSubtitle}>Not found</Text>
            </View>
            <View style={{ width: scaleSize(44) }} />
          </View>

          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Profile not found</Text>
            <Text style={styles.emptySub}>
              This child profile may have been removed or you don’t have access.
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
            <Text style={styles.headerTitle}>{name || "Child Profile"}</Text>
            <Text style={styles.headerSubtitle}>Profile & assignments</Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerSaveBtn}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.78)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerSaveBtnInner}
            >
              <Text style={styles.headerSaveText}>Save</Text>
            </LinearGradient>
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
              {/* UPDATED: use children_icon from assets (no bear) */}
              <View style={styles.heroIconRing}>
                <Image source={childrenIcon} style={styles.heroIconImage} />
              </View>

              <Text style={styles.heroName} numberOfLines={1}>
                {name || "Child"}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroPill}>
                  <Ionicons
                    name="calendar-outline"
                    size={scaleSize(14)}
                    color="rgba(255,255,255,0.70)"
                  />
                  <Text style={styles.heroPillText}>
                    {childAge != null ? `${childAge} yrs` : "Age unknown"}
                  </Text>
                </View>

                <View style={styles.heroPill}>
                  <Ionicons
                    name="cube-outline"
                    size={scaleSize(14)}
                    color="rgba(255,255,255,0.70)"
                  />
                  <Text style={styles.heroPillText}>
                    {assignedToys.length} toy
                    {assignedToys.length === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Profile Info */}
          <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>

          <View style={styles.card}>
            <FieldRow label="Name">
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Child's name"
                placeholderTextColor="rgba(255,255,255,0.35)"
              />
            </FieldRow>

            <Divider />

            <FieldRow label="Date of Birth">
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="rgba(255,255,255,0.35)"
              />
            </FieldRow>

            <Divider />

            <Row
              label="Age"
              value={
                childAge != null ? `${childAge} years old` : "Not calculated"
              }
            />
          </View>

          {/* Assigned Toys */}
          <Text style={styles.sectionTitle}>ASSIGNED TOYS</Text>

          <View style={styles.card}>
            {assignedToys.length > 0 ? (
              assignedToys.map((toy, index) => (
                <React.Fragment key={toy.id}>
                  {index > 0 && <Divider />}
                  <View style={styles.toyRow}>
                    <View style={styles.toyIconRing}>
                      <Text style={styles.toyEmoji}>{toy.emoji || "🧸"}</Text>
                    </View>

                    <View style={styles.toyInfo}>
                      <Text style={styles.toyName} numberOfLines={1}>
                        {toy.name}
                      </Text>
                      <View style={styles.toyStatusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusDotColor(toy.status) },
                          ]}
                        />
                        <Text style={styles.toyStatusText}>
                          {toy.status === "online"
                            ? "Online"
                            : toy.status === "charging"
                            ? "Charging"
                            : "Offline"}
                          {typeof toy.batteryLevel === "number"
                            ? ` • ${toy.batteryLevel}%`
                            : ""}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Unassign Toy",
                          `Remove ${toy.name} from ${name}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove",
                              style: "destructive",
                              onPress: () => handleUnassignToy(toy.id),
                            },
                          ]
                        )
                      }
                      style={styles.removePill}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.removePillText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyCardRow}>
                <Text style={styles.emptyCardText}>
                  No toys assigned yet. Assign a toy to start conversations.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAssignAnotherToy}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.78)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnInner}
            >
              <Text style={styles.primaryBtnText}>+ Assign Another Toy</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Settings */}
          <Text style={styles.sectionTitle}>QUICK SETTINGS</Text>

          <View style={styles.card}>
            <PressRow
              title="Parental Controls"
              subtitle="Content filters, time limits"
              onPress={() =>
                navigation.navigate("Main", { screen: "Controls" })
              }
            />
            <Divider />
            <PressRow
              title="Activity History"
              subtitle="View conversations & playtime"
              onPress={() =>
                navigation.navigate("Main", { screen: "Timeline" })
              }
            />
            <Divider />
            <PressRow
              title="Learning Insights (Future Dev)"
              subtitle="Skills & progress"
              onPress={() =>
                navigation.navigate("Main", { screen: "Timeline" })
              }
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
            onPress={handleDelete}
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
                <Text style={styles.dangerBtnText}>Delete Profile</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: rs[10] }} />
        </ScrollView>
      </SafeAreaView>

      {/* Toy Selector Modal */}
      <Modal
        visible={showToySelector}
        animationType="slide"
        transparent
        onRequestClose={() => setShowToySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["rgba(0,0,0,0.20)", "rgba(0,0,0,0.72)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Toy</Text>
              <TouchableOpacity
                onPress={() => setShowToySelector(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={scaleSize(18)} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={{ paddingBottom: rs[8] }}
              showsVerticalScrollIndicator={false}
            >
              {allToys.map((toy) => {
                const isAssignedToThisChild = toy.assignedChildId === childId;

                return (
                  <TouchableOpacity
                    key={toy.id}
                    style={[
                      styles.modalToyRow,
                      isAssignedToThisChild && styles.modalToyRowDisabled,
                    ]}
                    onPress={() => handleAssignToy(toy.id)}
                    disabled={isAssignedToThisChild}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modalToyIconRing}>
                      <Text style={styles.modalToyEmoji}>
                        {toy.emoji || "🧸"}
                      </Text>
                    </View>

                    <View style={{ flex: 1, paddingRight: rs[3] }}>
                      <Text style={styles.modalToyName} numberOfLines={1}>
                        {toy.name}
                      </Text>
                      <Text style={styles.modalToySub} numberOfLines={1}>
                        {isAssignedToThisChild
                          ? "Already assigned to this child"
                          : toy.assignedChildId
                          ? "Assigned to another child"
                          : toy.status === "online"
                          ? "Available • Online"
                          : "Available • Offline"}
                      </Text>
                    </View>

                    {!isAssignedToThisChild ? (
                      <Ionicons
                        name="chevron-forward"
                        size={scaleSize(16)}
                        color="rgba(255,255,255,0.35)"
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.modalAddNew}
                onPress={() => {
                  setShowToySelector(false);
                  navigation.navigate("AddToy", { childId });
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["rgba(253,189,75,0.98)", "rgba(253,189,75,0.78)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalAddNewInner}
                >
                  <Text style={styles.modalAddNewText}>+ Add a New Toy</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- small UI helpers ---------- */

function Divider() {
  return <View style={styles.divider} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PressRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
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
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={scaleSize(16)}
        color="rgba(255,255,255,0.35)"
      />
    </TouchableOpacity>
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

  headerSaveBtn: { borderRadius: 999, overflow: "hidden" },
  headerSaveBtnInner: {
    paddingHorizontal: rs[4],
    height: scaleSize(44),
    alignItems: "center",
    justifyContent: "center",
  },
  headerSaveText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.sm,
  },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  heroName: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: rs[2],
    marginTop: rs[3],
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

  card: {
    borderRadius: rbr.xl,
    padding: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  fieldRow: {
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  fieldLabel: {
    fontSize: rt.fontSize.sm,
    fontWeight: "800",
    color: "rgba(255,255,255,0.62)",
    marginBottom: rs[2],
  },
  input: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
    paddingVertical: rs[2],
    paddingHorizontal: 0,
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
    maxWidth: "58%",
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: rs[5],
  },

  toyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  toyIconRing: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginRight: rs[3],
  },
  toyEmoji: { fontSize: scaleSize(20) },
  toyInfo: { flex: 1, paddingRight: rs[3] },
  toyName: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  toyStatusRow: { flexDirection: "row", alignItems: "center", gap: rs[2] },
  statusDot: { width: 6, height: 6, borderRadius: 999 },
  toyStatusText: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
  },

  removePill: {
    paddingVertical: rs[2],
    paddingHorizontal: rs[3],
    borderRadius: 999,
    backgroundColor: "rgba(255,80,80,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.20)",
  },
  removePillText: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,120,120,0.95)",
  },

  emptyCardRow: {
    paddingVertical: rs[5],
    paddingHorizontal: rs[5],
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  emptyCardText: {
    fontSize: rt.fontSize.base,
    fontWeight: "800",
    color: "rgba(255,255,255,0.60)",
  },

  primaryBtn: { marginTop: rs[3], borderRadius: 999, overflow: "hidden" },
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

  pressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    width: "100%",
    maxHeight: "82%",
    borderTopLeftRadius: rbr["2xl"] ?? rbr.xl,
    borderTopRightRadius: rbr["2xl"] ?? rbr.xl,
    padding: rs[5],
    paddingBottom: rs[8],
    backgroundColor: "rgba(0,0,0,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs[4],
  },
  modalTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  modalCloseBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  modalToyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[4],
    borderRadius: rbr.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: rs[3],
  },
  modalToyRowDisabled: { opacity: 0.55 },

  modalToyIconRing: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,189,75,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    marginRight: rs[3],
  },
  modalToyEmoji: { fontSize: scaleSize(20) },
  modalToyName: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FFF",
  },
  modalToySub: {
    marginTop: 2,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.60)",
  },

  modalAddNew: { marginTop: rs[2], borderRadius: 999, overflow: "hidden" },
  modalAddNewInner: {
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
  },
  modalAddNewText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },
});
