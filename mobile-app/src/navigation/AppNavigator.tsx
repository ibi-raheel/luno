// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";

// Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import DashboardScreen from "../screens/DashboardScreen";
import TimelineScreen from "../screens/TimelineScreen";
import FlagsScreen from "../screens/FlagsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ConversationScreen from "../screens/ConversationScreen";
import ToysScreen from "../screens/ToysScreen";
import ParentalControlsScreen from "../screens/ParentalControlsScreen";
import ChildProfileScreen from "../screens/ChildProfileScreen";
import ToySettingsScreen from "../screens/ToySettingsScreen";
import AddToyScreen from "../screens/AddToyScreen";
import AddChildScreen from "../screens/AddChildScreen";
import CatalogScreen from "../screens/CatalogScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import HelpScreen from "../screens/HelpScreen";
import TermsScreen from "../screens/TermsScreen";

// Types
export type RootStackParamList = {
  Auth: undefined;
  Main: { screen?: keyof MainTabParamList } | undefined;
  Conversation: undefined;
  Toys: undefined;
  ParentalControls: undefined;
  ChildProfile: { childId?: string; childName?: string; childAge?: number };
  ToySettings: { toyId: string };
  AddToy: undefined;
  AddChild: undefined;
  Catalog: undefined;
  Privacy: undefined;
  Help: undefined;
  Terms: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Privacy: undefined;
  Terms: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Timeline: undefined;
  Safety: undefined;
  Controls: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_META: Record<
  keyof MainTabParamList,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconFocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  Home: { label: "Home", icon: "home-outline", iconFocused: "home" },
  Timeline: { label: "Timeline", icon: "time-outline", iconFocused: "time" },
  Safety: {
    label: "Safety",
    icon: "shield-checkmark-outline",
    iconFocused: "shield-checkmark",
  },
  Controls: {
    label: "Controls",
    icon: "lock-closed-outline",
    iconFocused: "lock-closed",
  },
  Settings: {
    label: "Settings",
    icon: "settings-outline",
    iconFocused: "settings",
  },
};

function MainTabs() {
  const insets = useSafeAreaInsets();

  // tighter + more balanced than before
  const barHeight = Platform.OS === "ios" ? 56 + insets.bottom : 56;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const meta = TAB_META[route.name as keyof MainTabParamList];

        return {
          headerShown: false,

          // keep labels, but make them clean + tight
          tabBarShowLabel: true,
          tabBarLabelPosition: "below-icon",
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              style={[
                navStyles.label,
                focused ? navStyles.labelActive : navStyles.labelInactive,
              ]}
            >
              {meta?.label ?? route.name}
            </Text>
          ),

          tabBarIcon: ({ focused }) => {
            const iconName = focused ? meta.iconFocused : meta.icon;
            return (
              <View
                style={[
                  navStyles.iconWrap,
                  focused ? navStyles.iconWrapActive : navStyles.iconWrapIdle,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={focused ? "#FDBD4B" : "rgba(255,255,255,0.55)"}
                />
              </View>
            );
          },

          tabBarStyle: {
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 12,
            height: barHeight,

            // key fixes for the “too much space” issue:
            paddingTop: 6,
            paddingBottom: Platform.OS === "ios" ? 6 + insets.bottom : 6,

            borderTopWidth: 0,
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.78)",
            borderWidth: 1,
            borderColor: "rgba(253,189,75,0.22)",

            shadowColor: "#000",
            shadowOpacity: 0.35,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          },

          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 0,
          },

          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: 0,
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Safety" component={FlagsScreen} />
      <Tab.Screen name="Controls" component={ParentalControlsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={SignupScreen} />
      <AuthStackNav.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStackNav.Screen name="Privacy" component={PrivacyScreen} />
      <AuthStackNav.Screen name="Terms" component={TermsScreen} />
    </AuthStackNav.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FDBD4B" />
      <Text style={styles.loadingText}>Starting Luno Companion...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { currentUser, loading, isDemoMode } = useAuth();

  const [toysCount, setToysCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load onboarding + counts from Firestore for real users
  useEffect(() => {
    if (!currentUser || isDemoMode) {
      setToysCount(0);
      setChildrenCount(0);
      setOnboardingCompleted(false);
      setDataLoaded(true);
      return;
    }

    setDataLoaded(false);
    setToysCount(0);
    setChildrenCount(0);

    let cancelled = false;
    let loadedFlags = { user: false, toys: false, children: false };

    const checkAllLoaded = () => {
      if (
        !cancelled &&
        loadedFlags.user &&
        loadedFlags.toys &&
        loadedFlags.children
      ) {
        setDataLoaded(true);
      }
    };

    // 1) User document (for onboardingCompleted)
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const completed = !!data?.onboardingCompleted;
        console.log(
          "[AppNavigator] User doc updated. onboardingCompleted:",
          completed
        );
        setOnboardingCompleted(completed);
      } else {
        console.log("[AppNavigator] User doc does not exist");
        setOnboardingCompleted(false);
      }
      loadedFlags.user = true;
      checkAllLoaded();
    });

    // 2) Toys collection
    const toysRef = collection(db, "users", currentUser.uid, "toys");
    const unsubToys = onSnapshot(toysRef, (snapshot) => {
      console.log("[AppNavigator] Toys count updated:", snapshot.size);
      setToysCount(snapshot.size);
      loadedFlags.toys = true;
      checkAllLoaded();
    });

    // 3) Children collection
    const childrenRef = collection(db, "users", currentUser.uid, "children");
    const unsubChildren = onSnapshot(childrenRef, (snapshot) => {
      console.log("[AppNavigator] Children count updated:", snapshot.size);
      setChildrenCount(snapshot.size);
      loadedFlags.children = true;
      checkAllLoaded();
    });

    return () => {
      cancelled = true;
      unsubUser();
      unsubToys();
      unsubChildren();
    };
  }, [currentUser, isDemoMode]);

  if (loading || (currentUser && !isDemoMode && !dataLoaded)) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!currentUser;
  const needsOnboarding =
    isAuthenticated &&
    !isDemoMode &&
    (!onboardingCompleted || toysCount === 0 || childrenCount === 0);

  console.log(
    "[AppNavigator] Render - needsOnboarding:",
    needsOnboarding,
    "toysCount:",
    toysCount,
    "childrenCount:",
    childrenCount,
    "onboardingCompleted:",
    onboardingCompleted
  );

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : needsOnboarding ? (
          <>
            {toysCount === 0 ? (
              <RootStack.Screen
                name="AddToy"
                component={AddToyScreen}
                options={{ gestureEnabled: false }}
              />
            ) : (
              <RootStack.Screen
                name="AddChild"
                component={AddChildScreen}
                options={{ gestureEnabled: false }}
              />
            )}
          </>
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="Conversation"
              component={ConversationScreen}
            />
            <RootStack.Screen name="Toys" component={ToysScreen} />
            <RootStack.Screen
              name="ChildProfile"
              component={ChildProfileScreen}
            />
            <RootStack.Screen
              name="ToySettings"
              component={ToySettingsScreen}
            />
            <RootStack.Screen name="AddToy" component={AddToyScreen} />
            <RootStack.Screen name="AddChild" component={AddChildScreen} />
            <RootStack.Screen name="Catalog" component={CatalogScreen} />
            <RootStack.Screen name="Privacy" component={PrivacyScreen} />
            <RootStack.Screen name="Terms" component={TermsScreen} />
            <RootStack.Screen name="Help" component={HelpScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const navStyles = StyleSheet.create({
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(253,189,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
  },
  iconWrapIdle: {
    backgroundColor: "transparent",
  },

  label: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  labelActive: { color: "#FDBD4B" },
  labelInactive: { color: "rgba(255,255,255,0.50)" },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "800",
  },
});
