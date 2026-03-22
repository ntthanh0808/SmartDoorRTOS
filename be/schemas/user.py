from pydantic import BaseModel
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "user"
    card_uid: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    card_uid: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    card_uid: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
