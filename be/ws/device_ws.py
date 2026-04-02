import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from database import SessionLocal
from models.user import User
from models.history import History
from models.system_state import SystemState
from services.door_service import set_device, send_to_device, send_time_update
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


async def time_update_task():
    """Task gửi thời gian mỗi giây khi hệ thống bị khóa"""
    while True:
        await asyncio.sleep(1)
        db = SessionLocal()
        try:
            state = get_system_state(db)
            if state.is_locked:
                await send_time_update()
        except Exception as e:
            print(f"[Time Update] Error: {e}")
        finally:
            db.close()


@router.websocket("/ws/device")
async def device_websocket(ws: WebSocket, token: str = Query("")):
    print(f"[Device WS] Connection attempt with token: {token}")
    
    if token != DEVICE_TOKEN:
        print(f"[Device WS] Invalid token! Expected: {DEVICE_TOKEN}, Got: {token}")
        await ws.close(code=4001, reason="Invalid token")
        return

    print("[Device WS] Token valid, accepting connection...")
    await ws.accept()
    set_device(ws)
    print("[Device WS] Device connected successfully!")

    # Start time update task
    time_task = asyncio.create_task(time_update_task())

    try:
        while True:
            data = await ws.receive_text()
            print(f"[Device WS] Received: {data}")
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
        print("[Device WS] Device disconnected")
        time_task.cancel()
        set_device(None)
    except Exception as e:
        print(f"[Device WS] Error: {e}")
        time_task.cancel()
        set_device(None)


async def handle_card_scanned(db: Session, card_uid: str):
    print(f"[Card Scan] Processing card: {card_uid}")
    state = get_system_state(db)
    print(f"[Card Scan] System locked: {state.is_locked}")

    if state.is_locked:
        print(f"[Card Scan] System is locked, denying access")
        history = History(action="open", method="rfid", card_uid=card_uid, success=False)
        db.add(history)
        db.commit()
        await notify_alert(f"Quét thẻ {card_uid} nhưng hệ thống đang khóa", "alert")
        await send_to_device({"action": "deny", "reason": "locked", "name": ""})
        print(f"[Card Scan] Sent DENY (locked) to device")
        return

    user = db.query(User).filter(User.card_uid == card_uid, User.is_active == True).first()
    print(f"[Card Scan] User found: {user.full_name if user else 'None'}")

    if user:
        print(f"[Card Scan] Valid card for user: {user.full_name}")
        history = History(user_id=user.id, action="open", method="rfid", card_uid=card_uid, success=True)
        db.add(history)
        db.commit()
        
        message = {"action": "open_door", "name": user.full_name}
        print(f"[Card Scan] Sending to device: {message}")
        await send_to_device(message)
        print(f"[Card Scan] Message sent successfully")
        
        await notify_alert(f"{user.full_name} đã mở cửa bằng thẻ RFID", "access")
    else:
        print(f"[Card Scan] Invalid card: {card_uid}")
        history = History(action="open", method="rfid", card_uid=card_uid, success=False)
        db.add(history)
        db.commit()
        
        message = {"action": "deny", "reason": "invalid", "name": ""}
        print(f"[Card Scan] Sending to device: {message}")
        await send_to_device(message)
        print(f"[Card Scan] Message sent successfully")
        
        await notify_alert(f"Quét thẻ không hợp lệ: {card_uid}", "alert")
