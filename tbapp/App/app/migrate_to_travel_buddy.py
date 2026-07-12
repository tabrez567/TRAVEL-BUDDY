#!/usr/bin/env python3
"""
Migration script to convert existing database to Travel Buddy format
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import *
import sqlite3

def migrate_database():
    """Migrate existing database to Travel Buddy format"""
    print("Starting Travel Buddy migration...")
    
    app = create_app(use_dummy_db=False)
    
    with app.app_context():
        try:
            # Drop all existing tables to start fresh
            print("Dropping existing tables...")
            db.drop_all()
            
            # Create all new tables with Travel Buddy models
            print("Creating Travel Buddy tables...")
            db.create_all()
            
            print("Migration completed successfully!")
            print("Travel Buddy database is ready!")
            
            return True
            
        except Exception as e:
            print(f"Migration error: {e}")
            return False

def create_sample_data():
    """Create sample data for Travel Buddy"""
    print("Creating sample Travel Buddy data...")
    
    app = create_app(use_dummy_db=False)
    
    with app.app_context():
        try:
            from datetime import datetime, timedelta
            import json
            
            # Create sample users
            users = [
                User(
                    email="alice@travelbuddy.com",
                    password="hashed_password_1",
                    name="Alice Johnson",
                    age=28,
                    gender="Female",
                    bio="Adventure seeker and photography enthusiast",
                    location="San Francisco, CA",
                    travel_style="adventure",
                    budget_range="medium",
                    preferred_destinations=json.dumps(["Japan", "Iceland", "New Zealand"]),
                    travel_interests=json.dumps(["hiking", "photography", "food"]),
                    languages_spoken=json.dumps(["English", "Spanish"]),
                    passport_country="USA",
                    group_size_preference="small_group",
                    accommodation_preference="hostel",
                    transportation_preference="mixed",
                    is_verified_traveler=True,
                    safety_score=9.0
                ),
                User(
                    email="bob@travelbuddy.com",
                    password="hashed_password_2",
                    name="Bob Smith",
                    age=32,
                    gender="Male",
                    bio="Digital nomad and culture explorer",
                    location="New York, NY",
                    travel_style="cultural",
                    budget_range="high",
                    preferred_destinations=json.dumps(["Italy", "France", "Thailand"]),
                    travel_interests=json.dumps(["art", "history", "cooking"]),
                    languages_spoken=json.dumps(["English", "French"]),
                    passport_country="USA",
                    group_size_preference="couple",
                    accommodation_preference="hotel",
                    transportation_preference="flight",
                    is_verified_traveler=True,
                    safety_score=8.5
                )
            ]
            
            for user in users:
                db.session.add(user)
            
            db.session.commit()
            print("Sample users created")
            
            # Create sample trips
            alice = User.query.filter_by(email="alice@travelbuddy.com").first()
            bob = User.query.filter_by(email="bob@travelbuddy.com").first()
            
            trips = [
                Trip(
                    user_id=alice.id,
                    title="Tokyo Adventure",
                    description="Exploring Tokyo's hidden gems and local culture",
                    destination="Tokyo, Japan",
                    start_date=datetime.now() + timedelta(days=30),
                    end_date=datetime.now() + timedelta(days=37),
                    budget=2500.00,
                    travel_style="adventure",
                    group_size=4,
                    is_public=True,
                    status="planning"
                ),
                Trip(
                    user_id=bob.id,
                    title="European Art Tour",
                    description="Visiting museums and cultural sites across Europe",
                    destination="Paris, France",
                    start_date=datetime.now() + timedelta(days=45),
                    end_date=datetime.now() + timedelta(days=52),
                    budget=4000.00,
                    travel_style="cultural",
                    group_size=2,
                    is_public=True,
                    status="confirmed"
                )
            ]
            
            for trip in trips:
                db.session.add(trip)
            
            db.session.commit()
            print("Sample trips created")
            
            # Create sample events
            tokyo_trip = Trip.query.filter_by(title="Tokyo Adventure").first()
            
            events = [
                Event(
                    organizer_id=alice.id,
                    trip_id=tokyo_trip.id,
                    title="Sushi Making Class",
                    description="Learn to make authentic sushi from a master chef",
                    location="Tsukiji Fish Market, Tokyo",
                    latitude=35.6654,
                    longitude=139.7706,
                    event_date=datetime.now() + timedelta(days=32),
                    duration_hours=3.0,
                    max_participants=8,
                    cost_per_person=75.00,
                    event_type="activity",
                    is_public=True
                ),
                Event(
                    organizer_id=alice.id,
                    trip_id=tokyo_trip.id,
                    title="Tokyo Street Food Tour",
                    description="Explore Tokyo's best street food with a local guide",
                    location="Shibuya District, Tokyo",
                    latitude=35.6580,
                    longitude=139.7016,
                    event_date=datetime.now() + timedelta(days=33),
                    duration_hours=4.0,
                    max_participants=6,
                    cost_per_person=50.00,
                    event_type="tour",
                    is_public=True
                )
            ]
            
            for event in events:
                db.session.add(event)
            
            db.session.commit()
            print("Sample events created")
            
            print("Sample data creation completed!")
            return True
            
        except Exception as e:
            print(f"Sample data creation error: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    print("Travel Buddy Migration")
    print("=" * 30)
    
    # Migrate database
    success1 = migrate_database()
    
    if success1:
        # Create sample data
        success2 = create_sample_data()
        
        if success2:
            print("\nTravel Buddy setup completed successfully!")
            print("You can now start the app with: python run.py")
        else:
            print("\nMigration completed but sample data creation failed.")
    else:
        print("\nMigration failed. Please check the errors above.")
        sys.exit(1)
