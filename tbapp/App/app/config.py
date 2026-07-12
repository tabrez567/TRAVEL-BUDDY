import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    IS_DUMMY_DATABASE = False
    
    # MongoDB configuration for chat messages
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/'
    MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME') or 'travel_buddy_chat'
    
    # OpenAI configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # File upload configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(basedir, 'static', 'uploads')
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # OAuth Configuration
    GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
    GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')
    
    FACEBOOK_OAUTH_CLIENT_ID = os.environ.get('FACEBOOK_OAUTH_CLIENT_ID')
    FACEBOOK_OAUTH_CLIENT_SECRET = os.environ.get('FACEBOOK_OAUTH_CLIENT_SECRET')
    
    TWITTER_OAUTH_CLIENT_ID = os.environ.get('TWITTER_OAUTH_CLIENT_ID')
    TWITTER_OAUTH_CLIENT_SECRET = os.environ.get('TWITTER_OAUTH_CLIENT_SECRET')

class DummyConfig(Config):
    """Configuration for dummy data and testing"""
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'dummy_app.db')
    IS_DUMMY_DATABASE = True
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # Chat configuration
    CHAT_MESSAGES_PER_PAGE = 50
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/'
    MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME') or 'travel_buddy_chat'
    
    # OpenAI configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # Matching algorithm configuration
    MATCH_THRESHOLD = 0.7  # 70% compatibility threshold
    
    # Travel Buddy specific configuration
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
    
    # Safety and security settings
    ENABLE_LOCATION_TRACKING = True
    SAFETY_CHECK_INTERVAL = 24  # hours
    EMERGENCY_CONTACT_REQUIRED = True
    
    # Travel matching algorithm settings
    TRAVEL_COMPATIBILITY_WEIGHTS = {
        'destination': 0.3,
        'travel_dates': 0.25,
        'budget': 0.2,
        'travel_style': 0.15,
        'interests': 0.1
    }
    
    # Subscription plans for Travel Buddy
    SUBSCRIPTION_PLANS = {
        'basic': {
            'price': 0, 
            'features': ['basic_matching', 'limited_messages', 'basic_safety_features'],
            'description': 'Perfect for occasional travelers'
        },
        'premium': {
            'price': 19.99, 
            'features': ['unlimited_matching', 'unlimited_messages', 'advanced_safety', 'priority_support', 'trip_planning_tools'],
            'description': 'Ideal for regular travelers'
        },
        'vip': {
            'price': 39.99, 
            'features': ['unlimited_matching', 'unlimited_messages', 'advanced_safety', 'priority_support', 'trip_planning_tools', 'ai_recommendations', 'emergency_support'],
            'description': 'Best for frequent travelers and digital nomads'
        }
    }