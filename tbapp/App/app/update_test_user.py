import sys
import os

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

def update_test_user():
    app = create_app()
    with app.app_context():
        # Update test@example.com
        user = User.query.filter_by(email='test@example.com').first()
        if user:
            print(f"Updating password for {user.email}")
            user.password = generate_password_hash('test123', method='pbkdf2:sha256')
            db.session.commit()
            print("Password updated successfully!")
        else:
            print("Test user not found, creating it...")
            from create_test_user import create_test_user
            create_test_user()
            
        # Also create a simple user 'admin@gmail.com' with password 'admin123'
        admin = User.query.filter_by(email='admin@gmail.com').first()
        if not admin:
            print("Creating admin@gmail.com")
            new_admin = User(
                email='admin@gmail.com',
                name='Admin User',
                password=generate_password_hash('admin123', method='pbkdf2:sha256'),
                is_verified=True,
                profile_complete=True
            )
            db.session.add(new_admin)
            db.session.commit()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists, updating password.")
            admin.password = generate_password_hash('admin123', method='pbkdf2:sha256')
            db.session.commit()

if __name__ == '__main__':
    update_test_user()
