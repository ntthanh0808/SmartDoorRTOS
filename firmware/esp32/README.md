# SmartDoor - ESP32 Firmware

Firmware cho ESP32, đóng vai trò cầu nối (bridge) giữa STM32 và Server qua WiFi/WebSocket.

## Tech Stack

- **PlatformIO** - Build system
- **WebSocketsClient** - Kết nối WebSocket tới server
- **ArduinoJson** - Xử lý JSON

## Vai trò trong hệ thống

```
STM32F103C8 ←── Serial (115200 baud) ──→ ESP32 ←── WebSocket ──→ Python Server
                                            │
                                          WiFi
```

ESP32 không xử lý logic nghiệp vụ, chỉ chuyển tiếp (forward) và chuyển đổi giao thức:
- **STM32 → ESP32 → Server**: Đọc Serial2 (Plain Text), chuyển thành JSON, gửi lên WebSocket
- **Server → ESP32 → STM32**: Nhận WebSocket (JSON), chuyển thành Plain Text, gửi xuống Serial2

## Phần cứng kết nối

| Pin ESP32   | Kết nối         | Mô tả                  |
|-------------|-----------------|------------------------|
| GPIO 16 (RX)| STM32 TX (PA9) | Nhận dữ liệu từ STM32  |
| GPIO 17 (TX)| STM32 RX (PA10)| Gửi dữ liệu tới STM32  |
| GND         | STM32 GND      | Ground chung           |
| USB         | PC (debug)     | Serial Monitor 115200  |

## Cấu hình

Sửa trực tiếp trong `src/main.cpp`:

```cpp
// WiFi
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Server
const char* SERVER_HOST = "192.168.0.100";  // IP máy chạy Python server
const int SERVER_PORT = 8000;
const char* DEVICE_TOKEN = "esp32-secret-token";  // Khớp với config.py
```

## Giao thức chuyển đổi

### STM32 → Server (Plain Text → JSON)

| STM32 gửi | ESP32 chuyển thành JSON |
|-----------|-------------------------|
| `RFID:xxxxxxxx` | `{"event": "card_scanned", "card_uid": "xxxxxxxx"}` |
| `PIR:Motion` | `{"event": "motion_detected"}` |
| `Door:Opening` | `{"event": "door_status", "status": "opening"}` |
| `Door:Opened` | `{"event": "door_status", "status": "opened"}` |
| `Door:Closing` | `{"event": "door_status", "status": "closing"}` |
| `Door:Closed` | `{"event": "door_status", "status": "closed"}` |

### Server → STM32 (JSON → Plain Text)

| Server gửi | ESP32 chuyển thành |
|------------|-------------------|
| `{"action": "open_door", "name": "Tên"}` | `ALLOW:Tên` |
| `{"action": "deny"}` | `DENY` |
| `{"action": "close_door"}` | `CLOSE` |
| `{"action": "system_locked"}` | `LOCKED` |
| `{"action": "system_unlocked"}` | `UNLOCKED` |
| `{"action": "update_time", "time": "HH:MM:SS"}` | `TIME:HH:MM:SS` |

## Hoạt động

1. **Khởi động**: Kết nối WiFi → kết nối WebSocket tới `ws://SERVER_HOST:8000/ws/device?token=...`
2. **Nhận từ STM32** (Serial2): Đọc dòng Plain Text → chuyển thành JSON → gửi lên WebSocket
3. **Nhận từ Server** (WebSocket): Nhận JSON → chuyển thành Plain Text → gửi xuống STM32 qua Serial2
4. **Auto-reconnect**: WebSocket tự kết nối lại sau 5 giây. WiFi tự kết nối lại nếu mất.
5. **Keep-alive**: Gửi ping mỗi 30 giây để giữ kết nối

## Serial

| Serial   | Baud   | Mục đích                    |
|----------|--------|-----------------------------|
| Serial   | 115200 | Debug log (USB/Serial Monitor)|
| Serial2  | 115200 | Giao tiếp với STM32         |

## Build & Upload

```bash
# Build
pio run

# Upload lên ESP32
pio run --target upload

# Monitor Serial (debug)
pio device monitor
```

## Debug Log

Kết nối USB và mở Serial Monitor (115200 baud) để xem:

```
=================================
SmartDoor ESP32 Gateway
=================================
[Serial] STM32 communication initialized
[WiFi] Connecting to: MyWiFi
..........
[WiFi] Connected! IP: 192.168.0.50
[WiFi] Signal strength: -45 dBm
[WS] Attempting to connect to WebSocket server...
[WS] Server: 192.168.0.100:8000
[WS] Path: /ws/device?token=esp32-secret-token
[WS] Connected to server: ...
=================================
System ready!
=================================

[STM32] Received: RFID:AB12CD34
[WS] Sent JSON: {"event":"card_scanned","card_uid":"AB12CD34"}
[WS] Received JSON: {"action":"open_door","name":"Nguyen Van A"}
[STM32] Sent: ALLOW:Nguyen Van A
```

## Troubleshooting

### WiFi không kết nối được
- Kiểm tra SSID và password
- Kiểm tra tín hiệu WiFi đủ mạnh
- Thử reset ESP32 (nút EN)

### WebSocket không kết nối
- Kiểm tra `SERVER_HOST` (IP của máy chạy backend)
- Kiểm tra `SERVER_PORT` (mặc định 8000)
- Kiểm tra `DEVICE_TOKEN` khớp với `be/config.py`
- Đảm bảo backend server đang chạy
- Kiểm tra firewall không chặn port 8000
- Ping thử IP server từ máy khác trong cùng mạng

### STM32 không nhận được lệnh
- Kiểm tra kết nối UART:
  - ESP32 TX (GPIO17) → STM32 RX (PA10)
  - ESP32 RX (GPIO16) → STM32 TX (PA9)
  - GND chung giữa ESP32 và STM32
- Kiểm tra baud rate: 115200 (cả 2 bên)
- Dùng Serial Monitor để xem log `[STM32] Sent: ...`

### WebSocket bị disconnect liên tục
- Kiểm tra kết nối WiFi ổn định
- Kiểm tra backend server không bị crash
- Xem log backend để biết lý do disconnect
- Kiểm tra router không block WebSocket connections

## Lưu ý

- Board: `esp32doit-devkit-v1`. Nếu dùng board khác, sửa `board` trong `platformio.ini`.
- `DEVICE_TOKEN` phải khớp với giá trị `DEVICE_TOKEN` trong `be/config.py`.
- Baud rate STM32: 115200 (khác với Arduino Uno dùng 9600).
- ESP32 cần nguồn 5V ổn định (tối thiểu 500mA).
- Không dùng chung nguồn với motor (gây nhiễu).
- GND phải chung giữa ESP32 và STM32.
