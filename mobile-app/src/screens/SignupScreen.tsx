// src/screens/SignupScreen.tsx
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

export default function SignupScreen({ navigation }: any) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [showPw, setShowPw] = useState(false);

  const { signUp } = useAuth();
  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];

  const canSubmit = useMemo(() => {
    return (
      !!displayName.trim() &&
      !!email.trim() &&
      password.length >= 6 &&
      agreedToTerms &&
      agreedToPrivacy
    );
  }, [displayName, email, password, agreedToTerms, agreedToPrivacy]);

  function mapFirebaseError(error: any): string {
    const code = error?.code || "";

    if (code.includes("auth/email-already-in-use")) {
      return "An account already exists with this email.";
    }
    if (code.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (code.includes("auth/weak-password")) {
      return "Password is too weak. Please choose a stronger one.";
    }
    return error?.message || "Please try again.";
  }

  async function handleSignup() {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (!agreedToTerms || !agreedToPrivacy) {
      Alert.alert(
        "Agreement Required",
        "Please read and agree to both the Terms & Conditions and Privacy Policy before creating your account."
      );
      return;
    }

    try {
      setLoading(true);
      await signUp(trimmedEmail, password, trimmedName);
      // Auth listener handles navigation
    } catch (error: any) {
      Alert.alert("Signup failed", mapFirebaseError(error));
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
            {/* Entire signup block as one unit */}
            <View style={styles.signupBlock}>
              {/* Heading / Subheading (same format as Login) */}
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

                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>
                  Set up your parent profile in under a minute
                </Text>
              </View>

              {/* Signup Card */}
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
                  {/* Display Name */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Display name</Text>
                    <View style={styles.inputRow}>
                      <Ionicons
                        name="person-outline"
                        size={scaleSize(18)}
                        color="rgba(255,255,255,0.78)"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={displayName}
                        onChangeText={setDisplayName}
                        editable={!loading}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

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
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Password</Text>
                      <Text style={styles.hintText}>Min 6 characters</Text>
                    </View>

                    <View style={styles.inputRow}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={scaleSize(18)}
                        color="rgba(255,255,255,0.78)"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Create a password"
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

                  {/* Terms and Conditions Agreement */}
                  <TouchableOpacity
                    style={styles.termsRow}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <View style={styles.checkboxWrapper}>
                      <View
                        style={[
                          styles.checkbox,
                          agreedToTerms && styles.checkboxChecked,
                        ]}
                      >
                        {agreedToTerms && (
                          <Ionicons
                            name="checkmark"
                            size={scaleSize(14)}
                            color="#0B0B0D"
                          />
                        )}
                      </View>
                    </View>
                    <Text style={styles.termsText}>
                      I have read and agree to the{" "}
                      <Text
                        style={styles.termsLink}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate("Terms");
                        }}
                      >
                        Terms & Conditions
                      </Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Privacy Policy Agreement */}
                  <TouchableOpacity
                    style={styles.termsRow}
                    onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <View style={styles.checkboxWrapper}>
                      <View
                        style={[
                          styles.checkbox,
                          agreedToPrivacy && styles.checkboxChecked,
                        ]}
                      >
                        {agreedToPrivacy && (
                          <Ionicons
                            name="checkmark"
                            size={scaleSize(14)}
                            color="#0B0B0D"
                          />
                        )}
                      </View>
                    </View>
                    <Text style={styles.termsText}>
                      I have read and agree to the{" "}
                      <Text
                        style={styles.termsLink}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate("Privacy");
                        }}
                      >
                        Privacy Policy
                      </Text>{" "}
                      and understand how my data and my child's data will be
                      collected and used
                    </Text>
                  </TouchableOpacity>

                  {/* Create account */}
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!canSubmit || loading) && styles.primaryBtnDisabled,
                    ]}
                    onPress={handleSignup}
                    disabled={!canSubmit || loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0B0B0D" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Create account</Text>
                    )}
                  </TouchableOpacity>

                  {/* Back to login */}
                  <View style={styles.loginRow}>
                    <Text style={styles.loginText}>
                      Already have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Login")}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.loginLink}>Log in</Text>
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

  signupBlock: {
    width: "100%",
    alignItems: "center",
  },

  // Hero (same system as Login)
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
    maxWidth: scaleSize(360),
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
  labelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: rs[2],
  },
  label: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: "900",
    fontSize: rt.fontSize.sm,
    letterSpacing: 0.2,
    marginBottom: rs[2],
  },
  hintText: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "800",
    fontSize: rt.fontSize.xs,
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

  // Terms agreement
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: rs[3],
    marginBottom: rs[1],
  },
  checkboxWrapper: {
    marginTop: 2,
    marginRight: rs[3],
  },
  checkbox: {
    width: scaleSize(20),
    height: scaleSize(20),
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#FDBD4B",
    borderColor: "#FDBD4B",
  },
  termsText: {
    flex: 1,
    fontSize: rt.fontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    lineHeight: rt.fontSize.sm * 1.5,
  },
  termsLink: {
    color: "#FDBD4B",
    fontWeight: "900",
    textDecorationLine: "underline",
  },

  primaryBtn: {
    backgroundColor: "#FDBD4B",
    borderRadius: rbr.lg,
    paddingVertical: rs[4],
    alignItems: "center",
    justifyContent: "center",
    marginTop: rs[1],
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: "#0B0B0D",
    fontWeight: "900",
    fontSize: rt.fontSize.base,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: rs[2],
    marginTop: rs[4],
  },
  loginText: { color: "rgba(255,255,255,0.70)", fontWeight: "700" },
  loginLink: { color: "#FDBD4B", fontWeight: "900" },
});
