import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../constants/theme';

type CardVariant = 'default' | 'elevated' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <View
      style={[
        styles.card,
        variantStyles,
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const getVariantStyles = (variant: CardVariant) => {
  const variants = {
    default: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing[5],
      borderWidth: 1,
      borderColor: colors.neutral[200],
      ...shadows.md,
    },
    elevated: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing[5],
      borderWidth: 1,
      borderColor: colors.neutral[200],
      ...shadows.lg,
    },
    flat: {
      backgroundColor: colors.neutral[50],
      borderRadius: borderRadius.md,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: colors.neutral[200],
    },
  };

  return variants[variant];
};

const styles = StyleSheet.create({
  card: {
    // Base styles applied to all variants
  },
});
