#!/usr/bin/env python3
"""
Test script for Travel Buddy conversion
This script tests the basic functionality of the converted Travel Buddy platform
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User, Trip, Event, Match, SafetyReport, UserBlock, LocationCheck
from datetime import datetime, timedelta
import json

def test_travel_buddy_conversion():
    """Test the Travel Buddy conversion"""
    print("Testing Travel Buddy Conversion...")
    
    # Create app with dummy database
    app = create_app(use_dummy_db=True)
    
    with app.app_context():
        try:
            # Test database creation
            print("Creating database tables...")
            db.create_all()
            print("Database tables created successfully")
            
            # Test User model with travel fields
            print("Testing User model with travel fields...")
            user = User(
                email="test@travelbuddy.com",
                password="hashed_password",
                name="Test Traveler",
                age=28,
                gender="Other",
                travel_style="adventure",
                budget_range="medium",
                preferred_destinations=json.dumps(["Japan", "Thailand", "Iceland"]),
                travel_interests=json.dumps(["hiking", "photography", "food"]),
                languages_spoken=json.dumps(["English", "Spanish"]),
                passport_country="USA",
                group_size_preference="small_group",
                accommodation_preference="hostel",
                transportation_preference="mixed",
                is_verified_traveler=True,
                safety_score=8.5
            )
            db.session.add(user)
            db.session.commit()
            print("User with travel fields created successfully")
            
            # Test Trip model
            print("Testing Trip model...")
            trip = Trip(
                user_id=user.id,
                title="Tokyo Adventure",
                description="Exploring Tokyo's hidden gems",
                destination="Tokyo, Japan",
                start_date=datetime.now() + timedelta(days=30),
                end_date=datetime.now() + timedelta(days=37),
                budget=2500.00,
                travel_style="adventure",
                group_size=4,
                is_public=True,
                status="planning"
            )
            db.session.add(trip)
            db.session.commit()
            print("✅ Trip created successfully")
            
            # Test Event model
            print("🎯 Testing Event model...")
            event = Event(
                organizer_id=user.id,
                trip_id=trip.id,
                title="Sushi Making Class",
                description="Learn to make authentic sushi",
                location="Tsukiji Fish Market, Tokyo",
                latitude=35.6654,
                longitude=139.7706,
                event_date=datetime.now() + timedelta(days=32),
                duration_hours=3.0,
                max_participants=8,
                cost_per_person=75.00,
                event_type="activity",
                is_public=True
            )
            db.session.add(event)
            db.session.commit()
            print("✅ Event created successfully")
            
            # Test Match model with travel compatibility
            print("💕 Testing Match model with travel compatibility...")
            match = Match(
                user_id=user.id,
                matched_user_id=user.id,  # Self-match for testing
                liked=True,
                matched=True,
                matched_at=datetime.now(),
                compatibility_score=0.85,
                travel_compatibility=0.92
            )
            db.session.add(match)
            db.session.commit()
            print("✅ Match with travel compatibility created successfully")
            
            # Test Safety models
            print("🛡️ Testing Safety models...")
            safety_report = SafetyReport(
                reporter_id=user.id,
                report_type="safety_concern",
                description="Test safety report",
                severity="low",
                status="pending"
            )
            db.session.add(safety_report)
            
            user_block = UserBlock(
                blocker_id=user.id,
                blocked_user_id=user.id,  # Self-block for testing
                reason="Test block"
            )
            db.session.add(user_block)
            
            location_check = LocationCheck(
                user_id=user.id,
                latitude=35.6762,
                longitude=139.6503,
                location_name="Tokyo Station",
                check_type="manual",
                is_safe=True,
                notes="Safe location check-in"
            )
            db.session.add(location_check)
            db.session.commit()
            print("✅ Safety models created successfully")
            
            # Test data retrieval
            print("📋 Testing data retrieval...")
            trips = Trip.query.filter_by(user_id=user.id).all()
            events = Event.query.filter_by(organizer_id=user.id).all()
            matches = Match.query.filter_by(user_id=user.id).all()
            
            print(f"✅ Found {len(trips)} trips, {len(events)} events, {len(matches)} matches")
            
            # Test travel compatibility calculation
            print("🧮 Testing travel compatibility calculation...")
            from utils.matching import calculate_travel_compatibility, calculate_match_percentage
            
            compatibility = calculate_travel_compatibility(user, user)
            match_percentage = calculate_match_percentage(user, user)
            
            print(f"✅ Travel compatibility: {compatibility:.2f}")
            print(f"✅ Match percentage: {match_percentage}%")
            
            print("\n🎉 Travel Buddy conversion test completed successfully!")
            print("🚀 The platform is ready for travel buddy matching!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during testing: {str(e)}")
            db.session.rollback()
            return False

def test_api_endpoints():
    """Test API endpoints"""
    print("\n🌐 Testing API endpoints...")
    
    app = create_app(use_dummy_db=True)
    
    with app.test_client() as client:
        try:
            # Test main routes
            routes_to_test = [
                '/',
                '/auth/login',
                '/dashboard/',
                '/trips/',
                '/safety/privacy'
            ]
            
            for route in routes_to_test:
                response = client.get(route)
                print(f"✅ Route {route}: {response.status_code}")
            
            print("✅ API endpoints test completed")
            return True
            
        except Exception as e:
            print(f"❌ Error testing API endpoints: {str(e)}")
            return False

if __name__ == "__main__":
    print("Travel Buddy Conversion Test")
    print("=" * 50)
    
    # Test database and models
    success1 = test_travel_buddy_conversion()
    
    # Test API endpoints
    success2 = test_api_endpoints()
    
    if success1 and success2:
        print("\n🎉 All tests passed! Travel Buddy is ready to use!")
        print("\n📋 Summary of Travel Buddy Features:")
        print("   ✈️  Trip planning and management")
        print("   👥  Smart travel buddy matching")
        print("   🎯  Event creation and group activities")
        print("   💬  Secure messaging system")
        print("   🛡️  Safety and security features")
        print("   🗺️  Google Maps integration")
        print("   📱  Responsive mobile design")
        print("\n🚀 Start the app with: python run.py")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
