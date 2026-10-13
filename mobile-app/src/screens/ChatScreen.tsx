// src/screens/ChatScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from "react-native";
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

interface Message {
  id: string;
  text: string;
  sender: "user" | "toy";
  timestamp: Date;
}

const infoIcon = require("../../assets/info_icon.png");

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I’m Luna 🦄 How are you feeling today?",
      sender: "toy",
      timestamp: new Date(),
    },
  ]);

  const screenPadding = responsiveLayout?.screenPadding ?? rs[5];
  const scrollRef = useRef<ScrollView | null>(null);

  const canSend = useMemo(() => !!message.trim(), [message]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    // Simulate toy response
    setTimeout(() => {
      const toyResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "That’s awesome. Want to play a quick game or do an activity together?",
        sender: "toy",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, toyResponse]);
    }, 900);
  };

  useEffect(() => {
    // scroll to bottom whenever messages change
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  return (
    <View style={styles.container}>
      <StarryBackground />

      {/* Subtle vignette/brand wash */}
      <LinearGradient
        colors={["rgba(0,0,0,0.86)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.92)"]}
        style={StyleSheet.absoluteFill}
      />

      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: screenPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.85}
        >
          <Ionicons
            name="chevron-back"
            size={scaleSize(22)}
            color="rgba(255,255,255,0.92)"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <LinearGradient
            colors={["rgba(253,189,75,0.35)", "rgba(255,255,255,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <Image source={infoIcon} style={styles.avatarImg} />
            </View>
          </LinearGradient>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.headerTitle}>Luna</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerStatus}>Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            // optional: open a "Chat Settings" later
          }}
          style={styles.headerIconBtn}
          activeOpacity={0.85}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={scaleSize(22)}
            color="rgba(255,255,255,0.90)"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.chatContainer}
      >
        {/* Messages */}
        <ScrollView
          ref={(r) => (scrollRef.current = r)}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingHorizontal: screenPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* subtle top spacer */}
          <View style={{ height: rs[2] }} />

          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowToy,
                ]}
              >
                <LinearGradient
                  colors={
                    isUser
                      ? ["rgba(253,189,75,1)", "rgba(253,189,75,0.92)"]
                      : ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.04)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.bubbleOuter,
                    isUser ? styles.bubbleOuterUser : styles.bubbleOuterToy,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleToy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.messageTextUser : styles.messageTextToy,
                      ]}
                    >
                      {msg.text}
                    </Text>

                    <Text
                      style={[
                        styles.timeText,
                        isUser ? styles.timeTextUser : styles.timeTextToy,
                      ]}
                    >
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            );
          })}

          {/* bottom spacer so the last bubble isn't hidden behind input */}
          <View style={{ height: scaleSize(110) }} />
        </ScrollView>

        {/* Composer */}
        <View
          style={[styles.composerWrap, { paddingHorizontal: screenPadding }]}
        >
          <LinearGradient
            colors={[
              "rgba(253,189,75,0.16)",
              "rgba(255,255,255,0.08)",
              "rgba(0,0,0,0.60)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.composerGradient}
          >
            <View style={styles.composer}>
              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                  editable
                />
              </View>

              <TouchableOpacity
                onPress={sendMessage}
                disabled={!canSend}
                activeOpacity={0.9}
                style={[styles.sendBtnOuter, !canSend && { opacity: 0.55 }]}
              >
                <LinearGradient
                  colors={["#FDBD4B", "rgba(253,189,75,0.92)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendBtn}
                >
                  <Ionicons name="send" size={scaleSize(18)} color="#0B0B0D" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function formatTime(date: Date) {
  try {
    const h = date.getHours();
    const m = date.getMinutes();
    const hh = ((h + 11) % 12) + 1;
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hh}:${mm} ${ampm}`;
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Header
  header: {
    paddingTop: rs[16],
    paddingBottom: rs[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: scaleSize(42),
    height: scaleSize(42),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs[3],
  },
  avatarRing: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 999,
    padding: 1,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: scaleSize(30),
    height: scaleSize(30),
    resizeMode: "contain",
    opacity: 0.98,
  },
  headerTitle: {
    fontSize: rt.fontSize.lg,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: rs[2] },
  statusDot: {
    width: scaleSize(7),
    height: scaleSize(7),
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.95)",
  },
  headerStatus: {
    fontSize: rt.fontSize.xs,
    fontWeight: "800",
    color: "rgba(255,255,255,0.62)",
  },

  // Chat
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: {
    paddingTop: rs[3],
    paddingBottom: rs[4],
  },

  messageRow: { marginBottom: rs[3] },
  messageRowUser: { alignItems: "flex-end" },
  messageRowToy: { alignItems: "flex-start" },

  bubbleOuter: {
    maxWidth: "82%",
    borderRadius: rbr.xl,
    padding: 1,
  },
  bubbleOuterUser: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  bubbleOuterToy: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bubble: {
    borderRadius: rbr.xl,
    paddingHorizontal: rs[4],
    paddingVertical: rs[3],
  },
  bubbleUser: {
    backgroundColor: "rgba(253,189,75,0.98)",
  },
  bubbleToy: {
    backgroundColor: "rgba(0,0,0,0.60)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  messageText: {
    fontSize: rt.fontSize.base,
    fontWeight: "800",
    lineHeight: rt.fontSize.base * 1.35,
  },
  messageTextUser: { color: "#0B0B0D" },
  messageTextToy: { color: "rgba(255,255,255,0.90)" },

  timeText: {
    marginTop: rs[2],
    fontSize: rt.fontSize.xs,
    fontWeight: "800",
  },
  timeTextUser: { color: "rgba(11,11,13,0.55)" },
  timeTextToy: { color: "rgba(255,255,255,0.42)" },

  // Composer
  composerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: rs[4],
  },
  composerGradient: {
    borderRadius: rbr.xl,
    padding: 1,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  composer: {
    borderRadius: rbr.xl,
    backgroundColor: "rgba(0,0,0,0.74)",
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.18)",
    padding: rs[3],
    flexDirection: "row",
    alignItems: "flex-end",
    gap: rs[3],
  },
  inputShell: {
    flex: 1,
    borderRadius: rbr.lg,
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: rs[4],
    paddingVertical: rs[3],
    maxHeight: scaleSize(120),
  },
  input: {
    color: "rgba(255,255,255,0.92)",
    fontSize: rt.fontSize.base,
    fontWeight: "700",
    padding: 0,
    margin: 0,
  },
  sendBtnOuter: {
    borderRadius: 999,
    overflow: "hidden",
  },
  sendBtn: {
    width: scaleSize(46),
    height: scaleSize(46),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
