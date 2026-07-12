from flask import Flask, redirect, url_for
import os

# Import extensions
from extensions import db, login_manager, socketio, init_mongodb

def create_app(config_class=None, use_dummy_db=False):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    from config import Config, DummyConfig
    if use_dummy_db:
        app.config.from_object(DummyConfig)
    else:
        app.config.from_object(config_class or Config)
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Initialize OAuth
    from oauth_service import init_oauth
    init_oauth(app)
    
    # Initialize MongoDB for chat messages
    init_mongodb(app)
    
    # Configure login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'
    login_manager.session_protection = 'strong'
    login_manager.refresh_view = 'auth.login'
    login_manager.needs_refresh_message = 'Please re-authenticate to access this page.'
    login_manager.needs_refresh_message_category = 'info'
    
    # Add root route - render landing/cover page
    @app.route('/')
    def index():
        from flask import render_template
        return render_template('landing.html')
    
    # Register blueprints
    with app.app_context():
        # Import and register blueprints
        from auth.routes import auth_bp
        from profile.routes import profile_bp
        from match.routes import match_bp
        from chat.routes import chat_bp
        from dashboard.routes import dashboard_bp
        from discover.routes import discover_bp
        from monetization.routes import monetization_bp
        from notifications.routes import notifications_bp
        from safety.routes import safety_bp
        from chatbot.routes import chatbot_bp
        from trips.routes import trips_bp
        
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(profile_bp, url_prefix='/profile')
        app.register_blueprint(match_bp, url_prefix='/match')
        app.register_blueprint(chat_bp, url_prefix='/chat')
        app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
        app.register_blueprint(discover_bp, url_prefix='/discover')
        app.register_blueprint(monetization_bp, url_prefix='/monetization')
        app.register_blueprint(notifications_bp, url_prefix='/notifications')
        app.register_blueprint(safety_bp, url_prefix='/safety')
        app.register_blueprint(chatbot_bp, url_prefix='/chatbot')
        app.register_blueprint(trips_bp, url_prefix='/trips')
        
        # Register theme test blueprint
        from theme_test import theme_test_bp
        app.register_blueprint(theme_test_bp, url_prefix='/theme')
        
        # Import models after app context is set up
        import models
        
        # Create database tables if they don't exist
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Database initialization error: {e}")
            # Continue anyway as tables might already exist
    
    return app

# User loader is defined in models.py