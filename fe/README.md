# SmartDoor - Frontend

Giao diện web cho hệ thống khóa cửa thông minh.

## Tech Stack

- **React 19** - UI framework
- **Vite 8** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 7** - Điều hướng
- **Axios** - HTTP client
- **WebSocket** (native) - Cập nhật real-time

## Cấu trúc thư mục

```
fe/src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router setup
├── index.css                   # Tailwind import
├── api/
│   └── axios.js                # Axios instance + JWT interceptor
├── context/
│   └── AuthContext.jsx          # Auth state (login/logout/user)
├── hooks/
│   └── useWebSocket.js          # WebSocket real-time hook
├── pages/
│   ├── LoginPage.jsx            # Đăng nhập
│   ├── DashboardPage.jsx        # Admin: trạng thái + điều khiển + thông báo
│   ├── UsersPage.jsx            # Admin: CRUD người dùng
│   ├── HistoryPage.jsx          # Admin: lịch sử mở cửa
│   └── UserHomePage.jsx         # User: trạng thái + mở cửa
├── components/
│   ├── Navbar.jsx               # Thanh điều hướng
│   ├── ProtectedRoute.jsx       # Route guard (auth + role)
│   ├── DoorStatus.jsx           # Hiển thị trạng thái cửa
│   ├── DoorControl.jsx          # Nút mở/đóng cửa
│   ├── SystemLock.jsx           # Toggle khóa hệ thống
│   ├── NotificationList.jsx     # Danh sách thông báo real-time
│   ├── UserTable.jsx            # Bảng người dùng
│   ├── UserForm.jsx             # Form thêm/sửa người dùng
│   └── HistoryTable.jsx         # Bảng lịch sử
└── utils/
    ├── constants.js             # API_URL, WS_URL
    └── jwt.js                   # Decode JWT token
```

## Cài đặt & Chạy

```bash
cd fe
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

## Build production

```bash
npm run build
```

Output nằm trong thư mục `dist/`.

## Các trang

| Path         | Component      | Vai trò | Mô tả                                    |
|--------------|----------------|---------|-------------------------------------------|
| `/login`     | LoginPage      | Public  | Form đăng nhập                            |
| `/dashboard` | DashboardPage  | Admin   | Trạng thái cửa, điều khiển, thông báo    |
| `/users`     | UsersPage      | Admin   | Quản lý người dùng + thẻ RFID            |
| `/history`   | HistoryPage    | Admin   | Lịch sử mở/đóng cửa (có filter)         |
| `/home`      | UserHomePage   | User    | Xem trạng thái + mở cửa                  |

## Tính năng real-time

Frontend kết nối WebSocket tới server (`/ws/client`) để nhận:
- Trạng thái cửa (mở/đóng) cập nhật tức thì
- Thông báo: có người mở cửa, quét thẻ sai, phát hiện chuyển động
- Trạng thái khóa hệ thống

WebSocket tự động reconnect sau 3 giây nếu mất kết nối.

## Proxy

Vite dev server proxy các request `/api/*` và `/ws/*` tới backend `http://localhost:8000` (cấu hình trong `vite.config.js`).
