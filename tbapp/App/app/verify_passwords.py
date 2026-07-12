import sys
import os

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User
from mongodb_models import mongo_get_user_by_email
from werkzeug.security import check_password_hash

def verify_users():
    app = create_app()
    with app.app_context():
        users_to_check = [
            ('test@example.com', 'test123'),
            ('admin@gmail.com', 'admin123'),
            ('tabrez@gmail.com', 'tabrez123')
        ]
        
        print("\n--- MongoDB Password Verification ---")
        for email, password in users_to_check:
            user_data = mongo_get_user_by_email(email)
            if user_data:
                is_correct = check_password_hash(user_data['password'], password)
                print(f"User: {email}")
                print(f"Password provided: {password}")
                print(f"Credentials correct in MongoDB: {is_correct}")
                print("-----------------------------")
            else:
                print(f"User {email} NOT FOUND in MongoDB!")
                print("-----------------------------")

if __name__ == '__main__':
    verify_users()
