#!/usr/bin/env python3
"""
Script to create a test user for testing the login functionality
"""
import sys
import os

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User
from mongodb_models import mongo_create_user, mongo_get_user_by_email
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_test_user():
    """Create a test user for login testing"""
    app = create_app()
    
    with app.app_context():
        # Check if test user already exists in MongoDB
        mongo_user = mongo_get_user_by_email('test@example.com')
        existing_user = User.query.filter_by(email='test@example.com').first()
        
        if mongo_user and existing_user:
            print("Test user already exists in both DBs!")
            print(f"Email: test@example.com")
            print(f"Password: test123")
            return
        
        # Create user in MongoDB
        try:
            mongo_create_user(
                email='test@example.com',
                name='Test User',
                password='test123', # mongo_create_user hashes it
                is_verified=True,
                profile_complete=True
            )
            print("Test user created in MongoDB.")
        except Exception as e:
            print(f"Error creating user in MongoDB: {e}")

        # Create test user in SQL
        test_user = User(
            email='test@example.com',
            name='Test User',
            password='STORED_IN_MONGODB',
            created_at=datetime.utcnow(),
            last_login=None,
            age=25,
            gender='other',
            bio='I am a test user for debugging purposes.',
            location='Test City',
            occupation='Software Tester',
            interests='Testing, Debugging, Technology',
            looking_for='friendship',
            is_verified=True,
            profile_complete=True
        )
        
        try:
            db.session.add(test_user)
            db.session.commit()
            print("Test user created in SQLite!")
            print(f"Email: test@example.com")
            print(f"Password: test123")
        except Exception as e:
            print(f"Error creating test user in SQLite: {e}")
            db.session.rollback()

if __name__ == '__main__':
    create_test_user()