from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from database import Base


class SystemState(Base):
    __tablename__ = "system_state"

    id = Column(Integer, primary_key=True, default=1)
    is_locked = Column(Boolean, default=False)
    door_status = Column(String, default="closed")  # opened, opening, closed, closing
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
