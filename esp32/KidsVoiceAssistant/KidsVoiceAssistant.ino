/*
 * Kids Voice Assistant - ESP32-S3 with I2S Audio
 *
 * Hardware:
 *   - ESP32-S3 DevKit
 *   - INMP441 I2S Microphone
 *   - MAX98357A I2S Amplifier + Speaker
 *   - Push Button (for talk)
 *   - Optional: LED for status indication
 *
 * Wiring:
 *   INMP441 Microphone:
 *     VDD  -> 3.3V
 *     GND  -> GND
 *     SD   -> GPIO 15 (Data)
 *     WS   -> GPIO 16 (Word Select / LRCLK)
 *     SCK  -> GPIO 17 (Bit Clock)
 *     L/R  -> GND (Left channel)
 *
 *   MAX98357A Amplifier:
 *     VIN  -> 5V (or 3.3V)
 *     GND  -> GND
 *     DIN  -> GPIO 18 (Data)
 *     BCLK -> GPIO 45 (Bit Clock)
 *     LRC  -> GPIO 46 (Word Select)
 *     GAIN -> Not connected (default gain)
 *     SD   -> Not connected or 3.3V (enabled)
 *
 *   Button:
 *     One side -> GPIO 0 (BOOT button) or GPIO 21
 *     Other side -> GND
 *
 *   Status LED (optional):
 *     Anode -> GPIO 2 (through 220Ω resistor)
 *     Cathode -> GND
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include "ESP32_MP3_Decoder.h"

// ============ CONFIGURATION - MODIFY THESE ============

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// WebSocket server (your computer's IP address)
const char* WS_HOST = "192.168.1.100";  // Change to your computer's IP
const uint16_t WS_PORT = 8765;

// ============ PIN DEFINITIONS ============

// INMP441 Microphone (I2S Port 0)
#define I2S_MIC_PORT        I2S_NUM_0
#define I2S_MIC_SCK         17    // Bit Clock (BCLK)
#define I2S_MIC_WS          16    // Word Select (LRCLK)
#define I2S_MIC_SD          15    // Data In

// MAX98357A Speaker (I2S Port 1)
#define I2S_SPK_PORT        I2S_NUM_1
#define I2S_SPK_BCLK        45    // Bit Clock
#define I2S_SPK_LRC         46    // Word Select (LRCLK)
#define I2S_SPK_DIN         18    // Data Out

// Button and LED
#define BUTTON_PIN          0     // GPIO 0 (BOOT button) - change to 21 for external button
#define LED_PIN             2     // Built-in LED or external LED

// ============ AUDIO SETTINGS ============

#define SAMPLE_RATE         16000
#define SAMPLE_BITS         16
#define CHANNELS            1
#define I2S_BUFFER_SIZE     1024
#define AUDIO_BUFFER_SIZE   32000  // ~2 seconds of audio

// ============ STATE MACHINE ============

enum State {
    STATE_IDLE,
    STATE_RECORDING,
    STATE_PROCESSING,
    STATE_PLAYING
};

// ============ GLOBAL VARIABLES ============

WebSocketsClient webSocket;
State currentState = STATE_IDLE;

// Audio buffers
int16_t* audioRecordBuffer = nullptr;
size_t audioRecordIndex = 0;

uint8_t* audioPlayBuffer = nullptr;
size_t audioPlaySize = 0;
size_t audioPlayIndex = 0;

bool buttonPressed = false;
bool buttonReleased = false;
unsigned long lastButtonTime = 0;
const unsigned long DEBOUNCE_MS = 50;

bool wsConnected = false;

// ============ I2S CONFIGURATION ============

void setupI2SMicrophone() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = I2S_BUFFER_SIZE,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_MIC_SCK,
        .ws_io_num = I2S_MIC_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_MIC_SD
    };

    esp_err_t err = i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Failed to install I2S mic driver: %d\n", err);
        return;
    }

    err = i2s_set_pin(I2S_MIC_PORT, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("Failed to set I2S mic pins: %d\n", err);
        return;
    }

    Serial.println("I2S Microphone initialized");
}

void setupI2SSpeaker() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 22050,  // ElevenLabs default output rate
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

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SPK_BCLK,
        .ws_io_num = I2S_SPK_LRC,
        .data_out_num = I2S_SPK_DIN,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(I2S_SPK_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Failed to install I2S speaker driver: %d\n", err);
        return;
    }

    err = i2s_set_pin(I2S_SPK_PORT, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("Failed to set I2S speaker pins: %d\n", err);
        return;
    }

    Serial.println("I2S Speaker initialized");
}

// ============ WiFi SETUP ============

void setupWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;

        // Blink LED while connecting
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        digitalWrite(LED_PIN, HIGH);
    } else {
        Serial.println("\nWiFi connection failed!");
        digitalWrite(LED_PIN, LOW);
    }
}

// ============ WEBSOCKET HANDLERS ============

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("WebSocket disconnected");
            wsConnected = false;
            break;

        case WStype_CONNECTED:
            Serial.println("WebSocket connected");
            wsConnected = true;
            // Send a ping to confirm connection
            webSocket.sendTXT("{\"type\":\"ping\"}");
            break;

        case WStype_TEXT: {
            // Parse JSON response
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, payload);

            if (error) {
                Serial.printf("JSON parse error: %s\n", error.c_str());
                return;
            }

            const char* msgType = doc["type"];

            if (strcmp(msgType, "pong") == 0) {
                Serial.println("Server connection confirmed");
            }
            else if (strcmp(msgType, "recording_started") == 0) {
                Serial.println("Server: Recording started");
            }
            else if (strcmp(msgType, "processing") == 0) {
                const char* step = doc["step"];
                Serial.printf("Processing: %s\n", step);

                // Visual feedback
                if (strcmp(step, "transcribing") == 0) {
                    // Fast blink
                } else if (strcmp(step, "thinking") == 0) {
                    // Medium blink
                } else if (strcmp(step, "speaking") == 0) {
                    // Slow blink
                }
            }
            else if (strcmp(msgType, "transcript") == 0) {
                Serial.printf("You said: %s\n", (const char*)doc["text"]);
            }
            else if (strcmp(msgType, "response") == 0) {
                Serial.printf("Luna says: %s\n", (const char*)doc["text"]);
            }
            else if (strcmp(msgType, "audio_start") == 0) {
                size_t audioLength = doc["length"];
                Serial.printf("Receiving audio: %d bytes\n", audioLength);

                // Allocate buffer for incoming audio
                if (audioPlayBuffer != nullptr) {
                    free(audioPlayBuffer);
                }
                audioPlayBuffer = (uint8_t*)malloc(audioLength);
                audioPlaySize = 0;
                audioPlayIndex = 0;
                currentState = STATE_PLAYING;
            }
            else if (strcmp(msgType, "audio_end") == 0) {
                Serial.println("Audio received, playing...");
                playReceivedAudio();
            }
            else if (strcmp(msgType, "error") == 0) {
                Serial.printf("Error: %s\n", (const char*)doc["message"]);
                currentState = STATE_IDLE;
                setLED(false);
            }
            break;
        }

        case WStype_BIN:
            // Append binary audio data to buffer
            if (audioPlayBuffer != nullptr && currentState == STATE_PLAYING) {
                memcpy(audioPlayBuffer + audioPlaySize, payload, length);
                audioPlaySize += length;
            }
            break;

        case WStype_ERROR:
            Serial.println("WebSocket error");
            break;

        default:
            break;
    }
}

void setupWebSocket() {
    webSocket.begin(WS_HOST, WS_PORT, "/");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    Serial.printf("Connecting to WebSocket server: ws://%s:%d\n", WS_HOST, WS_PORT);
}

// ============ AUDIO FUNCTIONS ============

void startRecording() {
    Serial.println("Starting recording...");

    // Clear the buffer
    audioRecordIndex = 0;
    memset(audioRecordBuffer, 0, AUDIO_BUFFER_SIZE * sizeof(int16_t));

    // Notify server
    webSocket.sendTXT("{\"type\":\"start_recording\"}");

    currentState = STATE_RECORDING;
    setLED(true);
}

void stopRecording() {
    Serial.println("Stopping recording...");

    currentState = STATE_PROCESSING;

    // Send the recorded audio
    if (audioRecordIndex > 0) {
        Serial.printf("Sending %d samples\n", audioRecordIndex);

        // Send audio in chunks
        size_t bytesToSend = audioRecordIndex * sizeof(int16_t);
        size_t chunkSize = 4096;
        uint8_t* audioPtr = (uint8_t*)audioRecordBuffer;

        for (size_t i = 0; i < bytesToSend; i += chunkSize) {
            size_t thisChunk = min(chunkSize, bytesToSend - i);
            webSocket.sendBIN(audioPtr + i, thisChunk);
            delay(10);  // Small delay between chunks
        }
    }

    // Notify server that recording stopped
    webSocket.sendTXT("{\"type\":\"stop_recording\"}");

    // Blink LED to show processing
    setLED(false);
}

void recordAudioChunk() {
    if (currentState != STATE_RECORDING) return;

    size_t bytesRead;
    int16_t buffer[I2S_BUFFER_SIZE];

    esp_err_t err = i2s_read(I2S_MIC_PORT, buffer, sizeof(buffer), &bytesRead, portMAX_DELAY);

    if (err == ESP_OK && bytesRead > 0) {
        size_t samplesRead = bytesRead / sizeof(int16_t);

        // Copy to record buffer
        for (size_t i = 0; i < samplesRead && audioRecordIndex < AUDIO_BUFFER_SIZE; i++) {
            // Apply some gain (microphone might be quiet)
            int32_t sample = buffer[i] * 4;
            sample = constrain(sample, -32768, 32767);
            audioRecordBuffer[audioRecordIndex++] = (int16_t)sample;
        }
    }
}

void playReceivedAudio() {
    if (audioPlayBuffer == nullptr || audioPlaySize == 0) {
        Serial.println("No audio to play");
        currentState = STATE_IDLE;
        return;
    }

    Serial.printf("Playing %d bytes of MP3 audio\n", audioPlaySize);

    // For MP3 decoding, we need to use a decoder library
    // The ESP32_MP3_Decoder library or similar can be used here
    // For simplicity, let's use a basic approach with the Audio library

    // Note: MP3 decoding on ESP32 requires additional setup
    // You may need to use the ESP8266Audio library or similar
    // For now, we'll output the raw data (you'll need to add MP3 decoding)

    // Simple beep to indicate response (placeholder)
    playBeep(800, 200);
    delay(100);
    playBeep(1000, 200);

    // TODO: Add proper MP3 decoding here
    // Options:
    // 1. Use ESP8266Audio library with AudioGeneratorMP3
    // 2. Use libhelix-mp3 decoder
    // 3. Request PCM from server instead of MP3

    // Cleanup
    free(audioPlayBuffer);
    audioPlayBuffer = nullptr;
    audioPlaySize = 0;

    currentState = STATE_IDLE;
    setLED(false);
    Serial.println("Ready for next command");
}

void playBeep(int frequency, int duration) {
    // Generate a simple tone
    const int sampleRate = 22050;
    int numSamples = (sampleRate * duration) / 1000;
    int16_t* buffer = (int16_t*)malloc(numSamples * sizeof(int16_t));

    if (buffer == nullptr) return;

    for (int i = 0; i < numSamples; i++) {
        float t = (float)i / sampleRate;
        buffer[i] = (int16_t)(16000 * sin(2 * PI * frequency * t));
    }

    size_t bytesWritten;
    i2s_write(I2S_SPK_PORT, buffer, numSamples * sizeof(int16_t), &bytesWritten, portMAX_DELAY);

    free(buffer);
}

// ============ LED CONTROL ============

void setLED(bool on) {
    digitalWrite(LED_PIN, on ? HIGH : LOW);
}

void blinkLED(int times, int delayMs) {
    for (int i = 0; i < times; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(delayMs);
        digitalWrite(LED_PIN, LOW);
        delay(delayMs);
    }
}

// ============ BUTTON HANDLING ============

void IRAM_ATTR buttonISR() {
    unsigned long now = millis();
    if (now - lastButtonTime > DEBOUNCE_MS) {
        if (digitalRead(BUTTON_PIN) == LOW) {
            buttonPressed = true;
        } else {
            buttonReleased = true;
        }
        lastButtonTime = now;
    }
}

void handleButton() {
    if (buttonPressed) {
        buttonPressed = false;

        if (currentState == STATE_IDLE && wsConnected) {
            startRecording();
        }
    }

    if (buttonReleased) {
        buttonReleased = false;

        if (currentState == STATE_RECORDING) {
            stopRecording();
        }
    }
}

// ============ SETUP ============

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n\n");
    Serial.println("═══════════════════════════════════════");
    Serial.println("    Kids Voice Assistant - ESP32-S3    ");
    Serial.println("═══════════════════════════════════════");

    // Setup pins
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // Startup indication
    blinkLED(3, 100);

    // Allocate audio buffer
    audioRecordBuffer = (int16_t*)malloc(AUDIO_BUFFER_SIZE * sizeof(int16_t));
    if (audioRecordBuffer == nullptr) {
        Serial.println("Failed to allocate audio buffer!");
        while (1) { delay(1000); }
    }
    Serial.printf("Audio buffer allocated: %d bytes\n", AUDIO_BUFFER_SIZE * sizeof(int16_t));

    // Setup I2S
    setupI2SMicrophone();
    setupI2SSpeaker();

    // Setup WiFi
    setupWiFi();

    // Setup WebSocket
    setupWebSocket();

    // Attach button interrupt
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, CHANGE);

    // Ready indication
    playBeep(1000, 100);
    delay(50);
    playBeep(1500, 100);

    Serial.println("\n✓ System ready!");
    Serial.println("Press and hold the button to speak...\n");
}

// ============ MAIN LOOP ============

void loop() {
    // Handle WebSocket
    webSocket.loop();

    // Handle button
    handleButton();

    // Record audio while button is pressed
    if (currentState == STATE_RECORDING) {
        recordAudioChunk();
    }

    // Status LED animation during processing
    static unsigned long lastBlink = 0;
    if (currentState == STATE_PROCESSING) {
        if (millis() - lastBlink > 200) {
            digitalWrite(LED_PIN, !digitalRead(LED_PIN));
            lastBlink = millis();
        }
    }

    // Reconnect WiFi if needed
    static unsigned long lastWiFiCheck = 0;
    if (millis() - lastWiFiCheck > 10000) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi disconnected, reconnecting...");
            WiFi.reconnect();
        }
        lastWiFiCheck = millis();
    }
}
