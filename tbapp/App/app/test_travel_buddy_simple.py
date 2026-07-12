#!/usr/bin/env python3
"""
Simple test script for Travel Buddy conversion
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all modules can be imported"""
    try:
        from __init__ import create_app
        from extensions import db
        from models import User, Trip, Event, Match, SafetyReport, UserBlock, LocationCheck
        from utils.matching import calculate_travel_compatibility, calculate_match_percentage
        from utils.maps import get_place_details
        print("All imports successful")
        return True
    except Exception as e:
        print(f"Import error: {e}")
        return False

def test_app_creation():
    """Test app creation"""
    try:
        from __init__ import create_app
        app = create_app(use_dummy_db=False)
        print("App creation successful")
        return True
    except Exception as e:
        print(f"App creation error: {e}")
        return False

def test_database_models():
    """Test database model creation"""
    try:
        from __init__ import create_app
        from extensions import db
        from models import User, Trip, Event
        from datetime import datetime, timedelta
        import json
        
        app = create_app(use_dummy_db=False)
        
        with app.app_context():
            # Create tables
            db.create_all()
            print("Database tables created")
            
            # Test User creation
            user = User(
                email="test@example.com",
                password="test_password",
                name="Test User",
                travel_style="adventure",
                budget_range="medium"
            )
            db.session.add(user)
            db.session.commit()
            print("User created successfully")
            
            # Test Trip creation
            trip = Trip(
                user_id=user.id,
                title="Test Trip",
                destination="Test Destination",
                start_date=datetime.now() + timedelta(days=30),
                end_date=datetime.now() + timedelta(days=37)
            )
            db.session.add(trip)
            db.session.commit()
            print("Trip created successfully")
            
            return True
            
    except Exception as e:
        print(f"Database test error: {e}")
        return False

if __name__ == "__main__":
    print("Travel Buddy Conversion Test")
    print("=" * 40)
    
    # Test imports
    print("Testing imports...")
    success1 = test_imports()
    
    # Test app creation
    print("Testing app creation...")
    success2 = test_app_creation()
    
    # Test database
    print("Testing database models...")
    success3 = test_database_models()
    
    if success1 and success2 and success3:
        print("\nAll tests passed! Travel Buddy is ready!")
        print("\nTravel Buddy Features:")
        print("- Trip planning and management")
        print("- Smart travel buddy matching")
        print("- Event creation and group activities")
        print("- Secure messaging system")
        print("- Safety and security features")
        print("- Google Maps integration")
        print("- Responsive mobile design")
        print("\nStart the app with: python run.py")
    else:
        print("\nSome tests failed. Check errors above.")
        sys.exit(1)
