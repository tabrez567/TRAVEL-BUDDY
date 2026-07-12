import os
import sys
import shutil

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from __init__ import create_app
from extensions import db
from models import User, Match, Message, Conversation, UserPreference
from werkzeug.security import generate_password_hash
from datetime import datetime

def initialize_database():
    """Initialize the database with tables and sample data"""
    print("Initializing database...")
    
    # Create the application
    app = create_app()
    
    with app.app_context():
        # Check if database file exists and remove it
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if os.path.exists(db_path):
            print(f"Removing existing database file: {db_path}")
            try:
                # Close any open connections
                db.session.remove()
                db.engine.dispose()
                # Remove the file
                os.remove(db_path)
            except Exception as e:
                print(f"Error removing database file: {e}")
                # Try to close the connection and remove again
                try:
                    db.session.close()
                    db.engine.dispose()
                    if os.path.exists(db_path):
                        os.remove(db_path)
                except Exception as e2:
                    print(f"Still couldn't remove database file: {e2}")
                    print("Trying to move it instead...")
                    try:
                        # Try to move the file instead
                        backup_path = f"{db_path}.bak"
                        shutil.move(db_path, backup_path)
                        print(f"Moved database to {backup_path}")
                    except Exception as e3:
                        print(f"Failed to move database: {e3}")
                        print("Continuing anyway...")
        
        # Create all tables
        print("Creating tables...")
        db.create_all()
        
        # Create a test user
        print("Creating test user...")
        test_user = User(
            email="test@example.com",
            name="Test User",
            password=generate_password_hash("password", method='sha256'),
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            is_verified=True,
            profile_complete=True,
            age=25,
            gender="Male",
            bio="This is a test user for the dating app.",
            location="New York",
            occupation="Software Developer",
            profile_picture="default.jpg"
        )
        
        # Create another test user for matching
        test_user2 = User(
            email="match@example.com",
            name="Match User",
            password=generate_password_hash("password", method='sha256'),
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            is_verified=True,
            profile_complete=True,
            age=24,
            gender="Female",
            bio="This is another test user for matching.",
            location="New York",
            occupation="Designer",
            profile_picture="default.jpg"
        )
        
        db.session.add(test_user)
        db.session.add(test_user2)
        db.session.commit()
        
        # Create a match between the users
        match = Match(
            user_id=test_user.id,
            matched_user_id=test_user2.id,
            liked=True,
            matched=True,
            matched_at=datetime.utcnow()
        )
        
        db.session.add(match)
        db.session.commit()
        
        # Create a conversation
        conversation = Conversation(
            user1_id=test_user.id,
            user2_id=test_user2.id,
            last_message_at=datetime.utcnow()
        )
        
        db.session.add(conversation)
        db.session.commit()
        
        # Add a message
        message = Message(
            sender_id=test_user.id,
            receiver_id=test_user2.id,
            content="Hello! Nice to meet you!",
            created_at=datetime.utcnow()
        )
        
        db.session.add(message)
        db.session.commit()
        
        print("Database initialization complete!")
        print("Test users created:")
        print("  - Email: test@example.com, Password: password")
        print("  - Email: match@example.com, Password: password")

if __name__ == "__main__":
    initialize_database()