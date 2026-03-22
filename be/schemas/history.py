from pydantic import BaseModel
from datetime import datetime


class HistoryResponse(BaseModel):
    id: int
    user_id: int | None
    user_name: str | None = None
    action: str
    method: str
    card_uid: str | None
    success: bool
    timestamp: datetime

    model_config = {"from_attributes": True}
