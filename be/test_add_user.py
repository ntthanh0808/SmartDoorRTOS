"""
Script để thêm user test với card_uid
Chạy: python test_add_user.py
"""
from database import SessionLocal
from models.user import User
from services.auth_service import hash_password

def add_test_user():
    db = SessionLocal()
    try:
        # Kiểm tra xem user đã tồn tại chưa
        existing = db.query(User).filter(User.username == "test_user").first()
        if existing:
            print(f"User 'test_user' đã tồn tại với card_uid: {existing.card_uid}")
            return
        
        # Tạo user mới
        user = User(
            username="test_user",
            password_hash=hash_password("123456"),
            full_name="Nguyen Van Test",
            role="user",
            card_uid="ABC123",  # Thay bằng card_uid thực tế của bạn
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"✓ Đã tạo user: {user.full_name}")
        print(f"  Username: {user.username}")
        print(f"  Password: 123456")
        print(f"  Card UID: {user.card_uid}")
        
    except Exception as e:
        print(f"✗ Lỗi: {e}")
        db.rollback()
    finally:
        db.close()

def list_all_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("\n=== DANH SÁCH USER ===")
        for user in users:
            print(f"- {user.full_name} ({user.username})")
            print(f"  Card UID: {user.card_uid or 'Chưa có'}")
            print(f"  Active: {user.is_active}")
            print()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_user()
    list_all_users()
