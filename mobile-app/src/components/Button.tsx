import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, components, shadows } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  // Primary button uses gradient
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          sizeStyles.button,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? [colors.neutral[300], colors.neutral[300]] : colors.brand.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientButton, sizeStyles.button]}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[sizeStyles.text, variantStyles.text]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Other variants use standard TouchableOpacity
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} size="small" />
      ) : (
        <Text style={[sizeStyles.text, variantStyles.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const getVariantStyles = (variant: ButtonVariant) => {
  const variants = {
    primary: {
      button: {
        backgroundColor: colors.primary[600],
      },
      text: {
        color: colors.white,
      },
    },
    secondary: {
      button: {
        backgroundColor: colors.neutral[100],
        borderWidth: 1,
        borderColor: colors.neutral[200],
      },
      text: {
        color: colors.neutral[900],
      },
    },
    danger: {
      button: {
        backgroundColor: colors.error[500],
      },
      text: {
        color: colors.white,
      },
    },
    ghost: {
      button: {
        backgroundColor: colors.transparent,
      },
      text: {
        color: colors.neutral[700],
      },
    },
  };

  return variants[variant];
};

const getSizeStyles = (size: ButtonSize) => {
  const sizes = {
    sm: {
      button: {
        height: components.button.height.sm,
        paddingHorizontal: 12,
        borderRadius: components.button.borderRadius,
      },
      text: {
        fontSize: components.button.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
      },
    },
    md: {
      button: {
        height: components.button.height.md,
        paddingHorizontal: 16,
        borderRadius: components.button.borderRadius,
      },
      text: {
        fontSize: components.button.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
      },
    },
    lg: {
      button: {
        height: components.button.height.lg,
        paddingHorizontal: 20,
        borderRadius: components.button.borderRadius,
      },
      text: {
        fontSize: components.button.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
      },
    },
  };

  return sizes[size];
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradientButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
