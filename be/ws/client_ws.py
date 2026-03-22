from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from services.auth_service import decode_token
from services.notification import client_connections

router = APIRouter()


@router.websocket("/ws/client")
async def client_websocket(ws: WebSocket, token: str = Query("")):
    payload = decode_token(token)
    if payload is None:
        await ws.close(code=4001, reason="Invalid token")
        return

    await ws.accept()
    client_connections.append(ws)

    try:
        while True:
            await ws.receive_text()  # keep alive
    except WebSocketDisconnect:
        if ws in client_connections:
            client_connections.remove(ws)
