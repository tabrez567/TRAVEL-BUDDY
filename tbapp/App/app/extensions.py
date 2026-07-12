"""
Database and extension configuration
This module contains the database instance and login manager to avoid circular imports
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from pymongo import MongoClient
from bson import ObjectId

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
socketio = SocketIO()

# MongoDB client (will be initialized in create_app)
mongo_client = None
mongo_db = None

def init_mongodb(app):
    """Initialize MongoDB connection with graceful error handling"""
    global mongo_client, mongo_db
    try:
        # Use serverSelectionTimeoutMS for faster failure detection
        mongo_client = MongoClient(
            app.config['MONGODB_URI'],
            serverSelectionTimeoutMS=2000  # 2 second timeout
        )
        # Test connection
        mongo_client.server_info()
        mongo_db = mongo_client[app.config['MONGODB_DB_NAME']]
        # Create indexes for better performance
        mongo_db.messages.create_index([('conversation_id', 1), ('created_at', -1)])
        mongo_db.messages.create_index([('sender_id', 1), ('receiver_id', 1)])
        mongo_db.conversations.create_index([('participants', 1)])
        mongo_db.conversations.create_index([('last_message_at', -1)])
        
        # New indexes for enhanced features
        mongo_db.message_reactions.create_index([('message_id', 1), ('user_id', 1)])
        mongo_db.message_reactions.create_index([('created_at', -1)])
        mongo_db.user_status.create_index([('user_id', 1)])
        mongo_db.user_status.create_index([('is_online', 1), ('last_seen', -1)])
        mongo_db.typing_status.create_index([('conversation_id', 1)])
        mongo_db.typing_status.create_index([('started_at', 1)])
        
        print(f"[OK] MongoDB connected successfully to {app.config['MONGODB_DB_NAME']}")
        return True
    except Exception as e:
        print(f"[WARNING] MongoDB connection error: {e}")
        print(f"[WARNING] App will continue without MongoDB. Chat messages won't be persisted.")
        print(f"[WARNING] To enable MongoDB: Install MongoDB and ensure it's running on {app.config['MONGODB_URI']}")
        mongo_client = None
        mongo_db = None
        return False

def get_mongo_db():
    """Get MongoDB database instance"""
    return mongo_db