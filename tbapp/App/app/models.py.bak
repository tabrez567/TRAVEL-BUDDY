from flask_login import UserMixin
from datetime import datetime
from app import db

class User(UserMixin, db.Model):
    """User model"""
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_verified = db.Column(db.Boolean, default=False)
    profile_complete = db.Column(db.Boolean, default=False)
    
    # Profile details
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    occupation = db.Column(db.String(100))
    interests = db.Column(db.Text)
    profile_picture = db.Column(db.String(200))
    
    # Preferences
    preferred_age_min = db.Column(db.Integer, default=18)
    preferred_age_max = db.Column(db.Integer, default=99)
    preferred_gender = db.Column(db.String(20))
    preferred_location = db.Column(db.String(100))
    
    # Subscription details
    subscription_type = db.Column(db.String(20), default='basic')
    subscription_end = db.Column(db.DateTime)
    credits = db.Column(db.Integer, default=0)
    
    # Relationships
    matches = db.relationship('Match', foreign_keys='Match.user_id', backref='user', lazy=True)
    liked_by = db.relationship('Match', foreign_keys='Match.matched_user_id', backref='matched_user', lazy=True)
    messages_sent = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy=True)
    messages_received = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy=True)

class Match(db.Model):
    """Match model to track user matches"""
    __tablename__ = 'user_matches'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    matched_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    liked = db.Column(db.Boolean, default=False)
    super_liked = db.Column(db.Boolean, default=False)
    matched = db.Column(db.Boolean, default=False)
    matched_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique matches and allow table extension
    __table_args__ = (
        db.UniqueConstraint('user_id', 'matched_user_id', name='unique_match'),
        {'extend_existing': True}
    )

class Message(db.Model):
    """Message model for user chats"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship for quick access to conversation participants
    conversation = db.relationship('Conversation', backref='messages', lazy=True)

class Conversation(db.Model):
    """Conversation model to track message threads"""
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    last_message_id = db.Column(db.Integer, db.ForeignKey('messages.id'))
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    unread_count = db.Column(db.Integer, default=0)
    
    # Ensure unique conversations
    __table_args__ = (db.UniqueConstraint('user1_id', 'user2_id', name='unique_conversation'),)