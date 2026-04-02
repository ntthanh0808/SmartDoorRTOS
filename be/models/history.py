from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from datetime import datetime, timezone, timedelta

from database import Base

# Múi giờ Việt Nam (UTC+7)
VIETNAM_TZ = timezone(timedelta(hours=7))


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  # "open", "close"
    method = Column(String, nullable=False)  # "rfid", "web"
    card_uid = Column(String, nullable=True)
    success = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(VIETNAM_TZ))
