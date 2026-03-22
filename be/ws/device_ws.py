import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from database import SessionLocal
from models.user import User
from models.history import History
from models.system_state import SystemState
from services.door_service import set_device, send_to_device
from services.notification import notify_door_status, notify_alert
from config import DEVICE_TOKEN

router = APIRouter()


def get_system_state(db: Session) -> SystemState:
    state = db.query(SystemState).first()
    if not state:
        state = SystemState(id=1)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


@router.websocket("/ws/device")
async def device_websocket(ws: WebSocket, token: str = Query("")):
    if token != DEVICE_TOKEN:
        await ws.close(code=4001, reason="Invalid token")
        return

    await ws.accept()
    set_device(ws)

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            event = msg.get("event")

            db = SessionLocal()
            try:
                if event == "card_scanned":
                    await handle_card_scanned(db, msg.get("card_uid", ""))
                elif event == "door_status":
                    status = msg.get("status", "closed")
                    state = get_system_state(db)
                    state.door_status = status
                    db.commit()
                    await notify_door_status(status)
                elif event == "motion_detected":
                    await notify_alert("Phát hiện chuyển động tại cửa!", "motion")
            finally:
                db.close()

    except WebSocketDisconnect:
        set_device(None)


async def handle_card_scanned(db: Session, card_uid: str):
    state = get_system_state(db)

    if state.is_locked:
        history = History(action="open", method="rfid", card_uid=card_uid, success=False)
        db.add(history)
        db.commit()
        await notify_alert(f"Quét thẻ {card_uid} nhưng hệ thống đang khóa", "alert")
        await send_to_device({"action": "deny", "reason": "locked", "name": ""})
        return

    user = db.query(User).filter(User.card_uid == card_uid, User.is_active == True).first()

    if user:
        history = History(user_id=user.id, action="open", method="rfid", card_uid=card_uid, success=True)
        db.add(history)
        db.commit()
        await send_to_device({"action": "open_door", "name": user.full_name})
        await notify_alert(f"{user.full_name} đã mở cửa bằng thẻ RFID", "access")
    else:
        history = History(action="open", method="rfid", card_uid=card_uid, success=False)
        db.add(history)
        db.commit()
        await send_to_device({"action": "deny", "reason": "invalid", "name": ""})
        await notify_alert(f"Quét thẻ không hợp lệ: {card_uid}", "alert")
