#include <Arduino.h>
#include <STM32FreeRTOS.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ================= PIN DEFINITIONS =================
#define SS_PIN PA4
#define RST_PIN PA3

#define MOTOR_IN1 PB0
#define MOTOR_IN2 PB1
#define MOTOR_ENA PA8

#define PIR_PIN PA0
#define BUZZER_PIN PA1

#define LIMIT_OPEN_PIN PC13
#define LIMIT_CLOSE_PIN PC14

// ================= UART =================
HardwareSerial Serial1(PA10, PA9);  // UART1: RX, TX to ESP32
HardwareSerial Serial3(PB11, PB10); // UART3: RX, TX for debug

// ================= OBJECTS =================
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= RTOS HANDLES =================
SemaphoreHandle_t xMutexSerial;
SemaphoreHandle_t xMutexLCD;
QueueHandle_t xQueueMotor;

// ================= STATE VARIABLES =================
volatile bool doorOpen = false;
volatile bool motorRunning = false;
volatile bool systemReady = false;
volatile bool autoCloseScheduled = false;
volatile bool systemLocked = false;
volatile TickType_t doorOpenedTime = 0;
String lastUserName = "";
String currentTime = "00:00:00";

// ================= MOTOR COMMANDS =================
enum MotorCmd
{
  CMD_OPEN,
  CMD_CLOSE,
  CMD_STOP
};

// ================= HELPER FUNCTIONS =================
void sendToEsp(const char *msg)
{
  if (xSemaphoreTake(xMutexSerial, pdMS_TO_TICKS(100)) == pdTRUE)
  {
    Serial1.println(msg);
    Serial.println(msg);
    Serial3.println(msg);
    xSemaphoreGive(xMutexSerial);
  }
}

void lcdShow(const char *l1, const char *l2 = "")
{
  if (xSemaphoreTake(xMutexLCD, pdMS_TO_TICKS(100)) == pdTRUE)
  {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(l1);
    if (strlen(l2) > 0)
    {
      lcd.setCursor(0, 1);
      lcd.print(l2);
    }

    Serial3.print("[LCD] ");
    Serial3.print(l1);
    if (strlen(l2) > 0)
    {
      Serial3.print(" | ");
      Serial3.println(l2);
    }
    else
    {
      Serial3.println();
    }

    xSemaphoreGive(xMutexLCD);
  }
}

void buzzSuccess()
{
  digitalWrite(BUZZER_PIN, HIGH);
  vTaskDelay(pdMS_TO_TICKS(200));
  digitalWrite(BUZZER_PIN, LOW);
}

void buzzError()
{
  for (int i = 0; i < 3; i++)
  {
    digitalWrite(BUZZER_PIN, HIGH);
    vTaskDelay(pdMS_TO_TICKS(150));
    digitalWrite(BUZZER_PIN, LOW);
    vTaskDelay(pdMS_TO_TICKS(150));
  }
}

void buzzLock()
{
  for (int i = 0; i < 2; i++)
  {
    digitalWrite(BUZZER_PIN, HIGH);
    vTaskDelay(pdMS_TO_TICKS(150));
    digitalWrite(BUZZER_PIN, LOW);
    vTaskDelay(pdMS_TO_TICKS(150));
  }
}

void closeDoor()
{
  MotorCmd cmd = CMD_CLOSE;
  xQueueSend(xQueueMotor, &cmd, 0);
}

void openDoor()
{
  MotorCmd cmd = CMD_OPEN;
  xQueueSend(xQueueMotor, &cmd, 0);
}

// ================= TASK: STARTUP =================
void taskStartup(void *pv)
{
  (void)pv;

  lcdShow("Xin chao!");
  vTaskDelay(pdMS_TO_TICKS(3500));

  lcdShow("Cua dang dong...");
  closeDoor();
  vTaskDelay(pdMS_TO_TICKS(1500));

  lcdShow("Moi quet the...");
  systemReady = true;

  vTaskDelete(NULL);
}

// ================= TASK: RFID READER =================
void taskRFID(void *pv)
{
  (void)pv;

  while (1)
  {
    if (!systemReady)
    {
      vTaskDelay(pdMS_TO_TICKS(100));
      continue;
    }

    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial())
    {

      String uid = "";
      for (byte i = 0; i < rfid.uid.size; i++)
      {
        if (rfid.uid.uidByte[i] < 0x10)
          uid += "0";
        uid += String(rfid.uid.uidByte[i], HEX);
      }
      uid.toUpperCase();

      String msg = "RFID:" + uid;

      sendToEsp(msg.c_str());
      
      // Nếu hệ thống bị khóa, chỉ kêu beep và không đổi LCD
      if (systemLocked) {
        buzzError();
      } else {
        lcdShow("Dang kiem tra...");
      }

      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();

      vTaskDelay(pdMS_TO_TICKS(1000));
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// ================= TASK: SERIAL COMMUNICATION =================
void taskSerial(void *pv)
{
  (void)pv;
  char buf[100];

  while (1)
  {
    if (Serial1.available())
    {

      int idx = 0;
      while (Serial1.available() && idx < 99)
      {
        char c = Serial1.read();
        if (c == '\n')
          break;
        buf[idx++] = c;
      }
      buf[idx] = '\0';

      String line = String(buf);
      line.trim();

      if (line.startsWith("ALLOW:"))
      {
        String userName = line.substring(6);
        lastUserName = userName;

        buzzSuccess();
        lcdShow("Xin chao", (userName + "!").c_str());

        vTaskDelay(pdMS_TO_TICKS(2000));

        // Mở cửa
        if (!doorOpen)
        {
          lcdShow("Cua dang mo...");
          doorOpen = true;
          autoCloseScheduled = false;
          openDoor();
        }
      }
      else if (line.indexOf("DENY") >= 0)
      {
        buzzError();
        
        // Nếu hệ thống bị khóa, không đổi LCD
        if (!systemLocked) {
          lcdShow("The khong", "hop le!");
          vTaskDelay(pdMS_TO_TICKS(2000));
          lcdShow("Moi quet the...");
        }
      }
      else if (line.indexOf("CLOSE") >= 0)
      {
        lcdShow("Cua dang dong...");
        doorOpen = false;
        autoCloseScheduled = false;
        closeDoor();
      }
      else if (line.startsWith("LOCKED"))
      {
        systemLocked = true;
        buzzLock();
        lcdShow("He thong da", "khoa!");
      }
      else if (line.startsWith("UNLOCKED"))
      {
        systemLocked = false;
        buzzLock();
        lcdShow("Moi quet the...");
      }
      else if (line.startsWith("TIME:"))
      {
        currentTime = line.substring(5);
        // Cập nhật LCD nếu hệ thống đang khóa
        if (systemLocked) {
          lcdShow("He thong da khoa", ("    " + currentTime).c_str());
        }
      }
    }

    vTaskDelay(pdMS_TO_TICKS(20));
  }
}

// ================= TASK: PIR SENSOR =================
void taskPIR(void *pv)
{
  (void)pv;
  TickType_t lastMotion = 0;
  bool motionDetected = false;

  while (1)
  {
    if (!systemReady || systemLocked)
    {
      vTaskDelay(pdMS_TO_TICKS(200));
      continue;
    }

    if (digitalRead(PIR_PIN) == HIGH)
    {
      if (!motionDetected)
      {
        motionDetected = true;
        lastMotion = xTaskGetTickCount();

        sendToEsp("PIR:Motion");

        // Mở cửa khi phát hiện chuyển động (giống RFID)
        if (!doorOpen)
        {
          doorOpen = true;
          autoCloseScheduled = false;
          openDoor();
        }
      }
    }
    else
    {
      motionDetected = false;
    }

    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

// ================= TASK: AUTO CLOSE =================
void taskAutoClose(void *pv) {
  (void)pv;
  int lastSecondsLeft = -1;
  
  while (1) {
    // Kiểm tra nếu cần tự động đóng cửa
    if (autoCloseScheduled && doorOpen) {
      TickType_t elapsed = xTaskGetTickCount() - doorOpenedTime;
      int secondsLeft = 5 - (elapsed / 1000);
      
      // Chỉ cập nhật LCD khi số giây thay đổi
      if (secondsLeft > 0 && secondsLeft <= 5 && secondsLeft != lastSecondsLeft) {
        char line1[17];
        char line2[17];
        sprintf(line1, "Cua da mo!");
        sprintf(line2, "%ds...", secondsLeft);
        lcdShow(line1, line2);
        lastSecondsLeft = secondsLeft;
      }
      
      // Đã đủ 5 giây, đóng cửa
      if (elapsed >= pdMS_TO_TICKS(5000)) {
        Serial3.println("[Auto Close] Closing door after 5 seconds");
        doorOpen = false;
        autoCloseScheduled = false;
        lastSecondsLeft = -1;
        closeDoor();
      }
    } else {
      lastSecondsLeft = -1;
    }
    
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// ================= TASK: MOTOR CONTROL =================
void taskMotor(void *pv)
{
  (void)pv;
  MotorCmd cmd;

  while (1)
  {

    if (xQueueReceive(xQueueMotor, &cmd, 0) == pdTRUE)
    {

      if (cmd == CMD_OPEN)
      {
        lcdShow("Cua dang mo...");
        sendToEsp("Door:Opening");
        digitalWrite(MOTOR_IN1, HIGH);
        digitalWrite(MOTOR_IN2, LOW);
        analogWrite(MOTOR_ENA, 150);
        motorRunning = true;
      }
      else if (cmd == CMD_CLOSE)
      {
        lcdShow("Cua dang dong...");
        sendToEsp("Door:Closing");
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, HIGH);
        analogWrite(MOTOR_ENA, 150);
        motorRunning = true;
      }
      else
      {
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        analogWrite(MOTOR_ENA, 0);
        motorRunning = false;
      }
    }

    // Check limit switches
    if (motorRunning)
    {

      // Cửa đã mở xong
      if (digitalRead(LIMIT_OPEN_PIN) == LOW && doorOpen)
      {
        analogWrite(MOTOR_ENA, 0);
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        motorRunning = false;
        sendToEsp("Door:Opened");
        lcdShow("Cua da mo!");
        Serial3.println("[Motor] Door fully opened");

      // Lên lịch tự động đóng sau 5 giây
        doorOpenedTime = xTaskGetTickCount();
        autoCloseScheduled = true;
        Serial3.println("[Motor] Auto-close scheduled in 5 seconds");

        vTaskDelay(pdMS_TO_TICKS(1000));
        lcdShow("Moi quet the...");
      }

      // Cửa đã đóng xong
      if (digitalRead(LIMIT_CLOSE_PIN) == LOW && !doorOpen)
      {
        analogWrite(MOTOR_ENA, 0);
        digitalWrite(MOTOR_IN1, LOW);
        digitalWrite(MOTOR_IN2, LOW);
        motorRunning = false;

        sendToEsp("Door:Closed");
        lcdShow("Cua da dong!");
        Serial3.println("[Motor] Door fully closed");

        vTaskDelay(pdMS_TO_TICKS(1000));
        lcdShow("Moi quet the...");
      }
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// ================= SETUP =================
void setup()
{
  Serial.begin(115200);
  Serial1.begin(115200);
  Serial3.begin(9600);

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin();
  lcd.init();
  lcd.backlight();

  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);
  pinMode(MOTOR_ENA, OUTPUT);
  pinMode(LIMIT_OPEN_PIN, INPUT_PULLUP);
  pinMode(LIMIT_CLOSE_PIN, INPUT_PULLUP);

  xMutexSerial = xSemaphoreCreateMutex();
  xMutexLCD = xSemaphoreCreateMutex();
  xQueueMotor = xQueueCreate(4, sizeof(MotorCmd));

  Serial3.println("=== STM32 SmartDoor System ===");
  Serial3.println("Initializing...");

  xTaskCreate(taskStartup, "Startup", 256, NULL, 4, NULL);
  xTaskCreate(taskSerial, "Serial", 256, NULL, 3, NULL);
  xTaskCreate(taskRFID, "RFID", 256, NULL, 2, NULL);
  xTaskCreate(taskMotor, "Motor", 256, NULL, 2, NULL);
  xTaskCreate(taskPIR, "PIR", 256, NULL, 1, NULL);
  xTaskCreate(taskAutoClose, "AutoClose", 128, NULL, 1, NULL);

  vTaskStartScheduler();
}

void loop()
{
  // FreeRTOS handles everything
}
