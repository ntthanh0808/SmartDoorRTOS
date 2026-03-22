# SmartDoor - Backend

Server API cho hệ thống khóa cửa thông minh.

## Tech Stack

- **FastAPI** - Web framework
- **SQLAlchemy** - ORM (SQLite)
- **python-jose** - JWT authentication
- **passlib** - Bcrypt password hashing
- **WebSocket** - Giao tiếp real-time với ESP32 và Frontend

## Cấu trúc thư mục

```
be/
├── main.py              # Entry point, khởi tạo app + seed admin
├── config.py            # Cấu hình (SECRET_KEY, DB, DEVICE_TOKEN)
├── database.py          # SQLAlchemy engine + session
├── requirements.txt
├── models/
│   ├── user.py          # Bảng users
│   ├── history.py       # Bảng history
│   └── system_state.py  # Bảng system_state (singleton)
├── schemas/             # Pydantic request/response schemas
│   ├── auth.py
│   ├── user.py
│   └── history.py
├── routers/
│   ├── auth.py          # POST /api/auth/login
│   ├── users.py         # CRUD /api/users (admin)
│   ├── door.py          # /api/door/open|close|lock|unlock|status
│   └── history.py       # GET /api/history
├── services/
│   ├── auth_service.py  # JWT + password utilities
│   ├── door_service.py  # Gửi lệnh tới ESP32 qua WebSocket
│   └── notification.py  # Broadcast thông báo tới frontend
├── ws/
│   ├── device_ws.py     # WS /ws/device - endpoint cho ESP32
│   └── client_ws.py     # WS /ws/client - endpoint cho Frontend
└── middleware/
    └── auth_middleware.py  # JWT auth dependency
```

## Cài đặt & Chạy

```bash
cd be
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server chạy tại `http://localhost:8000`. Docs tại `http://localhost:8000/docs`.

## Tài khoản mặc định

| Username | Password   | Vai trò |
|----------|------------|---------|
| admin    | admin123   | admin   |

Tài khoản admin được tạo tự động khi khởi động lần đầu.

## API Endpoints

| Method | Path                | Auth   | Mô tả                     |
|--------|---------------------|--------|----------------------------|
| POST   | `/api/auth/login`   | -      | Đăng nhập, trả JWT        |
| GET    | `/api/users`        | Admin  | Danh sách người dùng      |
| POST   | `/api/users`        | Admin  | Tạo người dùng mới        |
| PUT    | `/api/users/{id}`   | Admin  | Sửa người dùng            |
| DELETE | `/api/users/{id}`   | Admin  | Xóa người dùng            |
| GET    | `/api/door/status`  | User+  | Trạng thái cửa hiện tại   |
| POST   | `/api/door/open`    | User+  | Mở cửa                    |
| POST   | `/api/door/close`   | User+  | Đóng cửa                  |
| POST   | `/api/door/lock`    | Admin  | Khóa hệ thống             |
| POST   | `/api/door/unlock`  | Admin  | Mở khóa hệ thống          |
| GET    | `/api/history`      | Admin  | Lịch sử mở/đóng cửa      |
| WS     | `/ws/device`        | Token  | WebSocket cho ESP32        |
| WS     | `/ws/client`        | JWT    | WebSocket cho Frontend     |

## WebSocket Protocol

### ESP32 → Server

```json
{"event": "card_scanned", "card_uid": "AB:CD:EF:12"}
{"event": "door_status", "status": "opened|opening|closed|closing"}
{"event": "motion_detected"}
```

### Server → ESP32

```json
{"action": "open_door", "name": "Nguyen Van A"}
{"action": "close_door"}
{"action": "deny", "reason": "invalid|locked"}
{"action": "system_locked"}
{"action": "system_unlocked"}
```

### Server → Frontend

```json
{"type": "door_status", "status": "opened|opening|closed|closing"}
{"type": "notification", "message": "...", "category": "access|alert|motion"}
{"type": "system_state", "is_locked": true|false}
```

## Database

SQLite, file `smartdoor.db` được tạo tự động. Gồm 3 bảng:

- **users** - Người dùng (username, password, role, card_uid)
- **history** - Lịch sử mở/đóng cửa
- **system_state** - Trạng thái hệ thống (khóa/mở, trạng thái cửa)

## Cấu hình

Sửa trong `config.py` hoặc đặt biến môi trường:

| Biến            | Mặc định                          | Mô tả                    |
|-----------------|------------------------------------|---------------------------|
| `SECRET_KEY`    | `smartdoor-secret-key-change-...`  | Khóa bí mật JWT          |
| `DATABASE_URL`  | `sqlite:///./smartdoor.db`         | Đường dẫn database        |
| `DEVICE_TOKEN`  | `esp32-secret-token`               | Token xác thực ESP32      |
