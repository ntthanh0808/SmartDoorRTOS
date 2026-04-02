import json
from datetime import datetime, timezone, timedelta
from fastapi import WebSocket

# Connected ESP32 device
device_connection: WebSocket | None = None

# Múi giờ Việt Nam (UTC+7)
VIETNAM_TZ = timezone(timedelta(hours=7))


def set_device(ws: WebSocket | None):
    global device_connection
    device_connection = ws


async def send_to_device(message: dict):
    global device_connection
    print(f"[Door Service] Attempting to send: {message}")
    print(f"[Door Service] Device connected: {device_connection is not None}")
    
    if device_connection:
        try:
            json_str = json.dumps(message)
            await device_connection.send_text(json_str)
            print(f"[Door Service] Successfully sent: {json_str}")
        except Exception as e:
            print(f"[Door Service] Error sending message: {e}")
    else:
        print("[Door Service] No device connected!")


async def command_open_door(name: str = ""):
    await send_to_device({"action": "open_door", "name": name})


async def command_close_door():
    await send_to_device({"action": "close_door"})


async def command_system_locked():
    await send_to_device({"action": "system_locked"})
    # Gửi thời gian hiện tại
    current_time = datetime.now(VIETNAM_TZ).strftime("%H:%M:%S")
    await send_to_device({"action": "update_time", "time": current_time})


async def command_system_unlocked():
    await send_to_device({"action": "system_unlocked"})


async def send_time_update():
    """Gửi cập nhật thời gian cho STM32 (dùng khi hệ thống bị khóa)"""
    current_time = datetime.now(VIETNAM_TZ).strftime("%H:%M:%S")
    await send_to_device({"action": "update_time", "time": current_time})
