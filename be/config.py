import os

SECRET_KEY = os.getenv("SECRET_KEY", "smartdoor-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartdoor.db")

DEVICE_TOKEN = os.getenv("DEVICE_TOKEN", "esp32-secret-token")
