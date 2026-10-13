import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  colors,
  typography,
  shadows,
  responsiveSpacing as rs,
  responsiveTypography as rt,
  responsiveBorderRadius as rbr,
} from '../constants/theme';
import { scaleSize } from '../utils/responsive';
import { Badge } from './Badge';

interface ToyCardProps {
  toyName: string;
  toyEmoji: string;
  status: 'online' | 'offline';
  assignedTo?: string;
  batteryLevel: number;
  lastActive: string;
  firmwareVersion: string;
  updateAvailable?: boolean;
  wifiConnected?: boolean;
  wifiSSID?: string;
  onPress?: () => void;
  onSettings?: () => void;
  onUpdate?: () => void;
}

export const ToyCard: React.FC<ToyCardProps> = ({
  toyName,
  toyEmoji,
  status,
  assignedTo,
  batteryLevel,
  lastActive,
  firmwareVersion,
  updateAvailable,
  wifiConnected,
  wifiSSID,
  onPress,
  onSettings,
  onUpdate,
}) => {
  const getBatteryColor = () => {
    if (batteryLevel <= 20) return colors.error[500];
    if (batteryLevel <= 50) return colors.warning[500];
    return colors.success[500];
  };

  const getBatteryIcon = () => {
    if (batteryLevel <= 20) return '🔋';
    if (batteryLevel <= 50) return '🔋';
    return '🔋';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.toyEmoji}>{toyEmoji}</Text>
          <View style={styles.toyInfo}>
            <Text style={styles.toyName}>{toyName}</Text>
            {assignedTo && (
              <Text style={styles.assignedTo}>Assigned to: {assignedTo}</Text>
            )}
            {!assignedTo && (
              <Text style={styles.unassigned}>Not assigned</Text>
            )}
          </View>
        </View>
        <Badge
          label={status === 'online' ? 'Online' : 'Offline'}
          variant={status === 'online' ? 'success' : 'neutral'}
        />
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Battery</Text>
          <View style={styles.batteryContainer}>
            <Text style={styles.batteryText}>{getBatteryIcon()} {batteryLevel}%</Text>
            <View style={styles.batteryBar}>
              <View
                style={[
                  styles.batteryFill,
                  {
                    width: `${batteryLevel}%`,
                    backgroundColor: getBatteryColor(),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>WiFi Status</Text>
          <View style={styles.wifiContainer}>
            <Text style={styles.wifiIcon}>
              {wifiConnected ? '📶' : '📵'}
            </Text>
            <Text style={[
              styles.wifiText,
              { color: wifiConnected ? colors.success[600] : colors.neutral[500] }
            ]}>
              {wifiConnected && wifiSSID
                ? `Connected to ${wifiSSID}`
                : wifiConnected
                ? 'Connected'
                : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.lastActive}>
        {status === 'online' ? 'Active now' : `Last active: ${lastActive}`}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.firmwareText}>
          Firmware: {firmwareVersion}
          {updateAvailable ? ' (Update available)' : ' (Up to date)'}
        </Text>
      </View>

      {updateAvailable && (
        <View style={styles.updateBanner}>
          <Text style={styles.updateIcon}>⚠️</Text>
          <Text style={styles.updateText}>Firmware update available</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={onSettings}
        >
          <Text style={styles.actionButtonTextPrimary}>Settings</Text>
        </TouchableOpacity>
        {updateAvailable && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={onUpdate}
          >
            <Text style={styles.actionButtonTextSecondary}>Update</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: rbr.lg,
    padding: rs[5],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
    marginBottom: rs[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rs[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toyEmoji: {
    fontSize: scaleSize(48),
    marginRight: rs[3],
  },
  toyInfo: {
    flex: 1,
  },
  toyName: {
    fontSize: rt.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: rs[1],
  },
  assignedTo: {
    fontSize: rt.fontSize.sm,
    color: colors.neutral[600],
  },
  unassigned: {
    fontSize: rt.fontSize.sm,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },
  statusRow: {
    marginBottom: rs[3],
  },
  statusItem: {
    marginBottom: rs[2],
  },
  statusLabel: {
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[600],
    marginBottom: rs[1],
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[700],
    marginRight: rs[2],
  },
  batteryBar: {
    flex: 1,
    height: scaleSize(8),
    backgroundColor: colors.neutral[200],
    borderRadius: rbr.full,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: rbr.full,
  },
  wifiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wifiIcon: {
    fontSize: scaleSize(16),
    marginRight: rs[2],
  },
  wifiText: {
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  lastActive: {
    fontSize: rt.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: rs[3],
  },
  footer: {
    marginBottom: rs[3],
  },
  firmwareText: {
    fontSize: rt.fontSize.sm,
    color: colors.neutral[600],
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: rs[3],
    borderRadius: rbr.md,
    marginBottom: rs[3],
  },
  updateIcon: {
    fontSize: scaleSize(16),
    marginRight: rs[2],
  },
  updateText: {
    flex: 1,
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning[700],
  },
  actions: {
    flexDirection: 'row',
    gap: rs[3],
  },
  actionButton: {
    flex: 1,
    paddingVertical: rs[2],
    paddingHorizontal: rs[4],
    borderRadius: rbr.md,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary[600],
  },
  actionButtonTextPrimary: {
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  actionButtonSecondary: {
    backgroundColor: colors.warning[100],
    borderWidth: 1,
    borderColor: colors.warning[300],
  },
  actionButtonTextSecondary: {
    fontSize: rt.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning[700],
  },
});
