import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius, spacing, shadows } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
}) => {
  const colorStyles = getColorStyles(color);

  return (
    <View style={[styles.card, colorStyles.card]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, colorStyles.value]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const getColorStyles = (color: 'primary' | 'success' | 'warning' | 'error') => {
  const colorMap = {
    primary: {
      card: { borderLeftColor: colors.primary[600] },
      value: { color: colors.primary[700] },
    },
    success: {
      card: { borderLeftColor: colors.success[600] },
      value: { color: colors.success[700] },
    },
    warning: {
      card: { borderLeftColor: colors.warning[600] },
      value: { color: colors.warning[700] },
    },
    error: {
      card: { borderLeftColor: colors.error[600] },
      value: { color: colors.error[700] },
    },
  };

  return colorMap[color];
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  value: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },
});
