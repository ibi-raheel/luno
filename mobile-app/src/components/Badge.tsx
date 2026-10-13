import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <View style={[styles.badge, variantStyles.badge, style]}>
      <Text style={[styles.text, variantStyles.text]}>{label}</Text>
    </View>
  );
};

const getVariantStyles = (variant: BadgeVariant) => {
  const variants = {
    success: {
      badge: {
        backgroundColor: colors.success[50],
        borderColor: colors.success[200],
      },
      text: {
        color: colors.success[700],
      },
    },
    warning: {
      badge: {
        backgroundColor: colors.warning[50],
        borderColor: colors.warning[200],
      },
      text: {
        color: colors.warning[700],
      },
    },
    error: {
      badge: {
        backgroundColor: colors.error[50],
        borderColor: colors.error[200],
      },
      text: {
        color: colors.error[700],
      },
    },
    info: {
      badge: {
        backgroundColor: colors.info[50],
        borderColor: colors.info[200],
      },
      text: {
        color: colors.info[700],
      },
    },
    neutral: {
      badge: {
        backgroundColor: colors.neutral[100],
        borderColor: colors.neutral[200],
      },
      text: {
        color: colors.neutral[700],
      },
    },
  };

  return variants[variant];
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
