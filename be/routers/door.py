from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.history import History
from models.system_state import SystemState
from middleware.auth_middleware import get_current_user, require_admin
from services.door_service import command_open_door, command_close_door, command_system_locked, command_system_unlocked
from services.notification import notify_door_status, notify_system_state, notify_alert

router = APIRouter(prefix="/api/door", tags=["Door"])


def get_system_state(db: Session) -> SystemState:
    state = db.query(SystemState).first()
    if not state:
        state = SystemState(id=1)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


@router.get("/status")
def door_status(db: Session = Depends(get_db), _=Depends(get_current_user)):
    state = get_system_state(db)
    return {"door_status": state.door_status, "is_locked": state.is_locked}


@router.post("/open")
async def open_door(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    state = get_system_state(db)
    if state.is_locked:
        raise HTTPException(status_code=403, detail="Hệ thống đang khóa")
    await command_open_door()
    history = History(user_id=user.id, action="open", method="web", success=True)
    db.add(history)
    db.commit()
    await notify_alert(f"{user.full_name} đã mở cửa qua web", "access")
    return {"message": "Đã gửi lệnh mở cửa"}


@router.post("/close")
async def close_door(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    await command_close_door()
    history = History(user_id=user.id, action="close", method="web", success=True)
    db.add(history)
    db.commit()
    await notify_alert(f"{user.full_name} đã đóng cửa qua web", "access")
    return {"message": "Đã gửi lệnh đóng cửa"}


@router.post("/lock")
async def lock_system(db: Session = Depends(get_db), _=Depends(require_admin)):
    state = get_system_state(db)
    state.is_locked = True
    db.commit()
    await command_system_locked()
    await notify_system_state(True)
    return {"message": "Đã khóa hệ thống"}


@router.post("/unlock")
async def unlock_system(db: Session = Depends(get_db), _=Depends(require_admin)):
    state = get_system_state(db)
    state.is_locked = False
    db.commit()
    await command_system_unlocked()
    await notify_system_state(False)
    return {"message": "Đã mở khóa hệ thống"}
