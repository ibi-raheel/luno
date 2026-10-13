import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  typography,
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
} from '../constants/theme';
import { scaleSize } from '../utils/responsive';

interface StatsBannerProps {
  childrenCount: number;
  totalScreenTime: string;
  conversationsCount: number;
  alertsCount: number;
  onPress: () => void;
}

export function StatsBanner({
  childrenCount,
  totalScreenTime,
  conversationsCount,
  alertsCount,
  onPress,
}: StatsBannerProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={["#8B4513", "#A0522D", "#CD853F"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Today's Activity</Text>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{childrenCount}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScreenTime}</Text>
              <Text style={styles.statLabel}>Screen time</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{conversationsCount}</Text>
              <Text style={styles.statLabel}>Conversations</Text>
            </View>
          </View>

          {alertsCount > 0 && (
            <View style={styles.alertRow}>
              <Text style={styles.alertText}>{alertsCount} alert{alertsCount > 1 ? 's' : ''} need review</Text>
            </View>
          )}

          <Text style={styles.viewDetails}>Tap to view detailed stats & graphs</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: rbr['2xl'],
    overflow: 'hidden',
    marginBottom: rs[5],
  },
  content: {
    padding: rs[5],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs[4],
  },
  title: {
    fontSize: rt.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  arrowContainer: {
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: rbr.full,
    backgroundColor: colors.white + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: scaleSize(24),
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs[3],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: rt.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: rs[1],
  },
  statLabel: {
    fontSize: rt.fontSize.xs,
    color: colors.white + 'E6',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: scaleSize(32),
    backgroundColor: colors.white + '4D',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '33',
    paddingHorizontal: rs[3],
    paddingVertical: rs[2],
    borderRadius: rbr.md,
    marginBottom: rs[3],
  },
  alertText: {
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  viewDetails: {
    fontSize: rt.fontSize.sm,
    color: colors.white + 'E6',
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
});
