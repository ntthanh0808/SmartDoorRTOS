from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
from models import User, History, SystemState
from services.auth_service import hash_password
from routers import auth, users, door, history
from ws import device_ws, client_ws

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartDoor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(door.router)
app.include_router(history.router)
app.include_router(device_ws.router)
app.include_router(client_ws.router)


@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Create default admin if not exists
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                full_name="Admin",
                role="admin",
            )
            db.add(admin)
            db.commit()
        # Create system state if not exists
        if not db.query(SystemState).first():
            db.add(SystemState(id=1))
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "SmartDoor API is running"}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "device_token": DEVICE_TOKEN,
        "websocket_endpoint": "/ws/device?token=esp32-secret-token"
    }
