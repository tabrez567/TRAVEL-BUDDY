#!/usr/bin/env python3
"""Simple database initialization script"""

import os
import sys

# Add the current directory to sys.path to find our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app, db

def init_database():
    """Initialize the database with all tables"""
    print("Initializing database...")
    
    # Create the application
    app = create_app()
    
    with app.app_context():
        try:
            # Drop all tables and recreate them
            print("Dropping existing tables...")
            db.drop_all()
            
            print("Creating new tables...")
            db.create_all()
            
            print("Database initialized successfully!")
            
            # Create a test user
            from models import User
            from werkzeug.security import generate_password_hash
            
            # Check if test user already exists
            existing_user = User.query.filter_by(email='test@example.com').first()
            if not existing_user:
                test_user = User(
                    email='test@example.com',
                    name='Test User',
                    password=generate_password_hash('testpassword'),
                    age=25,
                    gender='Other',
                    bio='Test user for the dating app',
                    location='Test City'
                )
                db.session.add(test_user)
                db.session.commit()
                print("Test user created: test@example.com / testpassword")
            else:
                print("Test user already exists: test@example.com")
                
        except Exception as e:
            print(f"Error initializing database: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    init_database()