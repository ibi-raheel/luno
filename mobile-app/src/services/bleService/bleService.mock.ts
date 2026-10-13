// Mock BLE Service for development in Expo Go
export interface LunoDevice {
  id: string;
  name: string;
  deviceId?: string;
  rssi?: number;
}

export interface WifiNetwork {
  ssid: string;
  rssi: number;
  security: 'open' | 'wep' | 'wpa' | 'wpa2' | 'wpa3';
}

export interface WifiCredentials {
  ssid: string;
  password: string;
  userEmail: string;
}

class MockBLEService {
  private mockDevices: LunoDevice[] = [
    { id: '1', name: 'LUNO-TOY-AB12CD34', rssi: -65 },
    { id: '2', name: 'LUNO-TOY-XY98ZW76', rssi: -72 },
    { id: '3', name: 'LUNO-TOY-EF34GH56', rssi: -58 },
    { id: '4', name: 'LUNO-TOY-IJ78KL90', rssi: -68 },
    { id: '5', name: 'LUNO-TOY-MN12OP34', rssi: -75 },
  ];

  private mockWifiNetworks: WifiNetwork[] = [
    { ssid: 'Home WiFi', rssi: -45, security: 'wpa2' },
    { ssid: 'Office Network', rssi: -62, security: 'wpa2' },
    { ssid: 'Guest WiFi', rssi: -75, security: 'open' },
    { ssid: 'Neighbor WiFi', rssi: -80, security: 'wpa3' },
  ];

  async requestPermissions(): Promise<boolean> {
    console.log('[Mock BLE] Permissions granted');
    return true;
  }

  async checkBluetoothState(): Promise<boolean> {
    console.log('[Mock BLE] Bluetooth enabled');
    return true;
  }

  async enableBluetooth(): Promise<void> {
    console.log('[Mock BLE] Bluetooth enabled');
  }

  async startScanning(
    onDeviceFound: (device: LunoDevice) => void,
    timeoutMs: number = 10000
  ): Promise<void> {
    console.log('[Mock BLE] Starting scan...');

    return new Promise((resolve) => {
      // Simulate discovering devices over time
      this.mockDevices.forEach((device, index) => {
        setTimeout(() => {
          console.log('[Mock BLE] Found device:', device.name);
          onDeviceFound(device);
        }, 1000 * (index + 1));
      });

      setTimeout(() => {
        console.log('[Mock BLE] Scan complete');
        resolve();
      }, timeoutMs);
    });
  }

  stopScanning(): void {
    console.log('[Mock BLE] Stopped scanning');
  }

  async connectAndReadDeviceId(deviceId: string): Promise<string> {
    console.log('[Mock BLE] Connecting to device:', deviceId);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const device = this.mockDevices.find(d => d.id === deviceId);
    const deviceIdString = device?.name || 'LUNO-TOY-MOCK123';

    console.log('[Mock BLE] Connected! Device ID:', deviceIdString);
    return deviceIdString;
  }

  async scanWifiNetworks(): Promise<WifiNetwork[]> {
    console.log('[Mock BLE] Scanning for WiFi networks...');

    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[Mock BLE] Found', this.mockWifiNetworks.length, 'networks');
    return this.mockWifiNetworks;
  }

  async sendWifiCredentials(credentials: WifiCredentials): Promise<void> {
    console.log('[Mock BLE] Sending WiFi credentials:', credentials.ssid, 'for user:', credentials.userEmail);

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[Mock BLE] WiFi credentials sent successfully');
  }

  async subscribeToStatus(onStatusUpdate: (status: string) => void): Promise<void> {
    console.log('[Mock BLE] Subscribed to status updates');

    // Simulate status updates
    setTimeout(() => onStatusUpdate('connecting'), 1000);
    setTimeout(() => onStatusUpdate('connected'), 3000);
  }

  unsubscribeFromStatus(): void {
    console.log('[Mock BLE] Unsubscribed from status');
  }

  async disconnect(): Promise<void> {
    console.log('[Mock BLE] Disconnected');
  }

  getConnectedDevice(): any {
    return null;
  }

  destroy(): void {
    console.log('[Mock BLE] Service destroyed');
  }
}

export default new MockBLEService();
