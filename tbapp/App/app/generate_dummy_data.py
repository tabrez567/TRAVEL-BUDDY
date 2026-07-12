import sys
import os
from flask import Flask

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DummyConfig
from utils.faker_data import generate_dummy_users, generate_dummy_matches, \
    generate_dummy_conversations_and_messages, generate_dummy_preferences
from models import db

def setup_dummy_database():
    """Setup and populate the dummy database"""
    # Create minimal Flask app with dummy config
    app = Flask(__name__)
    app.config.from_object(DummyConfig)
    
    # Initialize database
    db.init_app(app)
    
    with app.app_context():
        # Create all tables in dummy database
        db.create_all()
        
        print("Generating dummy users...")
        users = generate_dummy_users()
        db.session.add_all(users)
        db.session.commit()
        
        print("Generating dummy matches...")
        matches = generate_dummy_matches(users)
        db.session.add_all(matches)
        db.session.commit()
        
        print("Generating dummy conversations and messages...")
        conversations, messages = generate_dummy_conversations_and_messages(matches)
        db.session.add_all(conversations)
        db.session.add_all(messages)
        db.session.commit()
        
        print("Generating dummy preferences...")
        preferences = generate_dummy_preferences(users)
        db.session.add_all(preferences)
        db.session.commit()
        
        print("\nDummy database populated successfully!")
        print(f"Created {len(users)} users")
        print(f"Created {len(matches)} matches")
        print(f"Created {len(conversations)} conversations")
        print(f"Created {len(messages)} messages")
        print(f"Created {len(preferences)} preferences")

if __name__ == '__main__':
    setup_dummy_database()