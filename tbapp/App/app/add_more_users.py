#!/usr/bin/env python
"""
Script to add more users to the database for testing chat functionality
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from models import db, User
from __init__ import create_app
from werkzeug.security import generate_password_hash

# Sample data
FIRST_NAMES = [
    "Sarah", "Emma", "Jessica", "Lisa", "Michelle", "Anna", "Rachel", "Jennifer",
    "Laura", "Amanda", "Megan", "Karen", "Rebecca", "Nancy", "Sandra", "Julie",
    "John", "Michael", "David", "James", "Robert", "William", "Richard", "Joseph",
    "Thomas", "Christopher", "Daniel", "Matthew", "Anthony", "Mark"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
]

INTERESTS = [
    "Travel", "Photography", "Food", "Art", "Music", "Technology", "Fitness",
    "Coffee", "Gaming", "Movies", "Yoga", "Nature", "Meditation", "Reading",
    "Cooking", "Beach", "Dancing", "Wine", "Dogs", "Running", "Volunteering",
    "Hiking", "Yoga", "Adventure", "Culture", "History", "Museums", "Theatre",
    "Backpacking", "Camping", "Beach Volleyball", "Scuba Diving"
]

OCCUPATIONS = [
    "Software Engineer", "Graphic Designer", "Teacher", "Doctor", "Marketing Manager",
    "Data Scientist", "Chef", "Yoga Instructor", "Photographer", "Writer",
    "Architect", "Nurse", "Financial Analyst", "Artist", "Journalist",
    "Psychologist", "Entrepreneur", "Musician", "Tour Guide", "Travel Blogger",
    "Accountant", "Consultant", "Manager", "Designer", "Developer"
]

LOCATIONS = [
    "New York, NY", "San Francisco, CA", "Los Angeles, CA", "Chicago, IL", "Miami, FL",
    "Seattle, WA", "Austin, TX", "Boston, MA", "Denver, CO", "Portland, OR",
    "Washington, DC", "Atlanta, GA", "Dallas, TX", "Philadelphia, PA", "Phoenix, AZ",
    "Las Vegas, NV", "Honolulu, HI", "New Orleans, LA", "Nashville, TN", "Charleston, SC",
    "Boise, ID", "Albuquerque, NM", "San Diego, CA", "Sacramento, CA", "Raleigh, NC"
]

BIO_TEMPLATES = [
    "Adventure seeker and travel enthusiast. Love exploring new cultures and meeting people from around the world!",
    "Passionate about photography and capturing beautiful moments. Always looking for travel companions.",
    "Life is a journey, not a destination. Let's explore the world together!",
    "Food lover and travel junkie. Join me for culinary adventures across the globe.",
    "Nature enthusiast and outdoor explorer. Let's hike, camp, and discover hidden gems together.",
    "Artist exploring the world through different perspectives. Looking for like-minded travelers.",
    "Digital nomad living my best life. Always up for spontaneous adventures.",
    "Travel blogger documenting my journey. Need companions for upcoming trips!",
    "Yoga instructor looking to connect with peaceful travel souls.",
    "Adventure sports enthusiast. Rock climbing, skydiving, and everything in between!",
    "Book lover and culture explorer. Museums, galleries, and local experiences.",
    "Beach bum and water sports fanatic. Let's find the best beaches together!",
    "Foodie traveling for culinary experiences. Join my gastronomic adventures.",
    "Backpacker on a mission to visit every continent. Come along!",
    "Photography and nature are my passion. Let's capture the world together.",
    "Music lover and festival hunter. Follow me to amazing concerts worldwide.",
    "Wellness traveler focused on yoga, meditation, and holistic experiences.",
    "History buff exploring ancient civilizations and historic sites.",
    "Environmental enthusiast seeking sustainable travel experiences.",
    "Sleep when you're dead! Always ready for the next adventure."
]

TRAVEL_STYLES = ["budget", "luxury", "backpacker", "business", "family"]
BUDGET_RANGES = ["low", "medium", "high"]

def generate_users(count=20):
    """Generate random users"""
    users = []

    for i in range(count):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"

        age = random.randint(22, 55)

        user = User(
            email=f"{first_name.lower()}{last_name.lower()}{i}@travelsync.com",
            password=generate_password_hash("password123"),
            name=name,
            age=age,
            gender=random.choice(["Male", "Female"]),
            bio=random.choice(BIO_TEMPLATES),
            location=random.choice(LOCATIONS),
            occupation=random.choice(OCCUPATIONS),
            interests=",".join(random.sample(INTERESTS, random.randint(4, 7))),
            profile_picture=f"/static/img/avatars/{(i % 10) + 1}.jpg",
            is_verified=random.choice([True, False]),
            profile_complete=True,
            travel_style=random.choice(TRAVEL_STYLES),
            budget_range=random.choice(BUDGET_RANGES),
            preferred_destinations=random.choice(LOCATIONS),
            passport_country=random.choice(["USA", "Canada", "UK", "Australia", "Germany", "France", "Spain", "Italy", "Japan", "Brazil"]),
            group_size_preference=random.choice(["solo", "couple", "small_group", "large_group"]),
            accommodation_preference=random.choice(["hostel", "hotel", "airbnb", "camping"]),
            transportation_preference=random.choice(["flight", "train", "bus", "car", "mixed"]),
            is_verified_traveler=random.choice([True, False]),
            safety_score=round(random.uniform(3.5, 5.0), 1),
            preferred_age_min=max(18, age - 8),
            preferred_age_max=age + 8,
            preferred_gender=random.choice(["Male", "Female", "Any"]),
            subscription_type=random.choice(["basic", "premium", "vip"]),
            subscription_end=datetime.utcnow() + timedelta(days=random.randint(30, 365)),
            credits=random.randint(10, 500),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180)),
            last_login=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
        )

        users.append(user)

    return users

def main():
    """Add users to database"""
    # Create Flask app
    app = create_app(Config)

    with app.app_context():
        try:
            # Generate new users
            print("⏳ Generating 20 new travel profiles...")
            new_users = generate_users(20)

            # Add to database
            db.session.add_all(new_users)
            db.session.commit()

            print(f"✅ Successfully added {len(new_users)} new users to the database!")
            print("\n📋 New Users:")
            for user in new_users:
                print(f"   - {user.name} ({user.email}) - Age {user.age} from {user.location}")

            print("\n🎉 Done! You now have more users to message in the chat.")
            print("💬 Go to Messages and click the + button to start a new conversation.")

        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()
            return 1

    return 0

if __name__ == '__main__':
    exit(main())
