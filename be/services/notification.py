import json
from fastapi import WebSocket

# Connected frontend clients
client_connections: list[WebSocket] = []


async def broadcast_to_clients(message: dict):
    data = json.dumps(message, ensure_ascii=False)
    disconnected = []
    for ws in client_connections:
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        client_connections.remove(ws)


async def notify_door_status(status: str):
    await broadcast_to_clients({"type": "door_status", "status": status})


async def notify_system_state(is_locked: bool):
    await broadcast_to_clients({"type": "system_state", "is_locked": is_locked})


async def notify_alert(message: str, category: str = "access"):
    await broadcast_to_clients({"type": "notification", "message": message, "category": category})
