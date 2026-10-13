/**
 * Design System - Theme Constants
 * Professional parent-focused design for Luno Toys mobile app
 * Palette: deep navy, Mario red, warm orange-yellow, clean whites
 */

// Import responsive scaling utilities
import { scaleSize, scaleFont, scaleModerate } from '../utils/responsive';

// Color Palette
export const colors = {
  // Brand Colors - Luno core identity
  brand: {
    // Deep toy navy (primary brand)
    primary: "#12254A", // main app chrome / headers / primary CTAs
    secondary: "#0A1630", // nav bars, safe dark surfaces
    // Mario-style red for strong accents / danger CTAs
    red: "#E52521",
    // Dark warm orange-yellow for highlights, warnings, playful accents
    accent: "#F59E0B",
    // Gradients
    gradient: ["#132d61ff", "#163c8cff"],
    accentGradient: ["#F97316", "#FBBF24"],
  },

  // Primary - Blue/Navy scale (parent-focused, trustworthy)
  primary: {
    50: "#EEF2FF",
    100: "#DDE4FB",
    200: "#BAC7F5",
    300: "#93A4EB",
    400: "#6B80DE",
    500: "#3E5BCB", // mid blue for chips, icons, subtle buttons
    600: "#283F9F",
    700: "#12254A", // ties to brand.primary
    800: "#0C1833",
    900: "#060B1B",
  },

  // Success - Safe, positive, on-track (keep as is, works on dark)
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },

  // Warning - Attention needed (not urgent) – dark orangish yellow
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FACC5D",
    400: "#F59E0B", // matches brand.accent
    500: "#D97706",
    600: "#B45309",
    700: "#92400E",
    800: "#78350F",
    900: "#451A03",
  },

  // Error/Critical - Immediate action required (Mario red anchored)
  error: {
    50: "#FEF2F2",
    100: "#FDE0E0",
    200: "#FBB8B8",
    300: "#F48A8A",
    400: "#EC5555",
    500: "#E52521", // Mario red
    600: "#C51E1C",
    700: "#9A1816",
    800: "#7A1311",
    900: "#4A0B0A",
  },

  // Info - Informational, educational insights (supporting blue)
  info: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Neutrals - Text, backgrounds, borders
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2933",
    900: "#111827",
  },

  // Semantic colors for specific uses
  semantic: {
    online: "#10B981", // green
    offline: "#6B7280", // neutral
    charging: "#F59E0B", // matches warning/accent
    batteryLow: "#E52521", // Mario red
    educational: "#8B5CF6", // purple
    creative: "#EC4899", // pink
    social: "#06B6D4", // teal
    physical: "#F97316", // warm orange
  },

  // Background gradients (subtle, brand-aware)
  gradients: {
    // soft, slightly warm, not too teal
    background: ["#FFFFFF", "#F5F6FB", "#E5E9F5"],
    primary: ["#12254A", "#182c58ff"],
    card: ["#FFFFFF", "#F9FAFB"],
  },

  // Standard colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    // You can later swap this to your chosen family via custom fonts
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 40,
  },

  // Font weights
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing scale
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

// Semantic spacing
export const semanticSpacing = {
  screenPadding: spacing[6],
  cardPadding: spacing[5],
  sectionGap: spacing[8],
  itemGap: spacing[4],
  inlineGap: spacing[2],
  tinyGap: spacing[1],
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 999,
};

// Shadows (iOS style)
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
};

// Animation durations
export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

// Component-specific design tokens for consistency
export const components = {
  // Button styles
  button: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    borderRadius: borderRadius.lg,
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
    // (optional) we can later add variants here if you want
  },

  // Input/TextInput styles
  input: {
    height: 52,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.base,
    borderColor: colors.neutral[200],
    focusBorderColor: colors.brand.primary, // navy focus ring
  },

  // Card styles
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    backgroundColor: colors.white,
    shadow: shadows.md,
    borderColor: colors.neutral[100],
  },

  // Header styles
  header: {
    height: 60,
    backButtonSize: 32,
    titleFontSize: typography.fontSize.xl,
  },

  // Badge/Pill styles
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    fontSize: typography.fontSize.xs,
  },

  // Modal styles
  modal: {
    borderRadius: borderRadius["2xl"],
    maxHeight: "80%",
    overlayColor: "rgba(0, 0, 0, 0.5)",
  },
};

// Layout constants
export const layout = {
  screenPadding: spacing[5],
  sectionSpacing: spacing[6],
  cardSpacing: spacing[4],
};

// ============================================================================
// RESPONSIVE DESIGN SYSTEM
// ============================================================================

// Responsive spacing - scaled versions of base spacing
export const responsiveSpacing = {
  0: scaleSize(0),
  1: scaleSize(4),
  2: scaleSize(8),
  3: scaleSize(12),
  4: scaleSize(16),
  5: scaleSize(20),
  6: scaleSize(24),
  8: scaleSize(32),
  10: scaleSize(40),
  12: scaleSize(48),
  16: scaleSize(64),
  20: scaleSize(80),
};

// Responsive typography - font sizes with moderated scaling
export const responsiveTypography = {
  fontFamily: typography.fontFamily,
  fontSize: {
    xs: scaleFont(12),
    sm: scaleFont(14),
    base: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    "2xl": scaleFont(24),
    "3xl": scaleFont(28),
    "4xl": scaleFont(32),
    "5xl": scaleFont(40),
  },
  fontWeight: typography.fontWeight,
  lineHeight: typography.lineHeight,
};

// Responsive border radius - moderately scaled
export const responsiveBorderRadius = {
  none: 0,
  sm: scaleModerate(8, 0.2),
  md: scaleModerate(12, 0.2),
  lg: scaleModerate(16, 0.2),
  xl: scaleModerate(20, 0.2),
  "2xl": scaleModerate(24, 0.2),
  full: 999,
};

// Responsive component tokens
export const responsiveComponents = {
  button: {
    height: {
      sm: scaleSize(36),
      md: scaleSize(44),
      lg: scaleSize(52),
    },
    borderRadius: responsiveBorderRadius.lg,
    fontSize: {
      sm: responsiveTypography.fontSize.sm,
      md: responsiveTypography.fontSize.base,
      lg: responsiveTypography.fontSize.lg,
    },
  },
  input: {
    height: scaleSize(52),
    borderRadius: responsiveBorderRadius.lg,
    fontSize: responsiveTypography.fontSize.base,
    borderColor: colors.neutral[200],
    focusBorderColor: colors.brand.primary,
  },
  card: {
    borderRadius: responsiveBorderRadius.lg,
    padding: responsiveSpacing[5],
    backgroundColor: colors.white,
    shadow: shadows.md,
    borderColor: colors.neutral[100],
  },
  header: {
    height: scaleSize(60),
    backButtonSize: scaleSize(32),
    titleFontSize: responsiveTypography.fontSize.xl,
  },
  badge: {
    borderRadius: responsiveBorderRadius.full,
    paddingHorizontal: responsiveSpacing[3],
    paddingVertical: responsiveSpacing[1],
    fontSize: responsiveTypography.fontSize.xs,
  },
  modal: {
    borderRadius: responsiveBorderRadius["2xl"],
    maxHeight: "80%",
    overlayColor: "rgba(0, 0, 0, 0.5)",
  },
};

// Responsive layout constants
export const responsiveLayout = {
  screenPadding: responsiveSpacing[5],
  sectionSpacing: responsiveSpacing[6],
  cardSpacing: responsiveSpacing[4],
};

export default {
  colors,
  typography,
  spacing,
  semanticSpacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  components,
  layout,
  // Responsive variants
  responsiveSpacing,
  responsiveTypography,
  responsiveBorderRadius,
  responsiveComponents,
  responsiveLayout,
};
