#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ===== WiFi Config =====
const char* WIFI_SSID = "NGUYEN TRUNG THANH";
const char* WIFI_PASS = "08082004";

// ===== Server Config =====
const char* SERVER_HOST = "192.168.0.101";  // IP of Python server
const int SERVER_PORT = 8000;
const char* DEVICE_TOKEN = "esp32-secret-token";

// ===== Serial to STM32 =====
#define STM32_RX 16  // ESP32 RX ← STM32 TX
#define STM32_TX 17  // ESP32 TX → STM32 RX

WebSocketsClient ws;
bool wsConnected = false;
unsigned long lastPingTime = 0;
unsigned long lastReconnectAttempt = 0;
const unsigned long PING_INTERVAL = 30000; // Ping every 30 seconds
const unsigned long RECONNECT_INTERVAL = 5000; // Try reconnect every 5 seconds

void sendToSTM32(const char* msg) {
  Serial2.println(msg);
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Disconnected from server");
      break;

    case WStype_CONNECTED: {
      wsConnected = true;
      lastPingTime = millis();
      Serial.printf("[WS] Connected to server: %s\n", payload);
      
      // Send initial message to server
      ws.sendTXT("{\"type\":\"device_connected\",\"device\":\"esp32\"}");
      break;
    }

    case WStype_TEXT: {
      Serial.printf("[WS] Received JSON: %s\n", payload);
      
      // Parse JSON from server
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (error) {
        Serial.printf("[WS] JSON parse error: %s\n", error.c_str());
        return;
      }
      
      // Convert JSON to plain text for STM32
      const char* action = doc["action"];
      
      Serial.printf("[WS] Action received: %s\n", action);
      
      if (strcmp(action, "open_door") == 0) {
        const char* name = doc["name"] | "";
        String msg = "ALLOW:" + String(name);
        sendToSTM32(msg.c_str());
        Serial.printf("[STM32] Sent: %s\n", msg.c_str());
      }
      else if (strcmp(action, "deny") == 0) {
        sendToSTM32("DENY");
        Serial.println("[STM32] Sent: DENY");
      }
      else if (strcmp(action, "close_door") == 0) {
        sendToSTM32("CLOSE");
        Serial.println("[STM32] Sent: CLOSE");
      }
      else if (strcmp(action, "system_locked") == 0) {
        sendToSTM32("LOCKED");
        Serial.println("[STM32] Sent: LOCKED");
      }
      else if (strcmp(action, "system_unlocked") == 0) {
        sendToSTM32("UNLOCKED");
        Serial.println("[STM32] Sent: UNLOCKED");
      }
      else if (strcmp(action, "update_time") == 0) {
        const char* timeStr = doc["time"] | "00:00:00";
        String msg = "TIME:" + String(timeStr);
        sendToSTM32(msg.c_str());
        Serial.printf("[STM32] Sent: %s\n", msg.c_str());
      }
      else {
        Serial.printf("[WS] Unknown action: %s\n", action);
      }
      break;
    }

    case WStype_BIN:
      Serial.printf("[WS] Binary data received, length: %u\n", length);
      break;

    case WStype_PING:
      Serial.println("[WS] Ping received from server");
      break;

    case WStype_PONG:
      Serial.println("[WS] Pong received from server");
      break;

    case WStype_ERROR:
      Serial.printf("[WS] Error: %s\n", payload);
      break;

    default:
      Serial.printf("[WS] Unknown event type: %d\n", type);
      break;
  }
}


void handleSTM32Serial() {
  if (!Serial2.available()) return;

  String line = Serial2.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return;

  Serial.printf("[STM32] Received: %s\n", line.c_str());

  // Convert STM32 plain text to JSON for server
  if (wsConnected) {
    StaticJsonDocument<256> doc;
    
    if (line.startsWith("RFID:")) {
      String uid = line.substring(5);
      doc["event"] = "card_scanned";
      doc["card_uid"] = uid;
    }
    else if (line.startsWith("PIR:")) {
      doc["event"] = "motion_detected";
    }
    else if (line.startsWith("Door:Opening")) {
      doc["event"] = "door_status";
      doc["status"] = "opening";
    }
    else if (line.startsWith("Door:Opened")) {
      doc["event"] = "door_status";
      doc["status"] = "opened";
    }
    else if (line.startsWith("Door:Closing")) {
      doc["event"] = "door_status";
      doc["status"] = "closing";
    }
    else if (line.startsWith("Door:Closed")) {
      doc["event"] = "door_status";
      doc["status"] = "closed";
    }
    else {
      // Unknown format, send as raw message
      doc["event"] = "raw";
      doc["message"] = line;
    }
    
    String jsonStr;
    serializeJson(doc, jsonStr);
    ws.sendTXT(jsonStr);
    Serial.printf("[WS] Sent JSON: %s\n", jsonStr.c_str());
  } else {
    Serial.println("[WS] Not connected, message not sent");
  }
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.printf("\n[WiFi] Connecting to: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Signal strength: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] Connection failed!");
  }
}

void connectWebSocket() {
  Serial.println("[WS] Attempting to connect to WebSocket server...");
  Serial.printf("[WS] Server: %s:%d\n", SERVER_HOST, SERVER_PORT);
  
  String path = "/ws/device?token=" + String(DEVICE_TOKEN);
  Serial.printf("[WS] Path: %s\n", path.c_str());
  
  ws.begin(SERVER_HOST, SERVER_PORT, path.c_str());
  ws.onEvent(webSocketEvent);
  ws.setReconnectInterval(5000);
  ws.enableHeartbeat(15000, 3000, 2);
  
  lastReconnectAttempt = millis();
}

void setup() {
  // Debug serial
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("SmartDoor ESP32 Gateway");
  Serial.println("=================================");

  // Serial to STM32 (115200 baud to match STM32)
  Serial2.begin(115200, SERIAL_8N1, STM32_RX, STM32_TX);
  Serial.println("[Serial] STM32 communication initialized");

  // Connect WiFi
  connectWiFi();

  // Connect WebSocket if WiFi is connected
  if (WiFi.status() == WL_CONNECTED) {
    connectWebSocket();
  } else {
    Serial.println("[ERROR] Cannot connect to WebSocket without WiFi");
  }
  
  Serial.println("=================================");
  Serial.println("System ready!");
  Serial.println("=================================\n");
}

void loop() {
  // Handle WebSocket
  ws.loop();
  
  // Handle STM32 Serial
  handleSTM32Serial();

  // Send periodic ping to keep connection alive
  if (wsConnected && (millis() - lastPingTime > PING_INTERVAL)) {
    ws.sendPing();
    lastPingTime = millis();
    Serial.println("[WS] Sending ping to keep alive");
  }

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Connection lost! Reconnecting...");
    connectWiFi();
    
    // Reconnect WebSocket after WiFi is back
    if (WiFi.status() == WL_CONNECTED && !wsConnected) {
      connectWebSocket();
    }
  }
  
  // Check WebSocket connection status periodically
  if (!wsConnected && (millis() - lastReconnectAttempt > RECONNECT_INTERVAL)) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[WS] Not connected. Attempting reconnect...");
      lastReconnectAttempt = millis();
    }
  }
}
