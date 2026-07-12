import sys
import os

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

def fix_all():
    for use_dummy in [False, True]:
        app = create_app(use_dummy_db=use_dummy)
        with app.app_context():
            users = [
                ('test@example.com', 'test123', 'Test User'),
                ('admin@gmail.com', 'admin123', 'Admin User'),
                ('tabrez@gmail.com', 'tabrez123', 'tabrez')
            ]
            for email, password, name in users:
                user = User.query.filter_by(email=email).first()
                if user:
                    user.password = generate_password_hash(password, method='pbkdf2:sha256')
                else:
                    user = User(email=email, name=name, password=generate_password_hash(password, method='pbkdf2:sha256'))
                db.session.add(user)
            db.session.commit()
    print("Done fixing users in both DBs.")

if __name__ == '__main__':
    fix_all()
