/*
 * SmartDoor - Arduino Uno Firmware
 * Hệ điều hành nhúng thời gian thực: FreeRTOS
 *
 * Các task:
 *   1. taskRFID       - Đọc thẻ RFID (ưu tiên 2)
 *   2. taskSerial     - Nhận lệnh từ ESP32 qua Serial (ưu tiên 3 - cao nhất)
 *   3. taskPIR        - Đọc cảm biến chuyển động (ưu tiên 1)
 *   4. taskMotor      - Điều khiển motor + đọc công tắc hành trình (ưu tiên 2)
 *
 * Đồng bộ:
 *   - xMutexSerial: mutex bảo vệ Serial (gửi dữ liệu lên ESP32)
 *   - xMutexLCD:    mutex bảo vệ LCD I2C
 *   - xQueueMotor:  queue gửi lệnh tới taskMotor
 */

#include <Arduino.h>
#include <Arduino_FreeRTOS.h>
#include <semphr.h>
#include <queue.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ==================== PIN DEFINITIONS ====================
#define RST_PIN         9
#define SS_PIN          10
#define MOTOR_IN1       7
#define MOTOR_IN2       6
#define MOTOR_ENA       5
#define PIR_PIN         2
#define BUZZER_PIN      3
#define LIMIT_OPEN_PIN  A0
#define LIMIT_CLOSE_PIN A1

// ==================== CONSTANTS ==========================
#define PIR_COOLDOWN_MS     5000
#define MOTOR_TIMEOUT_MS    5000
#define SERIAL_BUF_SIZE     128
#define QUEUE_SIZE          4

// ==================== MOTOR COMMANDS =====================
enum MotorCmd : uint8_t {
  CMD_OPEN,
  CMD_CLOSE,
  CMD_STOP
};

// ==================== OBJECTS ============================
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ==================== RTOS HANDLES =======================
SemaphoreHandle_t xMutexSerial;
SemaphoreHandle_t xMutexLCD;
QueueHandle_t     xQueueMotor;

// ==================== SHARED STATE =======================
volatile bool doorOpen      = false;
volatile bool systemLocked  = false;
volatile bool motorRunning  = false;

// ==================== TASK DECLARATIONS ==================
void taskRFID(void* pvParameters);
void taskSerial(void* pvParameters);
void taskPIR(void* pvParameters);
void taskMotor(void* pvParameters);

// ==================== HELPER FUNCTIONS ===================

// Gửi JSON message lên ESP32 (thread-safe)
void sendToEsp(const char* json) {
  if (xSemaphoreTake(xMutexSerial, pdMS_TO_TICKS(100)) == pdTRUE) {
    Serial.println(json);
    xSemaphoreGive(xMutexSerial);
  }
}

// Hiển thị LCD (thread-safe)
void lcdShow(const char* line1, const char* line2 = "") {
  if (xSemaphoreTake(xMutexLCD, pdMS_TO_TICKS(100)) == pdTRUE) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    if (strlen(line2) > 0) {
      lcd.setCursor(0, 1);
      lcd.print(line2);
    }
    xSemaphoreGive(xMutexLCD);
  }
}

void buzzSuccess() {
  digitalWrite(BUZZER_PIN, HIGH);
  vTaskDelay(pdMS_TO_TICKS(200));
  digitalWrite(BUZZER_PIN, LOW);
}

void buzzError() {
  for (uint8_t i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    vTaskDelay(pdMS_TO_TICKS(100));
    digitalWrite(BUZZER_PIN, LOW);
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

String getCardUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i > 0) uid += ":";
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// ==================== TASK: RFID =========================
// Ưu tiên 2 - Quét thẻ RFID, gửi card_uid lên server
void taskRFID(void* pvParameters) {
  (void)pvParameters;

  for (;;) {
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      String uid = getCardUID();
      String msg = "{\"event\":\"card_scanned\",\"card_uid\":\"" + uid + "\"}";
      sendToEsp(msg.c_str());
      lcdShow("Dang kiem tra...");

      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();

      // Debounce - chờ 1s trước khi đọc thẻ tiếp
      vTaskDelay(pdMS_TO_TICKS(1000));
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// ==================== TASK: SERIAL =======================
// Ưu tiên 3 (cao nhất) - Nhận lệnh từ ESP32, xử lý ngay
void taskSerial(void* pvParameters) {
  (void)pvParameters;
  char buf[SERIAL_BUF_SIZE];

  for (;;) {
    if (Serial.available()) {
      // Đọc có timeout bằng RTOS delay thay vì blocking
      uint8_t idx = 0;
      while (Serial.available() && idx < SERIAL_BUF_SIZE - 1) {
        char c = Serial.read();
        if (c == '\n') break;
        buf[idx++] = c;
      }
      buf[idx] = '\0';

      String line(buf);
      line.trim();
      if (line.length() == 0) {
        vTaskDelay(pdMS_TO_TICKS(10));
        continue;
      }

      MotorCmd cmd;

      if (line.indexOf("\"open_door\"") >= 0) {
        // Trích xuất tên người dùng
        int nameIdx = line.indexOf("\"name\":\"");
        String name = "";
        if (nameIdx >= 0) {
          int start = nameIdx + 8;
          int end = line.indexOf("\"", start);
          name = line.substring(start, end);
        }
        buzzSuccess();
        if (name.length() > 0) {
          lcdShow("Xin chao!", name.c_str());
        } else {
          lcdShow("Dang mo cua...");
        }
        doorOpen = true;
        cmd = CMD_OPEN;
        xQueueSend(xQueueMotor, &cmd, pdMS_TO_TICKS(50));
      }
      else if (line.indexOf("\"close_door\"") >= 0) {
        lcdShow("Dang dong cua...");
        doorOpen = false;
        cmd = CMD_CLOSE;
        xQueueSend(xQueueMotor, &cmd, pdMS_TO_TICKS(50));
      }
      else if (line.indexOf("\"deny\"") >= 0) {
        buzzError();
        if (line.indexOf("\"locked\"") >= 0) {
          lcdShow("He thong da", "khoa!");
        } else {
          lcdShow("The khong", "hop le!");
        }
        vTaskDelay(pdMS_TO_TICKS(2000));
        lcdShow("SmartDoor", "Quet the...");
      }
      else if (line.indexOf("\"system_locked\"") >= 0) {
        systemLocked = true;
        lcdShow("He thong", "DA KHOA");
      }
      else if (line.indexOf("\"system_unlocked\"") >= 0) {
        systemLocked = false;
        lcdShow("SmartDoor", "Quet the...");
      }
    }

    vTaskDelay(pdMS_TO_TICKS(20));
  }
}

// ==================== TASK: PIR ==========================
// Ưu tiên 1 (thấp nhất) - Phát hiện chuyển động
void taskPIR(void* pvParameters) {
  (void)pvParameters;
  TickType_t lastPirTick = 0;

  for (;;) {
    if (digitalRead(PIR_PIN) == HIGH) {
      TickType_t now = xTaskGetTickCount();
      if ((now - lastPirTick) >= pdMS_TO_TICKS(PIR_COOLDOWN_MS)) {
        lastPirTick = now;
        sendToEsp("{\"event\":\"motion_detected\"}");
      }
    }

    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

// ==================== TASK: MOTOR ========================
// Ưu tiên 2 - Điều khiển motor + giám sát công tắc hành trình
void taskMotor(void* pvParameters) {
  (void)pvParameters;
  MotorCmd cmd;
  TickType_t motorStartTick = 0;

  for (;;) {
    // Nhận lệnh mới từ queue (không blocking)
    if (xQueueReceive(xQueueMotor, &cmd, 0) == pdTRUE) {
      switch (cmd) {
        case CMD_OPEN:
          digitalWrite(MOTOR_IN1, HIGH);
          digitalWrite(MOTOR_IN2, LOW);
          analogWrite(MOTOR_ENA, 255);
          motorRunning = true;
          motorStartTick = xTaskGetTickCount();
          sendToEsp("{\"event\":\"door_status\",\"status\":\"opening\"}");
          break;

        case CMD_CLOSE:
          digitalWrite(MOTOR_IN1, LOW);
          digitalWrite(MOTOR_IN2, HIGH);
          analogWrite(MOTOR_ENA, 255);
          motorRunning = true;
          motorStartTick = xTaskGetTickCount();
          sendToEsp("{\"event\":\"door_status\",\"status\":\"closing\"}");
          break;

        case CMD_STOP:
          digitalWrite(MOTOR_IN1, LOW);
          digitalWrite(MOTOR_IN2, LOW);
          analogWrite(MOTOR_ENA, 0);
          motorRunning = false;
          break;
      }
    }

    // Giám sát công tắc hành trình khi motor đang chạy
    if (motorRunning) {
      bool limitOpen  = (digitalRead(LIMIT_OPEN_PIN) == LOW);
      bool limitClose = (digitalRead(LIMIT_CLOSE_PIN) == LOW);

      if (limitOpen && doorOpen) {
        // Cửa đã mở hoàn toàn → dừng motor
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        analogWrite(MOTOR_ENA, 0);
        motorRunning = false;
        sendToEsp("{\"event\":\"door_status\",\"status\":\"opened\"}");
        lcdShow("Cua da mo");
      }
      else if (limitClose && !doorOpen) {
        // Cửa đã đóng hoàn toàn → dừng motor
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        analogWrite(MOTOR_ENA, 0);
        motorRunning = false;
        sendToEsp("{\"event\":\"door_status\",\"status\":\"closed\"}");
        lcdShow("SmartDoor", "Quet the...");
      }

      // Timeout an toàn - tránh motor chạy mãi
      if ((xTaskGetTickCount() - motorStartTick) >= pdMS_TO_TICKS(MOTOR_TIMEOUT_MS)) {
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        analogWrite(MOTOR_ENA, 0);
        motorRunning = false;
        lcdShow("Loi: Timeout!", "Motor da dung");
      }
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// ==================== SETUP ==============================
void setup() {
  Serial.begin(9600);

  // RFID
  SPI.begin();
  rfid.PCD_Init();

  // LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SmartDoor RTOS");
  lcd.setCursor(0, 1);
  lcd.print("Khoi dong...");

  // Motor pins
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);
  pinMode(MOTOR_ENA, OUTPUT);
  digitalWrite(MOTOR_IN1, LOW);
  digitalWrite(MOTOR_IN2, LOW);
  analogWrite(MOTOR_ENA, 0);

  // PIR
  pinMode(PIR_PIN, INPUT);

  // Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Limit switches (pull-up nội)
  pinMode(LIMIT_OPEN_PIN, INPUT_PULLUP);
  pinMode(LIMIT_CLOSE_PIN, INPUT_PULLUP);

  // ===== Tạo Mutex =====
  xMutexSerial = xSemaphoreCreateMutex();
  xMutexLCD    = xSemaphoreCreateMutex();

  // ===== Tạo Queue =====
  xQueueMotor = xQueueCreate(QUEUE_SIZE, sizeof(MotorCmd));

  // ===== Tạo Tasks (stack size tính bằng words, 1 word = 2 bytes trên AVR) =====
  //                          Function    Name      Stack  Param  Priority  Handle
  xTaskCreate(taskSerial,     "Serial",   150,      NULL,  3,     NULL);  // Cao nhất
  xTaskCreate(taskRFID,       "RFID",     150,      NULL,  2,     NULL);
  xTaskCreate(taskMotor,      "Motor",    120,      NULL,  2,     NULL);
  xTaskCreate(taskPIR,        "PIR",      80,       NULL,  1,     NULL);  // Thấp nhất

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SmartDoor");
  lcd.setCursor(0, 1);
  lcd.print("Quet the...");

  // FreeRTOS scheduler bắt đầu tự động sau khi setup() kết thúc
}

// loop() không được sử dụng khi dùng FreeRTOS - scheduler quản lý toàn bộ
void loop() {}
