# SmartDoor - Arduino Uno Firmware

Firmware cho Arduino Uno, sử dụng hệ điều hành nhúng thời gian thực **FreeRTOS**.

## Tech Stack

- **PlatformIO** - Build system
- **FreeRTOS** - Hệ điều hành thời gian thực
- **MFRC522** - Thư viện đọc thẻ RFID
- **LiquidCrystal_I2C** - Thư viện màn hình LCD

## Phần cứng kết nối

| Module               | Pin Arduino  | Mô tả                      |
|----------------------|--------------|------------------------------|
| RFID RC522 RST       | D9           | Reset                        |
| RFID RC522 SS        | D10          | Slave Select                 |
| RFID RC522 MOSI      | D11          | SPI MOSI                    |
| RFID RC522 MISO      | D12          | SPI MISO                    |
| RFID RC522 SCK       | D13          | SPI Clock                   |
| Motor L298N IN1      | D7           | Chiều quay 1                |
| Motor L298N IN2      | D6           | Chiều quay 2                |
| Motor L298N ENA      | D5 (PWM)     | Tốc độ motor               |
| PIR sensor           | D2           | Cảm biến chuyển động        |
| Buzzer               | D3           | Còi báo                     |
| Công tắc hành trình (mở) | A0      | LOW khi cửa mở hoàn toàn   |
| Công tắc hành trình (đóng)| A1      | LOW khi cửa đóng hoàn toàn |
| LCD I2C SDA          | A4           | I2C Data                    |
| LCD I2C SCL          | A5           | I2C Clock                   |
| Serial TX            | D1 (TX)      | → ESP32 RX (GPIO 16)        |
| Serial RX            | D0 (RX)      | ← ESP32 TX (GPIO 17)        |

## Kiến trúc FreeRTOS

### Các Task

| Task         | Chức năng                              | Ưu tiên | Stack (words) |
|--------------|----------------------------------------|---------|---------------|
| `taskSerial` | Nhận lệnh từ ESP32 qua Serial         | 3 (cao) | 150           |
| `taskRFID`   | Quét thẻ RFID, gửi card_uid lên server| 2       | 150           |
| `taskMotor`  | Điều khiển motor + công tắc hành trình| 2       | 120           |
| `taskPIR`    | Phát hiện chuyển động (PIR sensor)     | 1 (thấp)| 80            |

### Cơ chế đồng bộ

| Handle         | Loại   | Mục đích                                     |
|----------------|--------|-----------------------------------------------|
| `xMutexSerial` | Mutex  | Bảo vệ Serial - tránh 2 task gửi cùng lúc   |
| `xMutexLCD`    | Mutex  | Bảo vệ LCD I2C - tránh xung đột hiển thị    |
| `xQueueMotor`  | Queue  | Truyền lệnh mở/đóng từ taskSerial → taskMotor|

### Sơ đồ luồng dữ liệu

```
taskRFID ──(xMutexSerial)──→ Serial TX → ESP32
                              ↑
taskPIR  ──(xMutexSerial)────┘

Serial RX ← ESP32 → taskSerial ──(xQueueMotor)──→ taskMotor → Motor
                         │
                    (xMutexLCD)──→ LCD
```

## Serial Protocol (Arduino ↔ ESP32)

Giao tiếp Serial 9600 baud, mỗi message là 1 dòng JSON.

### Arduino → ESP32

```json
{"event": "card_scanned", "card_uid": "AB:CD:EF:12"}
{"event": "door_status", "status": "opening"}
{"event": "door_status", "status": "opened"}
{"event": "door_status", "status": "closing"}
{"event": "door_status", "status": "closed"}
{"event": "motion_detected"}
```

### ESP32 → Arduino

```json
{"action": "open_door", "name": "Nguyen Van A"}
{"action": "close_door"}
{"action": "deny", "reason": "invalid"}
{"action": "deny", "reason": "locked"}
{"action": "system_locked"}
{"action": "system_unlocked"}
```

## Build & Upload

```bash
cd firmware/arduino

# Build
pio run

# Upload lên Arduino Uno
pio run --target upload

# Monitor Serial
pio device monitor
```

## Lưu ý

- LCD dùng địa chỉ I2C `0x27`. Nếu LCD không hiển thị, quét địa chỉ I2C bằng I2C Scanner.
- Công tắc hành trình dùng `INPUT_PULLUP` nội, tích cực LOW.
- Motor có timeout 5 giây - tự dừng nếu không chạm công tắc hành trình.
- `loop()` rỗng - FreeRTOS scheduler quản lý toàn bộ các task.
