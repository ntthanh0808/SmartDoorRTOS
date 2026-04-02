# SmartDoor - STM32 Firmware

Firmware cho STM32F103C8, điều khiển phần cứng cửa thông minh với FreeRTOS.

## Tech Stack

- **PlatformIO** - Build system
- **STM32FreeRTOS** - Real-time operating system
- **MFRC522** - Thư viện RFID reader
- **LiquidCrystal_I2C** - Thư viện LCD I2C

## Vai trò trong hệ thống

```
RFID Reader ──┐
PIR Sensor ───┤
Limit Switch ─┤──→ STM32F103C8 ←── Serial (115200) ──→ ESP32
Motor ────────┤
LCD I2C ──────┤
Buzzer ───────┘
```

STM32 xử lý tất cả phần cứng và logic điều khiển cửa:
- Đọc thẻ RFID và gửi lên ESP32
- Điều khiển motor mở/đóng cửa
- Hiển thị thông tin trên LCD
- Phát hiện chuyển động qua PIR
- Tự động đóng cửa sau 5 giây

## Phần cứng kết nối

### RFID Reader (MFRC522)
| Pin MFRC522 | Pin STM32 | Mô tả |
|-------------|-----------|-------|
| SDA/SS      | PA4       | Slave Select |
| SCK         | PA5       | SPI Clock |
| MOSI        | PA7       | SPI MOSI |
| MISO        | PA6       | SPI MISO |
| RST         | PA3       | Reset |
| 3.3V        | 3.3V      | Nguồn |
| GND         | GND       | Ground |

### LCD I2C (16x2)
| Pin LCD | Pin STM32 | Mô tả |
|---------|-----------|-------|
| SDA     | PB7       | I2C Data |
| SCL     | PB6       | I2C Clock |
| VCC     | 5V        | Nguồn |
| GND     | GND       | Ground |

**Địa chỉ I2C:** 0x27 (có thể là 0x3F, dùng I2C scanner để kiểm tra)

### Motor DC + Driver (L298N)
| Pin Driver | Pin STM32 | Mô tả |
|------------|-----------|-------|
| IN1        | PB0       | Điều khiển chiều 1 |
| IN2        | PB1       | Điều khiển chiều 2 |
| ENA        | PA8       | PWM tốc độ |

**Tốc độ motor:** 150/255 (có thể điều chỉnh trong code)

### Cảm biến PIR
| Pin PIR | Pin STM32 | Mô tả |
|---------|-----------|-------|
| OUT     | PA0       | Digital output |
| VCC     | 5V        | Nguồn |
| GND     | GND       | Ground |

### Buzzer
| Pin Buzzer | Pin STM32 | Mô tả |
|------------|-----------|-------|
| +          | PA1       | Digital output |
| -          | GND       | Ground |

### Limit Switches
| Switch | Pin STM32 | Mô tả |
|--------|-----------|-------|
| Limit Open  | PC13 | INPUT_PULLUP (LOW = đã chạm) |
| Limit Close | PC14 | INPUT_PULLUP (LOW = đã chạm) |

### UART Communication
| UART | RX Pin | TX Pin | Baud | Mục đích |
|------|--------|--------|------|----------|
| Serial1 | PA10 | PA9 | 115200 | Giao tiếp với ESP32 |
| Serial3 | PB11 | PB10 | 9600 | Debug log |

## Giao thức Serial với ESP32

### STM32 → ESP32
```
RFID:xxxxxxxx        // UID thẻ RFID (hex uppercase)
PIR:Motion           // Phát hiện chuyển động
Door:Opening         // Cửa đang mở
Door:Opened          // Cửa đã mở xong
Door:Closing         // Cửa đang đóng
Door:Closed          // Cửa đã đóng xong
```

### ESP32 → STM32
```
ALLOW:Tên người      // Cho phép mở cửa
DENY                 // Từ chối (thẻ không hợp lệ hoặc hệ thống khóa)
CLOSE                // Lệnh đóng cửa
LOCKED               // Hệ thống đã khóa
UNLOCKED             // Hệ thống đã mở khóa
TIME:HH:MM:SS        // Cập nhật thời gian (khi khóa)
```

## FreeRTOS Tasks

| Task | Priority | Stack | Chức năng |
|------|----------|-------|-----------|
| taskStartup | 4 | 256 | Khởi động hệ thống, đóng cửa ban đầu, tự xóa sau khi xong |
| taskSerial | 3 | 256 | Nhận lệnh từ ESP32 qua UART1 |
| taskRFID | 2 | 256 | Quét thẻ RFID liên tục, gửi UID lên ESP32 |
| taskMotor | 2 | 256 | Điều khiển motor, kiểm tra limit switches |
| taskPIR | 1 | 256 | Phát hiện chuyển động, tự động mở cửa |
| taskAutoClose | 1 | 128 | Đếm ngược 5 giây, tự động đóng cửa |

## Luồng hoạt động

### Khởi động
1. Hiển thị "Xin chao!" trên LCD
2. Đóng cửa về vị trí ban đầu
3. Hiển thị "Moi quet the..."
4. Sẵn sàng hoạt động

### Quét thẻ RFID (hệ thống mở)
1. Đọc UID thẻ → gửi `RFID:xxxxxxxx` lên ESP32
2. Hiển thị "Dang kiem tra..."
3. Nhận `ALLOW:Tên` từ server
4. Kêu 1 tiếng beep
5. Hiển thị "Xin chao Tên!"
6. Mở cửa → gửi `Door:Opening` → `Door:Opened`
7. Đếm ngược 5 giây
8. Tự động đóng cửa

### Quét thẻ RFID (hệ thống khóa)
1. Đọc UID thẻ → gửi `RFID:xxxxxxxx` lên ESP32
2. Kêu 3 tiếng beep
3. LCD không đổi (vẫn hiển thị "He thong da khoa!" và thời gian)
4. Không mở cửa

### Khóa hệ thống
1. Nhận `LOCKED` từ ESP32
2. Kêu 2 tiếng beep
3. LCD hiển thị "He thong da khoa!" (dòng 1)
4. Nhận `TIME:HH:MM:SS` mỗi giây và hiển thị (dòng 2)
5. PIR sensor bị vô hiệu hóa

### Mở khóa hệ thống
1. Nhận `UNLOCKED` từ ESP32
2. Kêu 2 tiếng beep
3. LCD hiển thị "Moi quet the..."
4. PIR sensor hoạt động trở lại

## Âm thanh Buzzer

| Số tiếng beep | Thời lượng | Ý nghĩa |
|---------------|------------|---------|
| 1 beep | 200ms | Thẻ hợp lệ, mở cửa thành công |
| 2 beep | 200ms x2 | Khóa/mở khóa hệ thống |
| 3 beep | 150ms x3 | Thẻ không hợp lệ hoặc quét khi khóa |

## Build & Upload

```bash
# Build
pio run

# Upload lên STM32
pio run --target upload

# Monitor Serial (debug qua UART3)
pio device monitor -b 9600
```

## Debug Log

Kết nối UART3 (PB10-TX) với USB-Serial adapter (9600 baud) để xem:

```
=== STM32 SmartDoor System ===
Initializing...
[LCD] Xin chao!
[LCD] Cua dang dong...
[Motor] Door fully closed
[LCD] Moi quet the...
[Motor] Door fully opened
[Motor] Auto-close scheduled in 5 seconds
```

## Troubleshooting

### RFID không đọc được thẻ
- Kiểm tra kết nối SPI (PA4-SS, PA5-SCK, PA6-MISO, PA7-MOSI, PA3-RST)
- Kiểm tra nguồn 3.3V cho MFRC522 (không dùng 5V!)
- Thử thẻ khác hoặc đưa thẻ gần hơn (< 5cm)
- Kiểm tra thư viện MFRC522 đã cài đặt

### LCD không hiển thị
- Kiểm tra kết nối I2C (PB6-SCL, PB7-SDA)
- Kiểm tra địa chỉ I2C: thử 0x27 hoặc 0x3F
- Dùng I2C scanner để tìm địa chỉ đúng
- Kiểm tra nguồn 5V cho LCD
- Điều chỉnh biến trở contrast trên LCD

### Motor không chạy
- Kiểm tra kết nối driver (PB0-IN1, PB1-IN2, PA8-ENA)
- Kiểm tra nguồn motor driver (12V riêng, không dùng chung STM32)
- Kiểm tra PWM trên PA8 (dùng oscilloscope hoặc LED)
- Thử tăng giá trị PWM trong code (hiện tại 150/255)
- Kiểm tra motor driver không bị hỏng

### Limit switch không hoạt động
- Kiểm tra kết nối PC13 (open), PC14 (close)
- Kiểm tra INPUT_PULLUP: đọc HIGH khi không chạm, LOW khi chạm
- Dùng multimeter kiểm tra switch đóng/mở
- Xem log Serial3 để kiểm tra giá trị đọc được

### ESP32 không nhận được message
- Kiểm tra kết nối UART:
  - STM32 TX (PA9) → ESP32 RX (GPIO16)
  - STM32 RX (PA10) → ESP32 TX (GPIO17)
  - GND chung giữa STM32 và ESP32
- Kiểm tra baud rate: 115200 (cả 2 bên)
- Xem log trên Serial3 (STM32) và Serial (ESP32)
- Thử swap TX/RX nếu không nhận được

## Lưu ý

- Board: `genericSTM32F103C8` (Blue Pill)
- Nguồn STM32: 5V qua USB hoặc 5V pin (tối thiểu 500mA)
- Motor cần nguồn riêng (12V), không dùng chung với STM32 (gây nhiễu và quá tải)
- Limit switches dùng INPUT_PULLUP (LOW = active)
- LCD I2C address: 0x27 (có thể khác, dùng I2C scanner)
- RFID dùng 3.3V (không dùng 5V sẽ hỏng module!)
- FreeRTOS scheduler tự động quản lý tasks
- Không dùng `loop()`, tất cả logic trong tasks
- GND phải chung giữa tất cả thiết bị
