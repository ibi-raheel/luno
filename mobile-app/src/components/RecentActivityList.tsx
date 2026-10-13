// src/components/RecentActivityList.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../constants/theme";

export interface Activity {
  id: string;
  icon: string; // "alert" | "chat" | ...
  description: string;
  timestamp: Date;
  childName?: string;
}

interface RecentActivityListProps {
  activities: Activity[];
  onViewAll?: () => void;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";
  return `${diffInDays}d ago`;
}

function mapIcon(name: string) {
  switch (name) {
    case "alert":
      return "alert-circle";
    case "chat":
      return "chatbubbles";
    default:
      return "sparkles";
  }
}

const Row: React.FC<{ activity: Activity }> = ({ activity }) => {
  const iconName = mapIcon(activity.icon) as keyof typeof Ionicons.glyphMap;
  const isAlert = activity.icon === "alert";

  return (
    <View style={stylesA.row}>
      <View
        style={[
          stylesA.iconBadge,
          isAlert ? stylesA.iconBadgeAlert : stylesA.iconBadgeGold,
        ]}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={isAlert ? "rgba(255,90,90,1)" : "rgba(253,189,75,1)"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={stylesA.desc} numberOfLines={2}>
          {activity.description}
          {activity.childName ? (
            <Text style={stylesA.child}> • {activity.childName}</Text>
          ) : null}
        </Text>
        <Text style={stylesA.time}>{getRelativeTime(activity.timestamp)}</Text>
      </View>

      <Text style={stylesA.chev}>›</Text>
    </View>
  );
};

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  onViewAll,
}) => {
  const display = activities.slice(0, 3);

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <View style={stylesA.cardOuter}>
        <LinearGradient
          colors={["#0B0B10", "#07070A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={stylesA.card}
        >
          <View style={stylesA.topGlow} />

          {activities.length === 0 ? (
            <Text style={stylesA.empty}>No recent activity to display</Text>
          ) : (
            <>
              {display.map((a, idx) => (
                <View key={a.id}>
                  <Row activity={a} />
                  {idx !== display.length - 1 && (
                    <View style={stylesA.divider} />
                  )}
                </View>
              ))}

              {onViewAll && activities.length > 3 && (
                <TouchableOpacity
                  style={stylesA.viewAll}
                  onPress={onViewAll}
                  activeOpacity={0.85}
                >
                  <Text style={stylesA.viewAllText}>View all</Text>
                  <Text style={stylesA.viewAllChev}>›</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </LinearGradient>
      </View>
    </View>
  );
};

const stylesA = StyleSheet.create({
  cardOuter: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.32,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 7 },
    }),
    ...shadows.md,
  },
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(253,189,75,0.22)",
  },
  topGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(253,189,75,0.16)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconBadgeGold: {
    backgroundColor: "rgba(253,189,75,0.10)",
    borderColor: "rgba(253,189,75,0.25)",
  },
  iconBadgeAlert: {
    backgroundColor: "rgba(255,90,90,0.10)",
    borderColor: "rgba(255,90,90,0.22)",
  },
  desc: {
    fontSize: typography.fontSize.sm,
    color: "#FFFFFF",
    fontWeight: "900",
    lineHeight: typography.fontSize.sm * 1.3,
  },
  child: { color: "rgba(253,189,75,0.95)", fontWeight: "900" },
  time: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.60)",
    fontWeight: "800",
  },
  chev: { fontSize: 22, fontWeight: "900", color: "rgba(255,255,255,0.40)" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  viewAll: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: {
    color: "rgba(253,189,75,0.95)",
    fontWeight: "900",
    fontSize: typography.fontSize.sm,
  },
  viewAllChev: {
    marginLeft: 6,
    color: "rgba(253,189,75,0.95)",
    fontWeight: "900",
    fontSize: 20,
    marginTop: -1,
  },
  empty: {
    color: "rgba(255,255,255,0.62)",
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: spacing[4],
  },
});
