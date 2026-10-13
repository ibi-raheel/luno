import { Dimensions, Platform, PixelRatio } from 'react-native';

// Constants
const BASE_WIDTH = 393; // iPhone 14 Pro
const BASE_HEIGHT = 852; // iPhone 14 Pro
const MIN_SCALE = 0.85;
const MAX_SCALE = 2.0;

// Get current dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate scale factors
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Scale a size value based on screen width
 * Used for: widths, heights, padding, margins, icon sizes
 */
export const scaleSize = (size: number): number => {
  const boundedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, widthScale));
  return Math.round(PixelRatio.roundToNearestPixel(size * boundedScale));
};

/**
 * Scale font sizes with moderation factor
 * Fonts don't need to scale as aggressively as layout
 */
export const scaleFont = (size: number): number => {
  const moderationFactor = 0.5; // Fonts scale at 50% rate
  const scaledSize = size * (1 + (widthScale - 1) * moderationFactor);
  const boundedSize = Math.max(size * MIN_SCALE, Math.min(size * MAX_SCALE, scaledSize));
  return Math.round(PixelRatio.roundToNearestPixel(boundedSize));
};

/**
 * Scale vertical spacing/heights based on screen height
 * Useful for: screen padding, section gaps
 */
export const scaleVertical = (size: number): number => {
  const boundedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, heightScale));
  return Math.round(PixelRatio.roundToNearestPixel(size * boundedScale));
};

/**
 * Moderately scale values - for elements that shouldn't scale as much
 * Used for: border radius, shadows, icon sizes
 */
export const scaleModerate = (size: number, factor: number = 0.3): number => {
  const scaledSize = size * (1 + (widthScale - 1) * factor);
  const boundedSize = Math.max(size * MIN_SCALE, Math.min(size * MAX_SCALE, scaledSize));
  return Math.round(PixelRatio.roundToNearestPixel(boundedSize));
};

/**
 * Get device category for conditional logic if needed
 */
export const getDeviceCategory = (): 'small' | 'medium' | 'large' | 'tablet' => {
  if (SCREEN_WIDTH < 375) return 'small';
  if (SCREEN_WIDTH < 414) return 'medium';
  if (SCREEN_WIDTH < 768) return 'large';
  return 'tablet';
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Get responsive value based on device category
 * Useful for: column counts, layout changes
 */
export const responsive = <T,>(values: {
  small?: T;
  medium?: T;
  large?: T;
  tablet?: T;
  default: T;
}): T => {
  const category = getDeviceCategory();
  return values[category] || values.default;
};

// Export dimensions for reference
export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  widthScale,
  heightScale,
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
};
