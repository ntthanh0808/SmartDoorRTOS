#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ===== WiFi Config =====
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// ===== Server Config =====
const char* SERVER_HOST = "192.168.1.100";  // IP of Python server
const int SERVER_PORT = 8000;
const char* DEVICE_TOKEN = "esp32-secret-token";

// ===== Serial to Arduino =====
#define ARDUINO_RX 16  // ESP32 RX ← Arduino TX
#define ARDUINO_TX 17  // ESP32 TX → Arduino RX

WebSocketsClient ws;
bool wsConnected = false;

void sendToArduino(const char* msg) {
  Serial2.println(msg);
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("[WS] Connected to server");
      break;

    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Disconnected");
      break;

    case WStype_TEXT: {
      Serial.printf("[WS] Received: %s\n", payload);
      // Forward server message to Arduino
      sendToArduino((const char*)payload);
      break;
    }

    case WStype_PING:
    case WStype_PONG:
      break;

    default:
      break;
  }
}

void handleArduinoSerial() {
  if (!Serial2.available()) return;

  String line = Serial2.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return;

  Serial.printf("[Arduino] %s\n", line.c_str());

  // Forward Arduino message to server via WebSocket
  if (wsConnected) {
    ws.sendTXT(line);
  }
}

void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void setup() {
  // Debug serial
  Serial.begin(115200);

  // Serial to Arduino (9600 baud to match Arduino)
  Serial2.begin(9600, SERIAL_8N1, ARDUINO_RX, ARDUINO_TX);

  Serial.println("SmartDoor ESP32 starting...");

  // Connect WiFi
  connectWiFi();

  // Connect WebSocket
  String path = "/ws/device?token=" + String(DEVICE_TOKEN);
  ws.begin(SERVER_HOST, SERVER_PORT, path.c_str());
  ws.onEvent(webSocketEvent);
  ws.setReconnectInterval(3000);
}

void loop() {
  ws.loop();
  handleArduinoSerial();

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
}
