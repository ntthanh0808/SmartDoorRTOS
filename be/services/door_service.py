import json
from fastapi import WebSocket

# Connected ESP32 device
device_connection: WebSocket | None = None


def set_device(ws: WebSocket | None):
    global device_connection
    device_connection = ws


async def send_to_device(message: dict):
    if device_connection:
        await device_connection.send_text(json.dumps(message))


async def command_open_door():
    await send_to_device({"action": "open_door"})


async def command_close_door():
    await send_to_device({"action": "close_door"})


async def command_system_locked():
    await send_to_device({"action": "system_locked"})


async def command_system_unlocked():
    await send_to_device({"action": "system_unlocked"})
