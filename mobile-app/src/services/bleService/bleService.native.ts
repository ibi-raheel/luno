// src/services/bleService.ts
import { BleManager, Device, State } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { decode as base64Decode, encode as base64Encode } from "base-64";

// Luno Toy BLE UUIDs (matches ESP32 configuration)
export const LUNO_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const WIFI_CREDS_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
export const STATUS_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
export const DEVICE_ID_UUID = "6e400004-b5a3-f393-e0a9-e50e24dcca9e";
export const WIFI_SCAN_UUID = "6e400005-b5a3-f393-e0a9-e50e24dcca9e";

export interface LunoDevice {
  id: string;
  name: string;
  deviceId?: string;
  rssi?: number;
}

export interface WifiNetwork {
  ssid: string;
  rssi: number;
  security: "open" | "wep" | "wpa" | "wpa2" | "wpa3";
}

export interface WifiCredentials {
  ssid: string;
  password: string;
  userEmail: string;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

class BLEService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private statusMonitorSubscription: any = null;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "ios") {
      return true;
    }

    if (Platform.OS === "android") {
      const apiLevel = Platform.Version;

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires location access",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        return (
          results["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          results["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          results["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }

    return false;
  }

  async checkBluetoothState(): Promise<boolean> {
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  async enableBluetooth(): Promise<void> {
    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      throw new Error("Please enable Bluetooth in your device settings");
    }
  }

  async startScanning(
    onDeviceFound: (device: LunoDevice) => void,
    timeoutMs: number = 10000
  ): Promise<void> {
    const discoveredDevices = new Map<string, LunoDevice>();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stopScanning();
        resolve();
      }, timeoutMs);

      this.manager.startDeviceScan(
        [LUNO_SERVICE_UUID],
        null,
        (error, device) => {
          if (error) {
            clearTimeout(timeout);
            this.stopScanning();
            reject(error);
            return;
          }

          if (device && device.name && device.name.startsWith("LUNO-TOY-")) {
            if (!discoveredDevices.has(device.id)) {
              const lunoDevice: LunoDevice = {
                id: device.id,
                name: device.name,
                rssi: device.rssi || undefined,
              };
              discoveredDevices.set(device.id, lunoDevice);
              onDeviceFound(lunoDevice);
            }
          }
        }
      );
    });
  }

  stopScanning(): void {
    this.manager.stopDeviceScan();
  }

  async connectAndReadDeviceId(deviceId: string): Promise<string> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;

      await device.discoverAllServicesAndCharacteristics();

      const characteristic = await device.readCharacteristicForService(
        LUNO_SERVICE_UUID,
        DEVICE_ID_UUID
      );

      if (!characteristic.value) {
        throw new Error("Failed to read device ID");
      }

      const deviceIdValue = this.base64ToString(characteristic.value);
      return deviceIdValue;
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  /**
   * Scan for available WiFi networks visible to the ESP32
   */
  async scanWifiNetworks(): Promise<WifiNetwork[]> {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    const device = this.connectedDevice;

    return new Promise<WifiNetwork[]>(async (resolve, reject) => {
      let subscription: any = null;
      const timeout = setTimeout(() => {
        if (subscription) {
          try {
            subscription.remove();
          } catch (e) {
            console.warn("[BLE] Error removing WiFi scan subscription:", e);
          }
        }
        console.warn("[BLE] WiFi scan timed out on client side.");
        reject(new Error("WiFi scan timed out"));
      }, 12000);

      const cleanup = () => {
        if (subscription) {
          try {
            subscription.remove();
          } catch (e) {
            console.warn("[BLE] Error removing WiFi scan subscription:", e);
          }
          subscription = null;
        }
        clearTimeout(timeout);
      };

      try {
        subscription = device.monitorCharacteristicForService(
          LUNO_SERVICE_UUID,
          WIFI_SCAN_UUID,
          (error, characteristic) => {
            if (error) {
              const message = (error as any).message || String(error);

              if (message.includes("Operation was cancelled")) {
                console.log(
                  "[BLE] WiFi scan monitor cancelled (disconnect / cancel)."
                );
              } else {
                console.error("WiFi scan monitor error:", error);
              }
              cleanup();
              reject(error);
              return;
            }

            if (!characteristic?.value) {
              return;
            }

            const payload = this.base64ToString(characteristic.value);
            console.log("[BLE] Raw WiFi scan payload:", payload);

            const trimmed = payload.trim();
            if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
              console.log(
                "[BLE] Ignoring non-JSON WiFi payload (waiting for real scan result)."
              );
              return;
            }

            try {
              const networks: WifiNetwork[] = JSON.parse(trimmed);

              const topNetworks = networks
                .sort((a, b) => b.rssi - a.rssi)
                .slice(0, 6);

              console.log(
                "[BLE] Resolved WiFi network list:",
                JSON.stringify(topNetworks)
              );

              cleanup();
              resolve(topNetworks);
            } catch (parseError) {
              console.error("Failed to parse WiFi networks JSON:", parseError);
              cleanup();
              reject(new Error("Failed to parse WiFi networks from device"));
            }
          }
        );

        const triggerValue = this.stringToBase64("scan");
        await device.writeCharacteristicWithResponseForService(
          LUNO_SERVICE_UUID,
          WIFI_SCAN_UUID,
          triggerValue
        );
      } catch (error) {
        cleanup();
        console.error("Failed to start WiFi scan:", error);
        reject(new Error("Failed to start WiFi scan"));
      }
    });
  }

  async sendWifiCredentials(credentials: WifiCredentials): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    try {
      const credsString = `${credentials.ssid}|${credentials.password}|${credentials.userEmail}`;
      const credsBase64 = this.stringToBase64(credsString);

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        LUNO_SERVICE_UUID,
        WIFI_CREDS_UUID,
        credsBase64
      );
    } catch (error) {
      throw new Error(`Failed to send WiFi credentials: ${error}`);
    }
  }

  async subscribeToStatus(
    onStatusUpdate: (status: string) => void
  ): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    try {
      this.statusMonitorSubscription =
        this.connectedDevice.monitorCharacteristicForService(
          LUNO_SERVICE_UUID,
          STATUS_UUID,
          (error, characteristic) => {
            if (error) {
              const message = (error as any).message || String(error);

              if (message.includes("Operation was cancelled")) {
                console.log(
                  "[BLE] Status monitor cancelled (device disconnected)."
                );
                return;
              }

              console.error("Status monitor error:", error);
              return;
            }

            if (characteristic?.value) {
              const status = this.base64ToString(characteristic.value);
              onStatusUpdate(status);
            }
          }
        );
    } catch (error) {
      throw new Error(`Failed to subscribe to status: ${error}`);
    }
  }

  unsubscribeFromStatus(): void {
    if (this.statusMonitorSubscription) {
      try {
        this.statusMonitorSubscription.remove();
      } catch (e) {
        console.warn("Error removing status monitor subscription:", e);
      }
      this.statusMonitorSubscription = null;
    }
  }

  async disconnect(): Promise<void> {
    this.unsubscribeFromStatus();

    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      } catch (error) {
        console.error("Disconnect error:", error);
      }
      this.connectedDevice = null;
    }
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  destroy(): void {
    this.disconnect();
    this.manager.destroy();
  }

  private base64ToString(base64: string): string {
    return base64Decode(base64);
  }

  private stringToBase64(str: string): string {
    return base64Encode(str);
  }
}

export default new BLEService();
