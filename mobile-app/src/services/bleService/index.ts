// Conditional BLE service export - uses mock in Expo Go, real BLE in development builds
import Constants from 'expo-constants';

// Check if we're running in Expo Go (which doesn't support native modules)
const isExpoGo = Constants.appOwnership === 'expo';

let bleService: any;

if (isExpoGo) {
  // Use mock BLE service for Expo Go / dev server
  console.log('[BLE] Running in Expo Go - using mock BLE service');
  bleService = require('./bleService.mock').default;
} else {
  // Use real BLE service for development builds
  console.log('[BLE] Running in development build - using real BLE service');
  try {
    bleService = require('./bleService.native').default;
  } catch (error) {
    console.warn('[BLE] Failed to load native BLE service, falling back to mock:', error);
    bleService = require('./bleService.mock').default;
  }
}

export default bleService;

// Re-export types and constants
export type { LunoDevice, WifiCredentials, WifiNetwork } from './bleService.mock';
