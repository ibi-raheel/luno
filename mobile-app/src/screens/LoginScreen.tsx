// src/screens/LoginScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
  responsiveLayout,
} from "../constants/theme";
import { scaleSize } from "../utils/responsive";
import { StarryBackground } from "../components/StarryBackground";

const infoIcon = require("../../assets/info_icon.png");

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { signIn } = useAuth();
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  const canSubmit = useMemo(
    () => !!email.trim() && !!password,
    [email, password]
  );

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        "Login failed",
        error?.message || "Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StarryBackground />

      {/* Subtle vignette/brand wash */}
      <LinearGradient
        colors={["rgba(0,0,0,0.86)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.92)"]}
        style={StyleSheet.absoluteFill}
      />

      <StatusBar barStyle="light-content" />
      <SafeAreaViewCompat style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: screenPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Entire login block as one unit */}
            <View style={styles.loginBlock}>
              {/* Heading / Subheading (our format) */}
              <View style={styles.hero}>
                <LinearGradient
                  colors={["rgba(253,189,75,0.35)", "rgba(255,255,255,0.08)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconRing}
                >
                  <View style={styles.iconInner}>
                    <Image source={infoIcon} style={styles.heroIcon} />
                  </View>
                </LinearGradient>

                <LinearGradient
                  colors={["rgba(253,189,75,0.22)", "rgba(255,255,255,0.06)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.eyebrowPill}
                >
                  <Text style={styles.eyebrowText}>LUNO COMPANION</Text>
                </LinearGradient>

                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
              </View>

              {/* Login Card */}
              <LinearGradient
                colors={[
                  "rgba(253,189,75,0.20)",
                  "rgba(255,255,255,0.08)",
                  "rgba(0,0,0,0.42)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.card}>
                  {/* Email */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputRow}>
                      <Ionicons
                        name="mail-outline"
                        size={scaleSize(18)}
                        color="rgba(255,255,255,0.78)"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="you@email.com"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputRow}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={scaleSize(18)}
                        color="rgba(255,255,255,0.78)"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPw}
                        editable={!loading}
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        activeOpacity={0.85}
                        onPress={() => setShowPw((p) => !p)}
                      >
                        <Ionicons
                          name={showPw ? "eye-off-outline" : "eye-outline"}
                          size={scaleSize(18)}
                          color="rgba(255,255,255,0.65)"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Forgot */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                    style={styles.forgotButton}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Login */}
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!canSubmit || loading) && styles.primaryBtnDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={!canSubmit || loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0B0B0D" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Sign in</Text>
                    )}
                  </TouchableOpacity>

                  {/* Sign up */}
                  <View style={styles.signupRow}>
                    <Text style={styles.signupText}>
                      Don't have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Signup")}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.signupLink}>Sign up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Extra bottom space */}
            <View style={{ height: scaleSize(160) }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaViewCompat>
    </View>
  );
}

/** Minimal SafeArea compat so this file is drop-in even if your imports differ */
function SafeAreaViewCompat({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, zIndex: 2, backgroundColor: "transparent" },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: rs[20],
    paddingBottom: rs[6],
  },

  loginBlock: {
    width: "100%",
    alignItems: "center",
  },

  // Hero
  hero: {
    alignItems: "center",
    marginBottom: rs[6],
  },
  iconRing: {
    width: scaleSize(112),
    height: scaleSize(112),
    borderRadius: 999,
    padding: 2,
    marginBottom: rs[4],
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  iconInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIcon: {
    width: scaleSize(78),
    height: scaleSize(78),
    resizeMode: "contain",
    opacity: 0.98,
  },
  eyebrowPill: {
    paddingHorizontal: rs[4],
    paddingVertical: rs[2],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    marginBottom: rs[3],
  },
  eyebrowText: {
    fontSize: rt.fontSize.xs,
    fontWeight: "900",
    color: "rgba(253,189,75,0.95)",
    letterSpacing: 1.8,
  },
  title: {
    fontSize: rt.fontSize["3xl"],
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  subtitle: {
    marginTop: rs[2],
    fontSize: rt.fontSize.base,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
    textAlign: "center",
  },

  // Card
  cardGradient: {
    width: "100%",
    maxWidth: scaleSize(420),
    borderRadius: rbr.xl,
    padding: 1,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  card: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.20)",
    padding: rs[5],
  },

  field: { marginBottom: rs[4] },
  label: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: "900",
    fontSize: rt.fontSize.sm,
    marginBottom: rs[2],
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs[3],
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: rbr.lg,
    paddingHorizontal: rs[4],
    paddingVertical: rs[4],
  },
  input: {
    flex: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: rt.fontSize.base,
    fontWeight: "700",
  },
  eyeBtn: {
    width: scaleSize(34),
    height: scaleSize(34),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  forgotButton: { alignSelf: "flex-end", marginBottom: rs[5] },
  forgotText: { color: "#FDBD4B", fontWeight: "900", fontSize: rt.fontSize.sm },

  primaryBtn: {
    backgroundColor: "#FDBD4B",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: rs[2],
    marginTop: rs[4],
  },
  signupText: { color: "rgba(255,255,255,0.70)", fontWeight: "700" },
  signupLink: { color: "#FDBD4B", fontWeight: "900" },
});
