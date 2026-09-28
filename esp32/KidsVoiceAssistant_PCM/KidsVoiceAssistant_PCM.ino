/*
 * Kids Voice Assistant - ESP32-S3 with PCM Audio
 *
 * Hardware:
 *   - ESP32-S3 DevKit
 *   - INMP441 I2S Microphone (with transistor power control)
 *   - MAX98357A I2S Amplifier + Speaker
 *   - Push Button
 *
 * Wiring (Custom Configuration):
 *   Microphone (INMP441):
 *     VDD  -> 3.3V (through transistor controlled by MIC_POWER_PIN)
 *     GND  -> Transistor (controlled by GPIO 2)
 *     SD   -> GPIO 6
 *     WS   -> GPIO 15
 *     SCK  -> GPIO 18
 *     L/R  -> GND
 *
 *   Speaker (MAX98357A):
 *     DIN  -> GPIO 17
 *     BCLK -> GPIO 5
 *     LRC  -> GPIO 4
 *
 *   Button -> GPIO 21
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>

// ============ CONFIGURATION - EDIT THESE ============

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// WebSocket server - Use your computer's local IP address
// Find it with: ifconfig (Mac/Linux) or ipconfig (Windows)
// Example: 192.168.1.100, 192.168.0.50, 10.0.0.5, etc.
const char* WS_HOST = "192.168.1.23547";  // <-- CHANGE THIS to your computer's IP
const uint16_t WS_PORT = 8765;

// ============ PIN DEFINITIONS (YOUR WIRING) ============

#define BUTTON_PIN      21    // Physical button pin
#define MIC_POWER_PIN   2     // Transistor controlling mic GND

// I2S Ports
#define MIC_I2S_PORT    I2S_NUM_0
#define SPK_I2S_PORT    I2S_NUM_1

// Microphone pins (INMP441)
#define I2S_MIC_WS      15    // Word Select (LRCLK)
#define I2S_MIC_SCK     18    // Bit Clock
#define I2S_MIC_SD      6     // Data

// Speaker pins (MAX98357A)
#define I2S_SPK_WS      4     // Word Select (LRC)
#define I2S_SPK_SCK     5     // Bit Clock (BCLK)
#define I2S_SPK_DIN     17    // Data In

// Status LED (optional - uses built-in if available)
#define LED_PIN         48    // Built-in LED on many ESP32-S3 boards, change if needed

// ============ AUDIO SETTINGS ============

#define SAMPLE_RATE         16000
#define I2S_BUFFER_LEN      1024
#define RECORD_SECONDS      10
#define RECORD_BUFFER_SIZE  (SAMPLE_RATE * RECORD_SECONDS)

// ============ STATE MACHINE ============

enum State {
    IDLE,
    RECORDING,
    PROCESSING,
    RECEIVING_AUDIO,
    PLAYING
};

State state = IDLE;

// ============ GLOBAL VARIABLES ============

WebSocketsClient webSocket;

// Recording buffer
int16_t* recordBuffer = nullptr;
size_t recordIndex = 0;

// Playback buffer
uint8_t* playBuffer = nullptr;
size_t playBufferSize = 0;
size_t playBufferPos = 0;
size_t expectedAudioSize = 0;

// Button state
volatile bool buttonDown = false;
volatile bool buttonUp = false;
unsigned long lastButtonTime = 0;

bool connected = false;

// ============ MICROPHONE POWER CONTROL ============

void microphoneOn() {
    digitalWrite(MIC_POWER_PIN, HIGH);
    delay(50);  // Give mic time to stabilize
    Serial.println("Microphone ON");
}

void microphoneOff() {
    digitalWrite(MIC_POWER_PIN, LOW);
    Serial.println("Microphone OFF");
}

// ============ I2S SETUP ============

void setupMicI2S() {
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = I2S_BUFFER_LEN,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pins = {
        .bck_io_num = I2S_MIC_SCK,
        .ws_io_num = I2S_MIC_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_MIC_SD
    };

    esp_err_t err = i2s_driver_install(MIC_I2S_PORT, &config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Mic I2S install failed: %d\n", err);
        return;
    }

    err = i2s_set_pin(MIC_I2S_PORT, &pins);
    if (err != ESP_OK) {
        Serial.printf("Mic I2S pin config failed: %d\n", err);
        return;
    }

    Serial.println("Microphone I2S ready");
}

void setupSpeakerI2S() {
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 1024,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pins = {
        .bck_io_num = I2S_SPK_SCK,
        .ws_io_num = I2S_SPK_WS,
        .data_out_num = I2S_SPK_DIN,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(SPK_I2S_PORT, &config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Speaker I2S install failed: %d\n", err);
        return;
    }

    err = i2s_set_pin(SPK_I2S_PORT, &pins);
    if (err != ESP_OK) {
        Serial.printf("Speaker I2S pin config failed: %d\n", err);
        return;
    }

    Serial.println("Speaker I2S ready");
}

// ============ WIFI ============

void setupWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✓ WiFi connected!");
        Serial.print("  IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("  Gateway: ");
        Serial.println(WiFi.gatewayIP());
        digitalWrite(LED_PIN, HIGH);
    } else {
        Serial.println("\n✗ WiFi connection failed!");
        Serial.println("  Check SSID and password");
        digitalWrite(LED_PIN, LOW);
    }
}

// ============ WEBSOCKET ============

void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("WebSocket disconnected");
            connected = false;
            break;

        case WStype_CONNECTED:
            Serial.println("WebSocket connected!");
            connected = true;
            webSocket.sendTXT("{\"type\":\"ping\"}");
            break;

        case WStype_TEXT: {
            StaticJsonDocument<512> doc;
            if (deserializeJson(doc, payload)) {
                Serial.println("JSON parse error");
                return;
            }

            const char* msgType = doc["type"];

            if (strcmp(msgType, "pong") == 0) {
                Serial.println("Server ready");
            }
            else if (strcmp(msgType, "recording_started") == 0) {
                Serial.println("Recording started...");
            }
            else if (strcmp(msgType, "processing") == 0) {
                const char* step = doc["step"];
                Serial.printf("Processing: %s\n", step);
            }
            else if (strcmp(msgType, "transcript") == 0) {
                Serial.printf("You said: \"%s\"\n", (const char*)doc["text"]);
            }
            else if (strcmp(msgType, "response") == 0) {
                Serial.printf("Luna says: \"%s\"\n", (const char*)doc["text"]);
            }
            else if (strcmp(msgType, "audio_start") == 0) {
                expectedAudioSize = doc["length"];
                Serial.printf("Receiving audio: %d bytes\n", expectedAudioSize);

                // Allocate playback buffer
                if (playBuffer) {
                    free(playBuffer);
                }
                playBuffer = (uint8_t*)malloc(expectedAudioSize);
                if (!playBuffer) {
                    Serial.println("Failed to allocate playback buffer!");
                    state = IDLE;
                    return;
                }
                playBufferSize = 0;
                playBufferPos = 0;
                state = RECEIVING_AUDIO;
            }
            else if (strcmp(msgType, "audio_end") == 0) {
                Serial.printf("Audio complete: %d bytes received\n", playBufferSize);
                state = PLAYING;
                playAudio();
            }
            else if (strcmp(msgType, "error") == 0) {
                Serial.printf("Error: %s\n", (const char*)doc["message"]);
                state = IDLE;
                digitalWrite(LED_PIN, LOW);
            }
            break;
        }

        case WStype_BIN:
            // Receive audio chunk
            if (state == RECEIVING_AUDIO && playBuffer) {
                if (playBufferSize + length <= expectedAudioSize) {
                    memcpy(playBuffer + playBufferSize, payload, length);
                    playBufferSize += length;
                }
            }
            break;

        case WStype_ERROR:
            Serial.println("WebSocket error");
            break;

        case WStype_PING:
        case WStype_PONG:
            break;
    }
}

void setupWebSocket() {
    webSocket.begin(WS_HOST, WS_PORT, "/");
    webSocket.onEvent(onWebSocketEvent);
    webSocket.setReconnectInterval(3000);

    Serial.println("\nWebSocket Setup:");
    Serial.printf("  Connecting to: ws://%s:%d\n", WS_HOST, WS_PORT);
    Serial.println("  Make sure the backend server is running!");
}

// ============ AUDIO FUNCTIONS ============

void startRecording() {
    if (!connected) {
        Serial.println("Not connected to server!");
        return;
    }
    if (state != IDLE) {
        Serial.println("Already busy!");
        return;
    }

    Serial.println("\n>>> Starting recording...");

    // Turn on microphone
    microphoneOn();

    // Clear buffer
    recordIndex = 0;
    memset(recordBuffer, 0, RECORD_BUFFER_SIZE * sizeof(int16_t));

    // Clear any stale data from I2S buffer
    i2s_zero_dma_buffer(MIC_I2S_PORT);

    state = RECORDING;
    digitalWrite(LED_PIN, HIGH);

    // Notify server
    webSocket.sendTXT("{\"type\":\"start_recording\"}");
}

void stopRecording() {
    if (state != RECORDING) return;

    Serial.println(">>> Stopping recording...");

    // Turn off microphone
    microphoneOff();

    state = PROCESSING;
    digitalWrite(LED_PIN, LOW);

    // Send recorded audio
    if (recordIndex > 0) {
        Serial.printf("Sending %d samples (%d bytes)\n", recordIndex, recordIndex * 2);

        size_t totalBytes = recordIndex * sizeof(int16_t);
        uint8_t* ptr = (uint8_t*)recordBuffer;
        size_t chunkSize = 4096;

        for (size_t i = 0; i < totalBytes; i += chunkSize) {
            size_t thisChunk = min(chunkSize, totalBytes - i);
            webSocket.sendBIN(ptr + i, thisChunk);
            delay(5);  // Small delay between chunks
        }

        Serial.println("Audio sent!");
    } else {
        Serial.println("No audio recorded!");
    }

    // Tell server we're done recording
    webSocket.sendTXT("{\"type\":\"stop_recording\"}");
}

void recordAudio() {
    if (state != RECORDING) return;

    int16_t buffer[512];
    size_t bytesRead;

    esp_err_t err = i2s_read(MIC_I2S_PORT, buffer, sizeof(buffer), &bytesRead, 100);

    if (err == ESP_OK && bytesRead > 0) {
        size_t samplesRead = bytesRead / sizeof(int16_t);

        for (size_t i = 0; i < samplesRead && recordIndex < RECORD_BUFFER_SIZE; i++) {
            // Apply gain (microphone might be quiet)
            int32_t sample = buffer[i] * 4;
            sample = constrain(sample, -32768, 32767);
            recordBuffer[recordIndex++] = (int16_t)sample;
        }
    }
}

void playAudio() {
    if (!playBuffer || playBufferSize == 0) {
        Serial.println("No audio to play");
        state = IDLE;
        return;
    }

    Serial.printf("Playing %d bytes of audio...\n", playBufferSize);
    digitalWrite(LED_PIN, HIGH);

    size_t bytesWritten;
    esp_err_t err = i2s_write(SPK_I2S_PORT, playBuffer, playBufferSize, &bytesWritten, portMAX_DELAY);

    if (err == ESP_OK) {
        Serial.printf("Played %d bytes successfully\n", bytesWritten);
    } else {
        Serial.printf("Playback error: %d\n", err);
    }

    // Cleanup
    free(playBuffer);
    playBuffer = nullptr;
    playBufferSize = 0;

    state = IDLE;
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n>>> Ready for next command!\n");
}

void playBeep(int freq, int durationMs) {
    int numSamples = (SAMPLE_RATE * durationMs) / 1000;
    int16_t* buf = (int16_t*)malloc(numSamples * sizeof(int16_t));
    if (!buf) return;

    for (int i = 0; i < numSamples; i++) {
        float t = (float)i / SAMPLE_RATE;
        buf[i] = (int16_t)(12000 * sin(2.0 * PI * freq * t));
    }

    size_t written;
    i2s_write(SPK_I2S_PORT, buf, numSamples * sizeof(int16_t), &written, portMAX_DELAY);
    free(buf);
}

// ============ BUTTON HANDLING ============

void IRAM_ATTR buttonISR() {
    unsigned long now = millis();
    if (now - lastButtonTime > 50) {  // Debounce
        if (digitalRead(BUTTON_PIN) == LOW) {
            buttonDown = true;
        } else {
            buttonUp = true;
        }
        lastButtonTime = now;
    }
}

void handleButton() {
    if (buttonDown) {
        buttonDown = false;
        if (state == IDLE && connected) {
            startRecording();
        }
    }

    if (buttonUp) {
        buttonUp = false;
        if (state == RECORDING) {
            stopRecording();
        }
    }
}

// ============ SETUP ============

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n");
    Serial.println("╔═══════════════════════════════════════╗");
    Serial.println("║     Kids Voice Assistant - Luna       ║");
    Serial.println("║        ESP32-S3 + PCM Audio           ║");
    Serial.println("╚═══════════════════════════════════════╝\n");

    // Setup pins
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(MIC_POWER_PIN, OUTPUT);

    // Start with microphone off
    microphoneOff();

    // Startup blink
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
    }

    // Allocate recording buffer (~320KB for 10 seconds)
    Serial.print("Allocating audio buffer... ");
    recordBuffer = (int16_t*)malloc(RECORD_BUFFER_SIZE * sizeof(int16_t));
    if (!recordBuffer) {
        Serial.println("FAILED!");
        Serial.println("Not enough memory. Try reducing RECORD_SECONDS.");
        while (1) { delay(1000); }
    }
    Serial.printf("OK (%d KB)\n", (RECORD_BUFFER_SIZE * 2) / 1024);

    // Setup I2S
    Serial.println("\nInitializing I2S...");
    setupMicI2S();
    setupSpeakerI2S();

    // Setup WiFi
    Serial.println("\nConnecting to WiFi...");
    setupWiFi();

    // Setup WebSocket
    setupWebSocket();

    // Attach button interrupt
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, CHANGE);

    // Ready beep
    delay(500);
    playBeep(800, 100);
    delay(80);
    playBeep(1200, 150);

    Serial.println("\n════════════════════════════════════════");
    Serial.println("  READY! Press and hold button to speak");
    Serial.println("════════════════════════════════════════\n");
}

// ============ MAIN LOOP ============

void loop() {
    // Handle WebSocket events
    webSocket.loop();

    // Handle button presses
    handleButton();

    // Record audio while button is held
    if (state == RECORDING) {
        recordAudio();
    }

    // Blink LED during processing
    static unsigned long lastBlink = 0;
    if (state == PROCESSING || state == RECEIVING_AUDIO) {
        if (millis() - lastBlink > 150) {
            digitalWrite(LED_PIN, !digitalRead(LED_PIN));
            lastBlink = millis();
        }
    }

    // WiFi reconnection check
    static unsigned long lastWiFiCheck = 0;
    if (millis() - lastWiFiCheck > 10000) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi lost, reconnecting...");
            WiFi.reconnect();
        }
        lastWiFiCheck = millis();
    }

    // Periodic connection status
    static unsigned long lastStatus = 0;
    if (millis() - lastStatus > 30000) {
        if (connected) {
            Serial.println("[Status] Connected and ready");
        } else {
            Serial.println("[Status] Disconnected - trying to reconnect...");
        }
        lastStatus = millis();
    }
}
