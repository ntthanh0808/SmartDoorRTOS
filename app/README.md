# SmartDoor Mobile App

Ứng dụng di động React Native (Expo) để điều khiển và giám sát hệ thống cửa thông minh.

## Công nghệ

- React Native 0.81.5
- Expo ~54.0.0
- React Navigation 7.0.0
- Axios - HTTP client
- WebSocket - Kết nối realtime
- Expo Secure Store - Lưu trữ token

## Yêu cầu

- Node.js 18+
- npm hoặc yarn
- Expo Go app (testing)
- Android Studio / Xcode (build native)

## Cài đặt

```bash
cd app
npm install
```

## Cấu hình

Chỉnh sửa `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP:8000/api",
      "wsUrl": "ws://YOUR_IP:8000/ws"
    }
  }
}
```

## Chạy ứng dụng

```bash
# Development
npm start

# Android
npm run android

# iOS
npm run ios
```

## Cấu trúc

```
app/
├── src/
│   ├── api/              # Axios config
│   ├── components/       # Components
│   ├── context/          # React Context
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # Navigation
│   ├── screens/          # Screens
│   └── utils/            # Utilities
├── App.jsx
├── index.js
└── app.json
```

## Tính năng

### Admin
- Dashboard: Điều khiển cửa, khóa hệ thống
- Quản lý người dùng
- Lịch sử mở cửa
- Thông báo realtime

### User
- Điều khiển cửa
- Xem trạng thái realtime
- Đồng hồ thời gian

### Chung
- Pull-to-refresh
- WebSocket realtime
- Auto-reconnect
- JWT authentication

## Trạng thái cửa

- Đã mở (xanh) - Countdown 5s
- Đang mở (vàng, nhấp nháy)
- Đã đóng (xám)
- Đang đóng (vàng, nhấp nháy)

## License

MIT
