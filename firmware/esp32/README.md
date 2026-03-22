# SmartDoor - ESP32 Firmware

Firmware cho ESP32, đóng vai trò cầu nối (bridge) giữa Arduino và Server qua WiFi/WebSocket.

## Tech Stack

- **PlatformIO** - Build system
- **WebSocketsClient** - Kết nối WebSocket tới server
- **ArduinoJson** - Xử lý JSON

## Vai trò trong hệ thống

```
Arduino Uno ←── Serial (9600 baud) ──→ ESP32 ←── WebSocket ──→ Python Server
                                          │
                                        WiFi
```

ESP32 không xử lý logic nghiệp vụ, chỉ chuyển tiếp (forward) message:
- **Arduino → ESP32 → Server**: Đọc Serial2, gửi lên WebSocket
- **Server → ESP32 → Arduino**: Nhận WebSocket, ghi xuống Serial2

## Phần cứng kết nối

| Pin ESP32   | Kết nối         | Mô tả                  |
|-------------|-----------------|--------------------------|
| GPIO 16 (RX)| Arduino TX (D1)| Nhận dữ liệu từ Arduino |
| GPIO 17 (TX)| Arduino RX (D0)| Gửi dữ liệu tới Arduino |
| USB          | PC (debug)     | Serial Monitor 115200    |

## Cấu hình

Sửa trực tiếp trong `src/main.cpp`:

```cpp
// WiFi
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Server
const char* SERVER_HOST = "192.168.1.100";  // IP máy chạy Python server
const int SERVER_PORT = 8000;
const char* DEVICE_TOKEN = "esp32-secret-token";  // Khớp với config.py
```

## Hoạt động

1. **Khởi động**: Kết nối WiFi → kết nối WebSocket tới `ws://SERVER_HOST:8000/ws/device?token=...`
2. **Nhận từ Arduino** (Serial2): Đọc dòng JSON → gửi lên WebSocket
3. **Nhận từ Server** (WebSocket): Nhận text → gửi xuống Arduino qua Serial2
4. **Auto-reconnect**: WebSocket tự kết nối lại sau 3 giây. WiFi tự kết nối lại nếu mất.

## Serial

| Serial   | Baud   | Mục đích                    |
|----------|--------|-----------------------------|
| Serial   | 115200 | Debug log (USB/Serial Monitor)|
| Serial2  | 9600   | Giao tiếp với Arduino Uno    |

## Build & Upload

```bash
cd firmware/esp32

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
SmartDoor ESP32 starting...
Connecting to WiFi: MyWiFi
......
WiFi connected! IP: 192.168.1.50
[WS] Connected to server
[Arduino] {"event":"card_scanned","card_uid":"AB:CD:EF:12"}
[WS] Received: {"action":"open_door","name":"Nguyen Van A"}
```

## Lưu ý

- Board: `pico32` (ESP32-PICO). Nếu dùng board khác (NodeMCU-32S, DevKitC...), sửa `board` trong `platformio.ini`.
- `DEVICE_TOKEN` phải khớp với giá trị `DEVICE_TOKEN` trong `be/config.py`.
- Nếu Arduino dùng baud rate khác 9600, sửa `Serial2.begin(9600, ...)` cho khớp.
