from flask_login import UserMixin
from datetime import datetime

# Import db and login_manager from extensions to avoid circular imports
from extensions import db, login_manager

class User(UserMixin, db.Model):
    """Travel Buddy User model"""
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
    
    # Basic Profile details
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    occupation = db.Column(db.String(100))
    interests = db.Column(db.Text)
    profile_picture = db.Column(db.String(200))
    
    # Travel-specific fields
    travel_style = db.Column(db.String(50))  # 'budget', 'luxury', 'backpacker', 'business', 'family'
    budget_range = db.Column(db.String(20))  # 'low', 'medium', 'high'
    preferred_destinations = db.Column(db.Text)  # JSON string of preferred countries/cities
    travel_interests = db.Column(db.Text)  # JSON string of interests like 'adventure', 'culture', 'food', etc.
    languages_spoken = db.Column(db.Text)  # JSON string of languages
    passport_country = db.Column(db.String(50))
    visa_requirements = db.Column(db.Text)  # JSON string of visa status for different countries
    
    # Travel preferences for matching
    preferred_travel_dates = db.Column(db.Text)  # JSON string of preferred travel periods
    group_size_preference = db.Column(db.String(20))  # 'solo', 'couple', 'small_group', 'large_group'
    accommodation_preference = db.Column(db.String(50))  # 'hostel', 'hotel', 'airbnb', 'camping'
    transportation_preference = db.Column(db.String(50))  # 'flight', 'train', 'bus', 'car', 'mixed'
    
    # Safety and verification
    is_verified_traveler = db.Column(db.Boolean, default=False)
    safety_score = db.Column(db.Float, default=0.0)
    emergency_contact = db.Column(db.String(200))
    medical_info = db.Column(db.Text)
    
    # Preferences for matching
    preferred_age_min = db.Column(db.Integer, default=18)
    preferred_age_max = db.Column(db.Integer, default=99)
    preferred_gender = db.Column(db.String(20))
    preferred_location = db.Column(db.String(100))
    
    # Subscription details
    subscription_type = db.Column(db.String(20), default='basic')
    subscription_end = db.Column(db.DateTime)
    credits = db.Column(db.Integer, default=0)

class Trip(db.Model):
    """Trip model for planned or ongoing trips"""
    __tablename__ = 'trips'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    destination = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    budget = db.Column(db.Float)
    travel_style = db.Column(db.String(50))
    group_size = db.Column(db.Integer, default=1)
    is_public = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(20), default='planning')  # 'planning', 'confirmed', 'ongoing', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='trips', lazy=True)
    participants = db.relationship('TripParticipant', backref='trip', lazy=True, cascade='all, delete-orphan')
    events = db.relationship('Event', backref='trip', lazy=True, cascade='all, delete-orphan')

class TripParticipant(db.Model):
    """Trip participants model"""
    __tablename__ = 'trip_participants'
    __table_args__ = (db.UniqueConstraint('trip_id', 'user_id', name='unique_trip_participant'), {'extend_existing': True})
    
    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), default='participant')  # 'organizer', 'participant', 'invited'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'declined'
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='trip_participations', lazy=True)

class Event(db.Model):
    """Event model for group activities and meetups"""
    __tablename__ = 'events'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=True)  # Optional - can be standalone event
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    event_date = db.Column(db.DateTime, nullable=False)
    duration_hours = db.Column(db.Float, default=2.0)
    max_participants = db.Column(db.Integer)
    cost_per_person = db.Column(db.Float, default=0.0)
    event_type = db.Column(db.String(50))  # 'meetup', 'tour', 'activity', 'meal', 'transport'
    is_public = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(20), default='active')  # 'active', 'cancelled', 'completed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organizer = db.relationship('User', backref='organized_events', lazy=True)
    participants = db.relationship('EventParticipant', backref='event', lazy=True, cascade='all, delete-orphan')

class EventParticipant(db.Model):
    """Event participants model"""
    __tablename__ = 'event_participants'
    __table_args__ = (db.UniqueConstraint('event_id', 'user_id', name='unique_event_participant'), {'extend_existing': True})
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'declined'
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='event_participations', lazy=True)

class Match(db.Model):
    """Travel Buddy Match model to track user matches"""
    __tablename__ = 'user_matches'
    __table_args__ = (db.UniqueConstraint('user_id', 'matched_user_id', name='unique_match'), {'extend_existing': True})
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    matched_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    liked = db.Column(db.Boolean, default=False)
    super_liked = db.Column(db.Boolean, default=False)
    matched = db.Column(db.Boolean, default=False)
    matched_at = db.Column(db.DateTime)
    compatibility_score = db.Column(db.Float, default=0.0)  # AI-calculated compatibility
    travel_compatibility = db.Column(db.Float, default=0.0)  # Travel-specific compatibility
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='matches_sent', lazy=True)
    matched_user = db.relationship('User', foreign_keys=[matched_user_id], backref='matches_received', lazy=True)

class Message(db.Model):
    """Message model for user chats"""
    __tablename__ = 'messages'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(50), default='text')  # text, location, trip_invitation, photo
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Travel-specific fields
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)
    attachment_url = db.Column(db.String(500), nullable=True)

class Conversation(db.Model):
    """Conversation model to track message threads"""
    __tablename__ = 'conversations'
    __table_args__ = (db.UniqueConstraint('user1_id', 'user2_id', name='unique_conversation'), {'extend_existing': True})
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    unread_count = db.Column(db.Integer, default=0)

class UserPreference(db.Model):
    """User preferences model"""
    __tablename__ = 'user_preferences'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    min_age = db.Column(db.Integer, default=18)
    max_age = db.Column(db.Integer, default=99)
    preferred_gender = db.Column(db.String(20))
    distance_radius = db.Column(db.Integer, default=50)  # in km/miles
    show_profile = db.Column(db.Boolean, default=True)

class ChatbotConversation(db.Model):
    """Chatbot conversation history model"""
    __tablename__ = 'chatbot_conversations'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)  # Conversation title/topic
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship to messages in this conversation
    messages = db.relationship('ChatbotMessage', backref='conversation', lazy=True, cascade='all, delete-orphan')
    
    # Relationship to user
    user = db.relationship('User', backref='chatbot_conversations', lazy=True)

class ChatbotMessage(db.Model):
    """Individual chatbot messages model"""
    __tablename__ = 'chatbot_messages'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('chatbot_conversations.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    is_command = db.Column(db.Boolean, default=False)  # True if message was a command
    command_executed = db.Column(db.Boolean, default=False)  # True if command was executed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to user
    user = db.relationship('User', backref='chatbot_messages', lazy=True)

class SafetyReport(db.Model):
    """Safety reports and incidents model"""
    __tablename__ = 'safety_reports'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reported_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    report_type = db.Column(db.String(50), nullable=False)  # 'harassment', 'inappropriate_behavior', 'fake_profile', 'safety_concern'
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'critical'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'investigating', 'resolved', 'dismissed'
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    # Relationships
    reporter = db.relationship('User', foreign_keys=[reporter_id], backref='reports_made', lazy=True)
    reported_user = db.relationship('User', foreign_keys=[reported_user_id], backref='reports_received', lazy=True)

class UserBlock(db.Model):
    """User blocking model for safety"""
    __tablename__ = 'user_blocks'
    __table_args__ = (db.UniqueConstraint('blocker_id', 'blocked_user_id', name='unique_block'), {'extend_existing': True})
    
    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    blocked_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    blocker = db.relationship('User', foreign_keys=[blocker_id], backref='blocked_users', lazy=True)
    blocked_user = db.relationship('User', foreign_keys=[blocked_user_id], backref='blocked_by', lazy=True)

class LocationCheck(db.Model):
    """Location check-ins for safety tracking"""
    __tablename__ = 'location_checks'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    location_name = db.Column(db.String(200))
    check_type = db.Column(db.String(20), default='manual')  # 'manual', 'automatic', 'emergency'
    is_safe = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='location_checks', lazy=True)

class Payment(db.Model):
    """Payment details model for subscription payments"""
    __tablename__ = 'payments'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Plan Details
    plan_type = db.Column(db.String(50), nullable=False)  # 'basic', 'premium', 'vip'
    plan_name = db.Column(db.String(100), nullable=False)  # 'Premium Membership', 'VIP Membership'
    billing_cycle = db.Column(db.String(20), nullable=False)  # 'monthly', 'annual'
    amount = db.Column(db.Float, nullable=False)  # Payment amount
    currency = db.Column(db.String(3), default='USD')  # Currency code
    
    # Payment Method Details
    payment_method = db.Column(db.String(20), nullable=False)  # 'card', 'paypal', 'applepay'
    card_last_four = db.Column(db.String(4))  # Last 4 digits of card (if card payment)
    card_type = db.Column(db.String(20))  # 'visa', 'mastercard', 'amex', 'discover'
    card_holder_name = db.Column(db.String(100))  # Cardholder name
    
    # Transaction Details
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)  # Unique transaction ID
    payment_status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed', 'refunded'
    payment_gateway = db.Column(db.String(50))  # 'stripe', 'paypal', 'square', etc.
    gateway_transaction_id = db.Column(db.String(200))  # Gateway's transaction ID
    
    # Billing Address
    billing_address_line1 = db.Column(db.String(200))
    billing_address_line2 = db.Column(db.String(200))
    billing_city = db.Column(db.String(100))
    billing_state = db.Column(db.String(100))
    billing_postal_code = db.Column(db.String(20))
    billing_country = db.Column(db.String(2))  # Country code
    
    # Subscription Details
    subscription_start_date = db.Column(db.DateTime, default=datetime.utcnow)
    subscription_end_date = db.Column(db.DateTime)
    auto_renew = db.Column(db.Boolean, default=True)
    next_billing_date = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = db.Column(db.DateTime)  # When payment was actually processed
    
    # Additional metadata
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6 address
    user_agent = db.Column(db.Text)  # Browser/device info
    notes = db.Column(db.Text)  # Admin notes or payment details
    
    # Relationship to user
    user = db.relationship('User', backref='payments', lazy=True)
    
    def __repr__(self):
        return f'<Payment {self.transaction_id}: {self.plan_name} - ${self.amount}>'
    
    def get_masked_card_number(self):
        """Return masked card number for display"""
        if self.card_last_four:
            return f"**** **** **** {self.card_last_four}"
        return None
    
    def is_active_subscription(self):
        """Check if subscription is currently active"""
        if self.subscription_end_date:
            return datetime.utcnow() < self.subscription_end_date
        return False
    
    def get_payment_method_display(self):
        """Get friendly payment method name"""
        method_names = {
            'card': 'Credit/Debit Card',
            'paypal': 'PayPal',
            'applepay': 'Apple Pay',
            'googlepay': 'Google Pay'
        }
        return method_names.get(self.payment_method, self.payment_method.title())

# Set up user loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))