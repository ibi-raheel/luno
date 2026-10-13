// src/screens/AddToyScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  KeyboardAvoidingView,
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
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import bleService, { LunoDevice, WifiNetwork } from "../services/bleService";
import { validateToyForPairing } from "../utils/toyValidation";
import { LinearGradient } from "expo-linear-gradient";
import { StarryBackground } from "../components/StarryBackground";

type PairingStep =
  | "intro"
  | "power-on"
  | "scanning"
  | "device-list"
  | "wifi"
  | "connecting"
  | "name"
  | "assign"
  | "success";

interface Child {
  id: string;
  name: string;
  age: number;
}

const infoIcon = require("../../assets/info_icon.png");
const successIcon = require("../../assets/success_icon.png");

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
      colors={[
        "rgba(253,189,75,0.22)",
        "rgba(255,255,255,0.10)",
        "rgba(0,0,0,0.30)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardInner}>{children}</View>
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

export default function AddToyScreen({ navigation }: any) {
  const { currentUser, signOut } = useAuth();
  const [step, setStep] = useState<PairingStep>("intro");
  const [toyName, setToyName] = useState("");
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingToys, setHasExistingToys] = useState(false);

  // BLE-related state
  const [discoveredDevices, setDiscoveredDevices] = useState<LunoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<LunoDevice | null>(null);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  // WiFi credentials state
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(
    null
  );
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [scanningNetworks, setScanningNetworks] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [showManualEntry, setShowManualEntry] = useState(false);

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

  // Check if user has existing toys
  useEffect(() => {
    if (!currentUser) return;

    const toysRef = collection(db, "users", currentUser.uid, "toys");
    const unsubscribe = onSnapshot(toysRef, (snapshot) => {
      setHasExistingToys(snapshot.docs.length > 0);
    });

    return unsubscribe;
  }, [currentUser]);

  // Load children from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoadingChildren(false);
      return;
    }

    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubscribe = onSnapshot(childrenRef, (snapshot) => {
      const loadedChildren: Child[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const age = calculateAge(data.birthDate);
        return {
          id: docSnap.id,
          name: data.name || "Child",
          age: age || 0,
        };
      });
      setChildren(loadedChildren);
      setLoadingChildren(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Cleanup BLE on unmount
  useEffect(() => {
    return () => {
      bleService.disconnect();
    };
  }, []);

  const handleStartPairing = () => setStep("power-on");

  const handlePowerOnConfirm = async () => {
    try {
      const permissionsGranted = await bleService.requestPermissions();
      if (!permissionsGranted) {
        Alert.alert(
          "Permissions Required",
          "Bluetooth permissions are required to pair your toy. Please enable them in your device settings."
        );
        return;
      }

      const bluetoothEnabled = await bleService.checkBluetoothState();
      if (!bluetoothEnabled) {
        Alert.alert(
          "Bluetooth Required",
          "Please enable Bluetooth to continue."
        );
        return;
      }

      setStep("scanning");
      setScanning(true);
      setDiscoveredDevices([]);

      await bleService.startScanning((device) => {
        setDiscoveredDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }, 10000);

      setScanning(false);
      setStep("device-list");
    } catch (error: any) {
      setScanning(false);
      console.error("BLE scanning error:", error);
      Alert.alert(
        "Scanning Error",
        error?.message || "Failed to scan for toys. Please try again."
      );
      setStep("power-on");
    }
  };

  const handleDeviceSelect = async (device: LunoDevice) => {
    try {
      setSelectedDevice(device);
      setStep("connecting");

      const deviceId = await bleService.connectAndReadDeviceId(device.id);
      setConnectedDeviceId(deviceId);

      if (!currentUser) throw new Error("User not authenticated");

      const validation = await validateToyForPairing(deviceId, currentUser.uid);
      if (!validation.valid) {
        await bleService.disconnect();
        Alert.alert(
          "Pairing Blocked",
          validation.error || "Cannot pair this toy"
        );
        setStep("device-list");
        return;
      }

      await bleService.subscribeToStatus((status) =>
        setConnectionStatus(status)
      );
      await handleScanWifiNetworks();

      setStep("wifi");
    } catch (error: any) {
      console.error("Device connection error:", error);
      await bleService.disconnect();
      Alert.alert(
        "Connection Error",
        error?.message || "Failed to connect to toy. Please try again."
      );
      setStep("device-list");
    }
  };

  const handleRescan = () => {
    setDiscoveredDevices([]);
    handlePowerOnConfirm();
  };

  const handleScanWifiNetworks = async () => {
    try {
      setScanningNetworks(true);
      setWifiNetworks([]);
      setSelectedNetwork(null);
      setWifiSSID("");
      setWifiPassword("");
      setShowManualEntry(false);

      const networks = await bleService.scanWifiNetworks();
      setWifiNetworks(networks);
    } catch (error) {
      console.warn("Failed to scan WiFi networks:", error);
      // fallback to manual entry only
    } finally {
      setScanningNetworks(false);
    }
  };

  const handleNetworkSelect = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setWifiSSID(network.ssid);
    setWifiPassword("");
    setShowManualEntry(false);
  };

  const handleWifiSubmit = async () => {
    if (!wifiSSID.trim()) {
      Alert.alert(
        "WiFi Required",
        "Please select or enter your WiFi network name."
      );
      return;
    }

    const isOpenNetwork = selectedNetwork?.security === "open";
    if (!isOpenNetwork && !wifiPassword.trim()) {
      Alert.alert("Password Required", "Please enter your WiFi password.");
      return;
    }

    if (!currentUser?.email) {
      Alert.alert("Error", "User email not found. Please log in again.");
      return;
    }

    try {
      await bleService.sendWifiCredentials({
        ssid: wifiSSID.trim(),
        password: wifiPassword.trim(),
        userEmail: currentUser.email,
      });

      setStep("name");
    } catch (error: any) {
      console.error("WiFi credentials error:", error);
      Alert.alert(
        "WiFi Error",
        error?.message || "Failed to send WiFi credentials. Please try again."
      );
    }
  };

  const handleNameConfirm = () => {
    if (!toyName.trim()) {
      Alert.alert("Name Required", "Please enter a name for your toy.");
      return;
    }
    setStep("assign");
  };

  const handleAssignConfirm = async () => {
    if (!currentUser) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    const targetChildId =
      selectedChild || (children.length > 0 ? children[0].id : null);

    if (!targetChildId && children.length > 0) {
      Alert.alert("Assign Toy", "Please select a child to assign this toy to.");
      return;
    }

    setSaving(true);

    try {
      const toyDocRef = doc(
        db,
        "users",
        currentUser.uid,
        "toys",
        connectedDeviceId
      );

      await setDoc(toyDocRef, {
        deviceId: connectedDeviceId,
        name: toyName.trim(),
        // keep field for compatibility (we no longer display unicorn anywhere)
        emoji: "🧸",
        assignedChildId: targetChildId,
        pairedAt: serverTimestamp(),
        status: "online",
        batteryLevel: 100,
        lastConnected: serverTimestamp(),

        model: "Luno Gen 2",
        serialNumber: connectedDeviceId,
        firmwareVersion: "v2.1.4",

        volume: 70,
        ledBrightness: "Medium",
        soundEffects: true,
        voiceType: "Child-friendly",
        autoUpdate: true,

        connectionType: "Wi-Fi",
        wifiNetwork: wifiSSID.trim(),
        wifiConnected: true,
        wifiSSID: wifiSSID.trim(),
      });

      await bleService.disconnect();

      setSaving(false);
      setStep("success");
    } catch (error) {
      console.error("Error saving toy:", error);
      setSaving(false);
      Alert.alert("Error", "Failed to save toy. Please try again.");
    }
  };

  const handleFinish = () => {
    // Simply go back - AppNavigator will automatically detect that:
    // - toysCount > 0 (we just added a toy)
    // - childrenCount === 0 (no children yet)
    // And it will show the AddChild screen automatically via conditional rendering
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
    // If we can't go back, do nothing - the AppNavigator's useEffect
    // will detect the state change and redirect to AddChild automatically
  };

  const handleHeaderBack = async () => {
    if (step === "intro") {
      if (!navigation.canGoBack()) {
        // When user has no toys and can't go back, offer to logout
        if (!hasExistingToys) {
          Alert.alert(
            "Logout?",
            "You need to pair at least one toy to use the app. Do you want to logout?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    console.error("Logout error:", error);
                    Alert.alert("Error", "Failed to logout. Please try again.");
                  }
                }
              },
            ]
          );
        }
      } else {
        navigation.goBack();
      }
      return;
    }

    if (step === "power-on") setStep("intro");
    else if (step === "scanning") {
      bleService.stopScanning();
      setStep("power-on");
    } else if (step === "device-list") setStep("power-on");
    else if (step === "connecting" || step === "wifi") {
      await bleService.disconnect();
      setStep("device-list");
    } else if (step === "name") setStep("wifi");
    else if (step === "assign") setStep("name");
    else if (step === "success") handleFinish();
    else {
      if (bleService.getConnectedDevice()) await bleService.disconnect();
      if (navigation.canGoBack()) navigation.goBack();
    }
  };

  const primaryDisabled =
    step === "wifi" &&
    (!wifiSSID.trim() ||
      (selectedNetwork?.security !== "open" &&
        !wifiPassword.trim() &&
        !showManualEntry));

  const switchy = useMemo(
    () => ({
      cardText: "rgba(255,255,255,0.78)",
      subtle: "rgba(255,255,255,0.60)",
    }),
    []
  );

  return (
    <View style={styles.container}>
      <StarryBackground />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
            <TouchableOpacity
              onPress={handleHeaderBack}
              style={styles.headerBtn}
              activeOpacity={0.85}
            >
              <Ionicons
                name={hasExistingToys ? "close" : "log-out-outline"}
                size={scaleSize(20)}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>PAIRING</Text>
              <Text style={styles.pageTitle}>Pair new toy</Text>
              <Text style={styles.subTitle}>
                {step === "intro"
                  ? "A quick setup to get Luno online."
                  : "Follow the steps below to complete pairing."}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingHorizontal: screenPadding },
            ]}
            contentInsetAdjustmentBehavior="automatic"
          >
            {/* INTRO */}
            {step === "intro" && (
              <>
                <SectionHeader kicker="SETUP" title="Let’s get started" />
                <GradientCard>
                  <View style={styles.hero}>
                    <Image source={infoIcon} style={styles.lunoImg} />
                    <Text style={styles.heroTitle}>Pair your Luno toy</Text>
                    <Text style={styles.heroBody}>
                      This connects your toy via Bluetooth first, then sets up
                      Wi-Fi so it stays connected at home.
                    </Text>

                    <View style={styles.stepsList}>
                      {[
                        { n: "1", t: "Power on your toy" },
                        { n: "2", t: "Connect via Bluetooth" },
                        { n: "3", t: "Set up Wi-Fi" },
                        { n: "4", t: "Name & assign" },
                      ].map((s, idx) => (
                        <View key={s.n} style={styles.stepRow}>
                          <View style={styles.stepNumPill}>
                            <Text style={styles.stepNumText}>{s.n}</Text>
                          </View>
                          <Text style={styles.stepText}>{s.t}</Text>
                          {idx !== 3 && <View style={styles.stepLine} />}
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleStartPairing}
                      activeOpacity={0.9}
                    >
                      <Ionicons
                        name="sparkles"
                        size={scaleSize(18)}
                        color="#0B0B0D"
                        style={{ marginRight: rs[2] }}
                      />
                      <Text style={styles.primaryButtonText}>
                        Start pairing
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* POWER ON */}
            {step === "power-on" && (
              <>
                <SectionHeader kicker="STEP 1" title="Power on your toy" />
                <GradientCard>
                  <View style={styles.block}>
                    <View style={styles.iconPill}>
                      <Ionicons
                        name="flash"
                        size={scaleSize(18)}
                        color="#FDBD4B"
                      />
                    </View>
                    <Text style={styles.blockTitle}>Ready for pairing</Text>
                    <Text style={styles.blockBody}>
                      1) Turn on your toy using the power button on the bottom.
                      {"\n"}
                      2) Wait for the LED to flash blue.{"\n"}
                      3) Keep the toy nearby.
                    </Text>

                    <View style={styles.tipBox}>
                      <Text style={styles.tipText}>
                        Tip: If you don’t see a flashing LED, hold the power
                        button for 3 seconds and try again.
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handlePowerOnConfirm}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Toy is ready</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("intro")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* SCANNING */}
            {step === "scanning" && (
              <>
                <SectionHeader kicker="STEP 2" title="Searching nearby" />
                <GradientCard>
                  <View style={styles.centerBlock}>
                    <ActivityIndicator size="large" color="#FDBD4B" />
                    <Text style={styles.blockTitle}>Scanning for toys…</Text>
                    <Text style={styles.blockBody}>
                      Keep your toy close and powered on.
                      {discoveredDevices.length > 0
                        ? `\nFound ${discoveredDevices.length} so far…`
                        : ""}
                    </Text>
                  </View>
                </GradientCard>
              </>
            )}

            {/* DEVICE LIST */}
            {step === "device-list" && (
              <>
                <SectionHeader kicker="STEP 2" title="Select your toy" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      {discoveredDevices.length > 0
                        ? "Tap your toy to connect."
                        : "No toys found yet. Make sure the LED is flashing blue, then retry."}
                    </Text>

                    <View style={{ marginTop: rs[3] }}>
                      {discoveredDevices.length > 0 ? (
                        <View>
                          {discoveredDevices.map((device, idx) => (
                            <React.Fragment key={device.id}>
                              {idx > 0 && <RowDivider />}
                              <TouchableOpacity
                                style={styles.row}
                                activeOpacity={0.85}
                                onPress={() => handleDeviceSelect(device)}
                              >
                                <Image
                                  source={successIcon}
                                  style={styles.deviceIconImg}
                                />

                                <View style={{ flex: 1, paddingRight: rs[3] }}>
                                  <Text style={styles.rowTitle}>
                                    {device.name || "Luno Toy"}
                                  </Text>
                                  <Text style={styles.rowSubtitle}>
                                    Signal:{" "}
                                    {device.rssi
                                      ? `${device.rssi} dBm`
                                      : "Unknown"}
                                  </Text>
                                </View>

                                <ChevronRight />
                              </TouchableOpacity>
                            </React.Fragment>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.emptyState}>
                          <Text style={styles.mutedText}>
                            Nothing found yet. Try “Retry scan”.
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleRescan}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>
                        {discoveredDevices.length > 0
                          ? "Scan again"
                          : "Retry scan"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("power-on")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* CONNECTING */}
            {step === "connecting" && (
              <>
                <SectionHeader kicker="STEP 2" title="Connecting" />
                <GradientCard>
                  <View style={styles.centerBlock}>
                    <ActivityIndicator size="large" color="#FDBD4B" />
                    <Text style={styles.blockTitle}>
                      Connecting to {selectedDevice?.name || "toy"}…
                    </Text>
                    <Text style={styles.blockBody}>
                      Establishing secure connection…
                    </Text>
                  </View>
                </GradientCard>
              </>
            )}

            {/* WIFI */}
            {step === "wifi" && (
              <>
                <SectionHeader kicker="STEP 3" title="Connect to Wi-Fi" />

                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      Select your home network and enter the password so your
                      toy stays connected without your phone.
                    </Text>

                    <View style={{ marginTop: rs[4] }}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Available networks</Text>
                        {!scanningNetworks && (
                          <TouchableOpacity
                            onPress={handleScanWifiNetworks}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.cardActionText}>Rescan</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {scanningNetworks ? (
                        <View style={styles.scanningRow}>
                          <ActivityIndicator size="small" color="#FDBD4B" />
                          <Text style={styles.rowSubtitle}>Scanning…</Text>
                        </View>
                      ) : wifiNetworks.length > 0 ? (
                        <View style={styles.networkListWrap}>
                          {wifiNetworks.map((network, index) => {
                            const isSelected =
                              selectedNetwork?.ssid === network.ssid;
                            return (
                              <TouchableOpacity
                                key={`${network.ssid}-${index}`}
                                style={[
                                  styles.networkRow,
                                  isSelected && styles.networkRowSelected,
                                ]}
                                activeOpacity={0.85}
                                onPress={() => handleNetworkSelect(network)}
                              >
                                <View style={{ flex: 1, paddingRight: rs[3] }}>
                                  <Text style={styles.rowTitle}>
                                    {network.ssid || "Hidden network"}
                                  </Text>
                                  <Text style={styles.rowSubtitle}>
                                    {network.security === "open"
                                      ? "Open network"
                                      : "Secured"}{" "}
                                    •{" "}
                                    {typeof network.rssi === "number"
                                      ? `Signal ${network.rssi} dBm`
                                      : "Signal unknown"}
                                  </Text>
                                </View>
                                {isSelected ? (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={scaleSize(18)}
                                    color="#FDBD4B"
                                  />
                                ) : (
                                  <Ionicons
                                    name="radio-button-off"
                                    size={scaleSize(18)}
                                    color="rgba(255,255,255,0.35)"
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.emptyState}>
                          <Text style={styles.mutedText}>
                            No networks found. You can enter your Wi-Fi manually
                            below.
                          </Text>
                          <TouchableOpacity
                            style={styles.outlineButton}
                            onPress={handleScanWifiNetworks}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.outlineButtonText}>
                              Scan networks
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <View style={{ marginTop: rs[4] }}>
                      <Text style={styles.cardTitle}>Network details</Text>

                      {!!selectedNetwork?.ssid && (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedPillLabel}>Selected</Text>
                          <Text style={styles.selectedPillValue}>
                            {selectedNetwork.ssid}
                          </Text>
                        </View>
                      )}

                      {wifiNetworks.length > 0 && (
                        <TouchableOpacity
                          style={{ marginTop: rs[2] }}
                          activeOpacity={0.85}
                          onPress={() => setShowManualEntry((p) => !p)}
                        >
                          <Text style={styles.linkText}>
                            {showManualEntry
                              ? "Hide manual entry"
                              : "Can’t see your Wi-Fi? Enter it manually"}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {(wifiNetworks.length === 0 || showManualEntry) && (
                        <View style={{ marginTop: rs[3] }}>
                          <Text style={styles.inputLabel}>
                            Wi-Fi network name (SSID)
                          </Text>
                          <TextInput
                            style={styles.input}
                            value={wifiSSID}
                            onChangeText={setWifiSSID}
                            placeholder="e.g., Home WiFi"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                      )}

                      {(!selectedNetwork ||
                        selectedNetwork.security !== "open" ||
                        showManualEntry) && (
                        <View style={{ marginTop: rs[3] }}>
                          <Text style={styles.inputLabel}>Wi-Fi password</Text>
                          <TextInput
                            style={styles.input}
                            value={wifiPassword}
                            onChangeText={setWifiPassword}
                            placeholder="Enter password"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          <Text style={styles.inputHint}>
                            We don’t store your password — it’s only used to
                            connect this toy.
                          </Text>
                        </View>
                      )}
                    </View>

                    {!!connectionStatus && (
                      <View style={styles.statusBox}>
                        <Text style={styles.statusLabel}>Status</Text>
                        <Text style={styles.statusText}>
                          {connectionStatus}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        primaryDisabled && styles.disabledButton,
                      ]}
                      onPress={handleWifiSubmit}
                      activeOpacity={0.9}
                      disabled={primaryDisabled}
                    >
                      <Text style={styles.primaryButtonText}>Connect</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={async () => {
                        await bleService.disconnect();
                        setStep("device-list");
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* NAME */}
            {step === "name" && (
              <>
                <SectionHeader kicker="STEP 4" title="Name your toy" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      Give your toy a short name your child will recognize.
                    </Text>

                    <View style={{ marginTop: rs[4] }}>
                      <Text style={styles.inputLabel}>Toy name</Text>
                      <TextInput
                        style={styles.input}
                        value={toyName}
                        onChangeText={setToyName}
                        placeholder="e.g., Luno"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleNameConfirm}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("wifi")}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* ASSIGN */}
            {step === "assign" && (
              <>
                <SectionHeader kicker="STEP 5" title="Assign to a child" />
                <GradientCard>
                  <View style={styles.block}>
                    <Text style={styles.blockBody}>
                      {children.length > 0
                        ? `Who will use ${toyName || "this toy"}?`
                        : "You’ll need to add a child profile next."}
                    </Text>

                    {loadingChildren ? (
                      <View style={styles.centerBlock}>
                        <ActivityIndicator size="large" color="#FDBD4B" />
                      </View>
                    ) : children.length > 0 ? (
                      <View style={{ marginTop: rs[4] }}>
                        {children.map((child, idx) => {
                          const isSelected = selectedChild === child.id;
                          return (
                            <View key={child.id}>
                              {idx > 0 && <View style={{ height: rs[2] }} />}
                              <TouchableOpacity
                                style={[
                                  styles.childOption,
                                  isSelected && styles.childOptionSelected,
                                ]}
                                activeOpacity={0.9}
                                onPress={() => setSelectedChild(child.id)}
                              >
                                <View style={styles.childAvatar}>
                                  <Text style={styles.childAvatarText}>
                                    {child.name?.charAt(0)?.toUpperCase()}
                                  </Text>
                                </View>

                                <View style={{ flex: 1, paddingRight: rs[3] }}>
                                  <Text style={styles.rowTitle}>
                                    {child.name}
                                  </Text>
                                  <Text style={styles.rowSubtitle}>
                                    {child.age} years old
                                  </Text>
                                </View>

                                {isSelected ? (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={scaleSize(18)}
                                    color="#FDBD4B"
                                  />
                                ) : (
                                  <Ionicons
                                    name="radio-button-off"
                                    size={scaleSize(18)}
                                    color="rgba(255,255,255,0.35)"
                                  />
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        saving && styles.disabledButton,
                      ]}
                      onPress={handleAssignConfirm}
                      activeOpacity={0.9}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#0B0B0D" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {children.length > 0 ? "Finish setup" : "Continue"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => setStep("name")}
                      activeOpacity={0.9}
                      disabled={saving}
                    >
                      <Text style={styles.ghostButtonText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <>
                <SectionHeader kicker="DONE" title="All set!" />
                <GradientCard>
                  <View style={styles.block}>
                    <Image source={successIcon} style={styles.successIconImg} />

                    <Text style={styles.blockTitle}>Paired successfully</Text>
                    <Text style={styles.blockBody}>
                      {toyName} is connected and ready.
                      {selectedChild
                        ? `\nAssigned to ${
                            children.find((c) => c.id === selectedChild)?.name
                          }.`
                        : ""}
                    </Text>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleFinish}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </GradientCard>
              </>
            )}

            {/* Extra bottom space for floating menu */}
            <View style={{ height: scaleSize(160) }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "transparent", zIndex: 2 },

  // Header
  header: {
    paddingTop: rs[4],
    paddingBottom: rs[4],
    flexDirection: "row",
    alignItems: "center",
    gap: rs[3],
  },
  headerBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconImg: {
    width: scaleSize(18),
    height: scaleSize(18),
    resizeMode: "contain",
    opacity: 0.95,
  },
  kicker: {
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 3,
    fontWeight: "900",
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

  content: { paddingTop: rs[2] },

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
    padding: 1,
    marginBottom: rs[3],
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
  cardInner: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(0,0,0,0.70)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    overflow: "hidden",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: rs[4],
  },

  // Blocks
  hero: { padding: rs[5] },
  block: { padding: rs[5] },
  centerBlock: {
    padding: rs[6],
    alignItems: "center",
    justifyContent: "center",
  },

  lunoBubble: {
    width: scaleSize(54),
    height: scaleSize(54),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: rs[4],
  },
  lunoImg: {
    width: scaleSize(120),
    height: scaleSize(120),
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: rs[4],
  },

  heroTitle: {
    textAlign: "center",
    fontSize: rt.fontSize.xl,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: rs[2],
  },
  heroBody: {
    textAlign: "center",
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  stepsList: { marginTop: rs[5] },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: rs[3] },
  stepNumPill: {
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.18)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.26)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: rs[3],
  },
  stepNumText: {
    color: "#FDBD4B",
    fontWeight: "900",
    fontSize: rt.fontSize.sm,
  },
  stepText: { color: "rgba(255,255,255,0.86)", fontWeight: "800", flex: 1 },
  stepLine: {
    width: scaleSize(24),
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginLeft: rs[3],
  },

  iconPill: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs[3],
  },

  blockTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: rs[2],
  },
  blockBody: {
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.sm,
  },

  tipBox: {
    marginTop: rs[4],
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.20)",
    borderRadius: rbr.lg,
    padding: rs[4],
  },
  tipText: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
    fontSize: rt.fontSize.sm,
  },

  // Row styles (device list)
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
  deviceIconImg: {
    width: scaleSize(60),
    height: scaleSize(60),
    resizeMode: "contain",
    marginRight: rs[3],
  },

  // WiFi
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs[2],
  },
  cardTitle: {
    fontSize: rt.fontSize.xs,
    letterSpacing: 1.2,
    color: "rgba(253,189,75,0.85)",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardActionText: {
    color: "#FDBD4B",
    fontWeight: "900",
    fontSize: rt.fontSize.sm,
  },

  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs[2],
    paddingVertical: rs[2],
  },

  networkListWrap: {
    marginTop: rs[2],
    borderRadius: rbr.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  networkRow: {
    paddingHorizontal: rs[4],
    paddingVertical: rs[4],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
  },
  networkRowSelected: {
    backgroundColor: "rgba(253,189,75,0.10)",
    borderLeftWidth: 3,
    borderLeftColor: "#FDBD4B",
  },

  selectedPill: {
    marginTop: rs[3],
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: rs[3],
    paddingVertical: rs[2],
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.20)",
  },
  selectedPillLabel: {
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.95)",
    letterSpacing: 1.1,
    marginRight: rs[2],
    textTransform: "uppercase",
  },
  selectedPillValue: { color: "rgba(255,255,255,0.90)", fontWeight: "800" },

  linkText: { color: "#FDBD4B", fontWeight: "900", fontSize: rt.fontSize.sm },

  inputLabel: {
    fontSize: rt.fontSize.sm,
    fontWeight: "900",
    color: "rgba(255,255,255,0.80)",
    marginBottom: rs[2],
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.30)",
    borderRadius: rbr.lg,
    paddingHorizontal: rs[4],
    paddingVertical: rs[4],
    fontSize: rt.fontSize.base,
    color: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  inputHint: {
    marginTop: rs[2],
    fontSize: rt.fontSize.xs,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    lineHeight: typography.lineHeight.relaxed * rt.fontSize.xs,
  },

  statusBox: {
    marginTop: rs[4],
    padding: rs[4],
    borderRadius: rbr.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statusLabel: {
    fontSize: rt.fontSize.xs,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "900",
    marginBottom: rs[2],
    textTransform: "uppercase",
  },
  statusText: { color: "rgba(255,255,255,0.86)", fontWeight: "800" },

  // Child assignment
  childOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: rbr.lg,
    padding: rs[4],
  },
  childOptionSelected: {
    backgroundColor: "rgba(253,189,75,0.10)",
    borderColor: "rgba(253,189,75,0.30)",
  },
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
    marginTop: rs[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDBD4B",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
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
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },

  ghostButton: {
    marginTop: rs[3],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ghostButtonText: { color: "rgba(255,255,255,0.82)", fontWeight: "900" },

  outlineButton: {
    marginTop: rs[3],
    alignSelf: "flex-start",
    paddingHorizontal: rs[4],
    paddingVertical: rs[3],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.26)",
  },
  outlineButtonText: { color: "#FDBD4B", fontWeight: "900" },

  disabledButton: { opacity: 0.55 },

  emptyState: { paddingTop: rs[3] },
  mutedText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: rt.fontSize.sm,
    fontWeight: "700",
  },

  successIcon: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    backgroundColor: "#FDBD4B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs[3],
  },
  successIconImg: {
    width: scaleSize(120),
    height: scaleSize(120),
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: rs[4],
  },
});
