import sys
import os

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

def update_db(use_dummy=False):
    db_name = "DUMMY" if use_dummy else "REAL"
    print(f"\n--- Updating {db_name} Database ---")
    app = create_app(use_dummy_db=use_dummy)
    with app.app_context():
        users_to_fix = [
            ('test@example.com', 'test123', 'Test User'),
            ('admin@gmail.com', 'admin123', 'Admin User')
        ]
        
        for email, password, name in users_to_fix:
            user = User.query.filter_by(email=email).first()
            if user:
                print(f"Updating password for {email}")
                user.password = generate_password_hash(password, method='pbkdf2:sha256')
            else:
                print(f"Creating user {email}")
                user = User(
                    email=email,
                    name=name,
                    password=generate_password_hash(password, method='pbkdf2:sha256'),
                    is_verified=True,
                    profile_complete=True
                )
                db.session.add(user)
            
            try:
                db.session.commit()
                print(f"Success for {email}")
            except Exception as e:
                print(f"Error for {email}: {e}")
                db.session.rollback()

if __name__ == '__main__':
    update_db(use_dummy=False)
    update_db(use_dummy=True)
