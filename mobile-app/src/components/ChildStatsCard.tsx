import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

interface ChildStatsCardProps {
  childName: string;
  age: number;
  mood: 'happy' | 'calm' | 'excited' | 'thoughtful' | 'energetic';
  status: 'online' | 'offline';
  toyName: string;
  screenTime: string;
  conversationsCount: number;
  activitiesCompleted: number;
  daySummary: string;
  onPress?: () => void;
}

const moodConfig = {
  happy: { emoji: '😊', color: colors.success[500], bg: colors.success[50] },
  calm: { emoji: '😌', color: colors.primary[500], bg: colors.primary[50] },
  excited: { emoji: '🤩', color: colors.warning[500], bg: colors.warning[50] },
  thoughtful: { emoji: '🤔', color: colors.neutral[600], bg: colors.neutral[100] },
  energetic: { emoji: '⚡', color: colors.error[500], bg: colors.error[50] },
};

export function ChildStatsCard({
  childName,
  age,
  mood,
  status,
  toyName,
  screenTime,
  conversationsCount,
  activitiesCompleted,
  daySummary,
  onPress,
}: ChildStatsCardProps) {
  const moodStyle = moodConfig[mood];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.childName}>{childName}, {age}</Text>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              { backgroundColor: status === 'online' ? colors.success[500] : colors.neutral[400] }
            ]} />
            <Text style={styles.statusText}>
              {toyName} · {status === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={[styles.moodBadge, { backgroundColor: moodStyle.bg }]}>
          <Text style={styles.moodEmoji}>{moodStyle.emoji}</Text>
        </View>
      </View>

      {/* Day Summary */}
      <Text style={styles.daySummary}>{daySummary}</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{screenTime}</Text>
          <Text style={styles.statLabel}>Screen time</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{conversationsCount}</Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activitiesCompleted}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
      </View>

      {/* Mood Label */}
      <View style={styles.moodFooter}>
        <Text style={[styles.moodLabel, { color: moodStyle.color }]}>
          Mood: {mood.charAt(0).toUpperCase() + mood.slice(1)}
        </Text>
        {onPress && <Text style={styles.viewMore}>View details ›</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flex: 1,
  },
  childName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  moodBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 24,
  },
  daySummary: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    color: colors.neutral[700],
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: spacing[3],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutral[200],
  },
  moodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  viewMore: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
});
