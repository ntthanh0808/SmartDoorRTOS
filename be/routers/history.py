from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.history import History
from models.user import User
from schemas.history import HistoryResponse
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=list[HistoryResponse])
def get_history(
    method: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(History).order_by(History.timestamp.desc())
    if method:
        query = query.filter(History.method == method)
    rows = query.limit(limit).all()

    result = []
    for h in rows:
        user = db.query(User).filter(User.id == h.user_id).first() if h.user_id else None
        result.append(
            HistoryResponse(
                id=h.id,
                user_id=h.user_id,
                user_name=user.full_name if user else None,
                action=h.action,
                method=h.method,
                card_uid=h.card_uid,
                success=h.success,
                timestamp=h.timestamp,
            )
        )
    return result
