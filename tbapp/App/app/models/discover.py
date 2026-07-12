from datetime import datetime

# Import db from app package
from app import db

class UserPreference(db.Model):
    """User preferences for matching"""
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Gender preferences
    interested_in_men = db.Column(db.Boolean, default=False)
    interested_in_women = db.Column(db.Boolean, default=False)
    interested_in_nonbinary = db.Column(db.Boolean, default=False)
    
    # Age preferences
    min_age = db.Column(db.Integer, default=18)
    max_age = db.Column(db.Integer, default=99)
    
    # Distance preferences (in miles/km)
    max_distance = db.Column(db.Integer, default=50)
    
    # Relationship type preferences
    seeking_relationship = db.Column(db.Boolean, default=True)
    seeking_casual = db.Column(db.Boolean, default=False)
    seeking_friendship = db.Column(db.Boolean, default=False)
    
    # Other preferences
    show_verified_only = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('preferences', uselist=False))
    
    def __repr__(self):
        return f'<UserPreference {self.id} for user {self.user_id}>'


class UserAction(db.Model):
    """User actions on other profiles (like/pass)"""
    __tablename__ = 'user_actions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    target_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(20), nullable=False)  # 'like', 'pass', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='actions_performed')
    target_user = db.relationship('User', foreign_keys=[target_user_id], backref='actions_received')
    
    def __repr__(self):
        return f'<UserAction {self.id}: {self.user_id} {self.action_type} {self.target_user_id}>'


# Match model is now imported from parent models.py to avoid table redefinition