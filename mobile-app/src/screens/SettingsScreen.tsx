// src/screens/SettingsScreen.tsx

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
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  typography,
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { StarryBackground } from "../components/StarryBackground";

interface Toy {
  id: string;
  name: string;
  status: string;
  batteryLevel: number;
}

interface Child {
  id: string;
  name: string;
  age: number | null;
}

const infoIcon = require("../../assets/info_icon.png");
const childrenIcon = require("../../assets/children_icon.png");

function SectionHeader({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        {!!kicker && <Text style={styles.sectionKicker}>{kicker}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

function GradientCard({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={["#050506", "#1A1206", "rgba(253,189,75,0.70)"]}
      locations={[0, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      {children}
    </LinearGradient>
  );
}

function RowDivider() {
  return <View style={styles.divider} />;
}

function ChevronRight() {
  return (
    <Ionicons
      name="chevron-forward"
      size={scaleSize(18)}
      color="rgba(255,255,255,0.35)"
    />
  );
}

export default function SettingsScreen({ navigation }: any) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { signOut, currentUser } = useAuth();

  const [toys, setToys] = useState<Toy[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingToys, setLoadingToys] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  // Calculate age from birthDate
  const calculateAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const parts = birthDate.split("/");
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
  };

  // Load toys
  useEffect(() => {
    if (!currentUser) {
      setLoadingToys(false);
      setToys([]);
      return;
    }

    const toysRef = collection(db, "users", currentUser.uid, "toys");
    const unsubscribe = onSnapshot(toysRef, (snapshot) => {
      const loadedToys: Toy[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || "Toy",
          status: data.status || "offline",
          batteryLevel: Number(data.batteryLevel || 0),
        };
      });

      setToys(loadedToys);
      setLoadingToys(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Load children
  useEffect(() => {
    if (!currentUser) {
      setLoadingChildren(false);
      setChildren([]);
      return;
    }

    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubscribe = onSnapshot(childrenRef, (snapshot) => {
      const loadedChildren: Child[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const age = calculateAge(data.birthDate);
        return {
          id: d.id,
          name: data.name || "Child",
          age,
        };
      });

      setChildren(loadedChildren);
      setLoadingChildren(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("Sign Out Failed", error?.message || "Please try again");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently delete:\n\n• All child profiles\n• All conversation history\n• All toy connections\n• Your account data\n\nThis action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              if (!currentUser) {
                Alert.alert("Error", "No user is currently signed in");
                return;
              }

              // Show loading state
              Alert.alert(
                "Deleting Account",
                "Please wait while we delete your account and data..."
              );

              const userId = currentUser.uid;
              const batch = writeBatch(db);

              // 1. Delete all children and their subcollections
              const childrenRef = collection(db, "users", userId, "children");
              const childrenSnapshot = await getDocs(childrenRef);

              for (const childDoc of childrenSnapshot.docs) {
                const childId = childDoc.id;

                // Delete conversations for this child
                const conversationsRef = collection(
                  db,
                  "users",
                  userId,
                  "children",
                  childId,
                  "conversations"
                );
                const conversationsSnapshot = await getDocs(conversationsRef);

                for (const convDoc of conversationsSnapshot.docs) {
                  const convId = convDoc.id;

                  // Delete messages in this conversation
                  const messagesRef = collection(
                    db,
                    "users",
                    userId,
                    "children",
                    childId,
                    "conversations",
                    convId,
                    "messages"
                  );
                  const messagesSnapshot = await getDocs(messagesRef);

                  messagesSnapshot.docs.forEach((msgDoc) => {
                    batch.delete(msgDoc.ref);
                  });

                  // Delete conversation document
                  batch.delete(convDoc.ref);
                }

                // Delete child document
                batch.delete(childDoc.ref);
              }

              // 2. Delete all toys
              const toysRef = collection(db, "users", userId, "toys");
              const toysSnapshot = await getDocs(toysRef);
              toysSnapshot.docs.forEach((toyDoc) => {
                batch.delete(toyDoc.ref);
              });

              // 3. Delete user document
              const userDocRef = doc(db, "users", userId);
              batch.delete(userDocRef);

              // Commit all deletions
              await batch.commit();

              // 4. Delete Firebase Auth account
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
              }

              Alert.alert(
                "Account Deleted",
                "Your account and all associated data have been permanently deleted."
              );
            } catch (error: any) {
              console.error("Delete account error:", error);
              Alert.alert(
                "Delete Account Failed",
                error?.message ||
                  "Failed to delete your account. Please try again or contact support."
              );
            }
          },
        },
      ]
    );
  };

  const switchTrack = useMemo(
    () => ({
      false: "rgba(255,255,255,0.16)",
      true: "rgba(253,189,75,0.28)",
    }),
    []
  );

  return (
    <View style={styles.container}>
      <StarryBackground />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: screenPadding },
          ]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* HEADER */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>SETTINGS</Text>
              <Text style={styles.pageTitle}>Settings</Text>
              <Text style={styles.subTitle}>
                Manage your account, toys, and app preferences
              </Text>
            </View>

            {/* Right icon (same pattern as other screens) */}
            <View style={styles.headerIconBtn}>
              <Image source={infoIcon} style={styles.headerIconImg} />
            </View>
          </View>

          {/* CONNECTED TOYS */}
          <SectionHeader kicker="DEVICES" title="Connected toys" />

          <GradientCard>
            {loadingToys ? (
              <View style={styles.emptyState}>
                <Text style={styles.mutedText}>Loading toys...</Text>
              </View>
            ) : toys.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.mutedText}>No toys connected yet</Text>
              </View>
            ) : (
              <View>
                {toys.map((toy, index) => (
                  <React.Fragment key={toy.id}>
                    {index > 0 && <RowDivider />}
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("ToySettings", { toyId: toy.id })
                      }
                    >
                      <Image source={childrenIcon} style={styles.toyIconImg} />

                      <View style={{ flex: 1, paddingRight: rs[3] }}>
                        <Text style={styles.rowTitle}>{toy.name}</Text>
                        <View style={styles.statusLine}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor:
                                  toy.status === "online"
                                    ? "rgba(46, 204, 113, 0.95)"
                                    : "rgba(255,255,255,0.35)",
                              },
                            ]}
                          />
                          <Text style={styles.rowSubtitle}>
                            {toy.status === "online"
                              ? `Online • ${toy.batteryLevel}% battery`
                              : "Offline"}
                          </Text>
                        </View>
                      </View>

                      <ChevronRight />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            )}
          </GradientCard>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("AddToy")}
          >
            <Ionicons
              name="add"
              size={scaleSize(18)}
              color="#0B0B0D"
              style={{ marginRight: rs[2] }}
            />
            <Text style={styles.primaryButtonText}>Add new toy</Text>
          </TouchableOpacity>

          {/* PARENTAL CONTROLS */}
          <SectionHeader kicker="SAFETY" title="Parental controls" />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Main", { screen: "Controls" })}
          >
            <GradientCard>
              <View style={styles.pcHeader}>
                <View style={{ flex: 1, paddingRight: rs[3] }}>
                  <Text style={styles.rowTitle}>Manage parental controls</Text>
                  <Text style={styles.rowSubtitle}>
                    Content filters, time limits & safety settings
                  </Text>
                </View>

                <View style={styles.rightIconWrap}>
                  <Ionicons
                    name="lock-closed"
                    size={scaleSize(18)}
                    color="rgba(255,255,255,0.55)"
                  />
                  <ChevronRight />
                </View>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Children</Text>
                  <Text style={styles.quickStatValue}>{children.length}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Toys</Text>
                  <Text style={styles.quickStatValue}>{toys.length}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Status</Text>
                  <Text style={styles.quickStatValue}>Active</Text>
                </View>
              </View>
            </GradientCard>
          </TouchableOpacity>

          {/* CHILDREN */}
          <SectionHeader kicker="PROFILES" title="Children" />

          <GradientCard>
            {loadingChildren ? (
              <View style={styles.emptyState}>
                <Text style={styles.mutedText}>Loading children...</Text>
              </View>
            ) : children.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.mutedText}>No children added yet</Text>
              </View>
            ) : (
              <View>
                {children.map((child, index) => (
                  <React.Fragment key={child.id}>
                    {index > 0 && <RowDivider />}
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("ChildProfile", {
                          childId: child.id,
                          childName: child.name,
                          childAge: child.age ?? undefined,
                        })
                      }
                    >
                      <View style={styles.childAvatar}>
                        <Text style={styles.childAvatarText}>
                          {(child.name || "C")[0]?.toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1, paddingRight: rs[3] }}>
                        <Text style={styles.rowTitle}>
                          {child.name}
                          {child.age !== null ? ` • ${child.age}` : ""}
                        </Text>
                        <Text style={styles.rowSubtitle}>
                          Manage profile & settings
                        </Text>
                      </View>

                      <ChevronRight />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            )}
          </GradientCard>

          <TouchableOpacity
            style={styles.outlineButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("AddChild")}
          >
            <Ionicons
              name="person-add"
              size={scaleSize(18)}
              color="#FDBD4B"
              style={{ marginRight: rs[2] }}
            />
            <Text style={styles.outlineButtonText}>Add child</Text>
          </TouchableOpacity>

          {/* APP SETTINGS */}
          <SectionHeader kicker="APP" title="App settings" />

          <GradientCard>
            {/* Notifications */}
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: rs[3] }}>
                <Text style={styles.rowTitle}>Notifications</Text>
                <Text style={styles.rowSubtitle}>
                  Push notifications for alerts
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={switchTrack}
                thumbColor="#FFFFFF"
              />
            </View>

            <RowDivider />

            {/* Privacy */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Privacy")}
            >
              <View style={{ flex: 1, paddingRight: rs[3] }}>
                <Text style={styles.rowTitle}>Privacy & data</Text>
                <Text style={styles.rowSubtitle}>Manage your data</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>

            <RowDivider />

            {/* Help */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Help")}
            >
              <View style={{ flex: 1, paddingRight: rs[3] }}>
                <Text style={styles.rowTitle}>Help & support</Text>
                <Text style={styles.rowSubtitle}>Get help or contact us</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>
          </GradientCard>

          {/* DELETE ACCOUNT */}
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.9}
          >
            <Ionicons
              name="trash-outline"
              size={scaleSize(18)}
              color="rgba(255,100,100,0.95)"
              style={{ marginRight: rs[2] }}
            />
            <Text style={styles.deleteAccountText}>Delete account</Text>
          </TouchableOpacity>

          {/* SIGN OUT */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.9}
          >
            <Ionicons
              name="log-out-outline"
              size={scaleSize(18)}
              color="rgba(255,160,160,0.95)"
              style={{ marginRight: rs[2] }}
            />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          {/* Extra bottom space (floating menu) */}
          <View style={{ height: scaleSize(150) }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },
  content: { paddingTop: rs[4] },

  // Header
  topBar: {
    marginBottom: rs[5],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kicker: {
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  pageTitle: {
    fontSize: rt.fontSize["2xl"],
    fontWeight: "900",
    color: "#FDBD4B",
    letterSpacing: 0.2,
  },
  subTitle: {
    marginTop: 6,
    fontSize: rt.fontSize.sm,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },
  headerIconBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: rs[3],
  },
  headerIconImg: {
    width: scaleSize(18),
    height: scaleSize(18),
    resizeMode: "contain",
    opacity: 0.95,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: rs[3],
    marginBottom: rs[3],
    paddingHorizontal: 2,
  },
  sectionKicker: {
    fontSize: rt.fontSize.xs,
    letterSpacing: 1.6,
    color: "rgba(253,189,75,0.85)",
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: rt.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // Cards
  cardGradient: {
    borderRadius: rbr.xl,
    marginBottom: rs[3],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.24,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 5 },
    }),
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: rs[4],
  },

  emptyState: { padding: rs[4] },
  mutedText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs[4],
    paddingHorizontal: rs[4],
  },
  rowTitle: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.60)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  // Toy icon bubble (no emoji)
  lunoIconBubble: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: rs[3],
  },
  lunoIconImg: {
    width: scaleSize(18),
    height: scaleSize(18),
    resizeMode: "contain",
    opacity: 0.95,
  },
  toyIconImg: {
    width: scaleSize(60),
    height: scaleSize(60),
    resizeMode: "contain",
    marginRight: rs[3],
  },
  statusLine: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  statusDot: {
    width: scaleSize(7),
    height: scaleSize(7),
    borderRadius: 999,
    marginRight: rs[2],
  },

  // Parental controls row right icon (lock + chevron aligned to far right)
  pcHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: rs[4],
  },
  rightIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs[2],
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: rs[4],
    paddingBottom: rs[4],
    paddingTop: rs[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  quickStat: { flex: 1, alignItems: "center" },
  quickStatLabel: {
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "800",
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  // Child avatar
  childAvatar: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.16)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.26)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: rs[3],
  },
  childAvatarText: {
    color: "#FDBD4B",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },

  // Buttons
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDBD4B",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    marginTop: rs[2],
    marginBottom: rs[3],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 4 },
    }),
  },
  primaryButtonText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#0B0B0D",
  },

  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    marginTop: rs[2],
    marginBottom: rs[3],
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.26)",
  },
  outlineButtonText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "#FDBD4B",
  },

  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    marginTop: rs[5],
    backgroundColor: "rgba(255, 50, 50, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 50, 50, 0.30)",
  },
  deleteAccountText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,100,100,0.95)",
  },

  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    marginTop: rs[3],
    backgroundColor: "rgba(255, 77, 77, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.26)",
  },
  signOutText: {
    fontSize: rt.fontSize.base,
    fontWeight: "900",
    color: "rgba(255,160,160,0.95)",
  },
});
