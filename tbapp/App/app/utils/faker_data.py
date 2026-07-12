from faker import Faker
import random
import json
import os
from datetime import datetime, timedelta
import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, User, Match, Message, Conversation, UserPreference

fake = Faker()

# Set seed for reproducibility
random.seed(42)
fake.seed_instance(42)

# Constants
NUM_USERS = 50
INTERESTS = [
    "Travel", "Photography", "Food", "Art", "Music", "Technology", "Fitness", 
    "Coffee", "Gaming", "Movies", "Yoga", "Nature", "Meditation", "Reading", 
    "Cooking", "Beach", "Dancing", "Wine", "Dogs", "Running", "Volunteering", 
    "Data Science", "Rock Climbing", "Board Games", "Hiking", "Puzzles", 
    "Teaching", "Books", "Concerts", "Medicine", "Sustainability", "Gardening"
]

OCCUPATIONS = [
    "Software Engineer", "Graphic Designer", "Teacher", "Doctor", "Marketing Manager",
    "Data Scientist", "Chef", "Yoga Instructor", "Environmental Scientist", "Lawyer",
    "Photographer", "Writer", "Architect", "Nurse", "Financial Analyst", "Artist",
    "Journalist", "Psychologist", "Entrepreneur", "Musician"
]

LOCATIONS = [
    "New York, NY", "San Francisco, CA", "Los Angeles, CA", "Chicago, IL", "Miami, FL",
    "Seattle, WA", "Austin, TX", "Boston, MA", "Denver, CO", "Portland, OR",
    "Washington, DC", "Atlanta, GA", "Dallas, TX", "Philadelphia, PA", "Phoenix, AZ"
]

SUBSCRIPTION_TYPES = ["basic", "premium", "vip"]

def generate_dummy_users():
    """Generate dummy users with profiles"""
    users = []
    
    for i in range(1, NUM_USERS + 1):
        gender = random.choice(["Male", "Female", "Non-binary"])
        first_name = fake.first_name_male() if gender == "Male" else fake.first_name_female()
        last_name = fake.last_name()
        name = f"{first_name} {last_name}"
        
        # Generate a profile picture path (these don't actually exist)
        profile_pic = f"/static/img/avatars/user_{i}.jpg"
        
        # Generate random interests (3-6 interests)
        user_interests = ",".join(random.sample(INTERESTS, random.randint(3, 6)))
        
        # Generate a random age between 18 and 45
        age = random.randint(18, 45)
        
        # Create user object
        user = User(
            email=fake.email(),
            password=fake.password(),
            name=name,
            created_at=fake.date_time_between(start_date="-1y", end_date="now"),
            last_login=fake.date_time_between(start_date="-1w", end_date="now"),
            is_verified=random.choice([True, False]),
            profile_complete=True,
            age=age,
            gender=gender,
            bio=fake.paragraph(nb_sentences=3),
            location=random.choice(LOCATIONS),
            occupation=random.choice(OCCUPATIONS),
            interests=user_interests,
            profile_picture=profile_pic,
            preferred_age_min=max(18, age - 5),
            preferred_age_max=age + 5,
            preferred_gender=random.choice(["Male", "Female", "Any"]),
            preferred_location=random.choice(LOCATIONS),
            subscription_type=random.choice(SUBSCRIPTION_TYPES),
            subscription_end=fake.date_time_between(start_date="now", end_date="+1y"),
            credits=random.randint(0, 1000)
        )
        
        users.append(user)
    
    return users

def generate_dummy_matches(users):
    """Generate dummy matches between users"""
    matches = []
    
    # Create some matches between users
    for _ in range(NUM_USERS * 2):  # Each user will have ~2 matches on average
        user1 = random.choice(users)
        user2 = random.choice([u for u in users if u.id != user1.id])
        
        # Check if match already exists
        if any(m.user_id == user1.id and m.matched_user_id == user2.id for m in matches) or \
           any(m.user_id == user2.id and m.matched_user_id == user1.id for m in matches):
            continue
        
        # Create match from user1 to user2
        liked = random.choice([True, False])
        super_liked = random.choice([True, False]) if liked else False
        
        match = Match(
            user_id=user1.id,
            matched_user_id=user2.id,
            liked=liked,
            super_liked=super_liked,
            matched=False,  # Will be updated later if mutual
            created_at=fake.date_time_between(start_date="-6m", end_date="now")
        )
        
        matches.append(match)
        
        # Create reciprocal match with some probability
        if random.random() < 0.3:  # 30% chance of mutual like
            reciprocal_match = Match(
                user_id=user2.id,
                matched_user_id=user1.id,
                liked=True,
                super_liked=random.choice([True, False]),
                matched=True,  # It's a match!
                matched_at=fake.date_time_between(start_date="-6m", end_date="now"),
                created_at=fake.date_time_between(start_date="-6m", end_date="now")
            )
            
            # Update the first match to be matched as well
            match.matched = True
            match.matched_at = reciprocal_match.matched_at
            
            matches.append(reciprocal_match)
    
    return matches

def generate_dummy_conversations_and_messages(matches):
    """Generate dummy conversations and messages for matched users"""
    conversations = []
    messages = []
    
    # Find all mutual matches
    mutual_matches = []
    for match in matches:
        if match.matched:
            # Check if we already have this pair
            if not any((m[0] == match.matched_user_id and m[1] == match.user_id) or 
                      (m[0] == match.user_id and m[1] == match.matched_user_id) for m in mutual_matches):
                mutual_matches.append((match.user_id, match.matched_user_id))
    
    # Create conversations for mutual matches
    for user1_id, user2_id in mutual_matches:
        # Create conversation
        last_message_at = fake.date_time_between(start_date="-3m", end_date="now")
        
        conversation = Conversation(
            user1_id=user1_id,
            user2_id=user2_id,
            last_message_at=last_message_at,
            unread_count=random.randint(0, 5)
        )
        
        conversations.append(conversation)
        
        # Generate 1-20 messages for this conversation
        num_messages = random.randint(1, 20)
        
        for _ in range(num_messages):
            # Randomly choose sender and receiver
            if random.random() < 0.5:
                sender_id, receiver_id = user1_id, user2_id
            else:
                sender_id, receiver_id = user2_id, user1_id
            
            # Create message
            message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=fake.paragraph(nb_sentences=random.randint(1, 3)),
                is_read=random.choice([True, False]),
                created_at=fake.date_time_between(start_date="-3m", end_date=last_message_at)
            )
            
            messages.append(message)
    
    return conversations, messages

def generate_dummy_preferences(users):
    """Generate dummy user preferences"""
    preferences = []
    
    for user in users:
        # Create preference
        preference = UserPreference(
            user_id=user.id,
            min_age=max(18, user.age - random.randint(2, 10)),
            max_age=user.age + random.randint(2, 15),
            preferred_gender=random.choice(["Male", "Female", "Any"]),
            distance_radius=random.choice([10, 25, 50, 100]),
            show_profile=random.random() > 0.1  # 90% chance of showing profile
        )
        
        preferences.append(preference)
    
    return preferences

def populate_database():
    """Populate the database with dummy data"""
    # Clear existing data
    db.session.query(Message).delete()
    db.session.query(Conversation).delete()
    db.session.query(Match).delete()
    db.session.query(UserPreference).delete()
    db.session.query(User).delete()
    db.session.commit()
    
    # Generate users
    users = generate_dummy_users()
    
    # Add users to database
    for user in users:
        db.session.add(user)
    
    db.session.commit()
    
    # Generate matches
    matches = generate_dummy_matches(users)
    
    # Add matches to database
    for match in matches:
        db.session.add(match)
    
    db.session.commit()
    
    # Generate conversations and messages
    conversations, messages = generate_dummy_conversations_and_messages(matches)
    
    # Add conversations to database
    for conversation in conversations:
        db.session.add(conversation)
    
    db.session.commit()
    
    # Add messages to database
    for message in messages:
        db.session.add(message)
    
    # Generate preferences
    preferences = generate_dummy_preferences(users)
    
    # Add preferences to database
    for preference in preferences:
        db.session.add(preference)
    
    db.session.commit()
    
    print(f"Database populated with {len(users)} users, {len(matches)} matches, "
          f"{len(conversations)} conversations, {len(messages)} messages, and {len(preferences)} preferences.")

def export_dummy_data_to_json():
    """Export dummy data to JSON files for reference"""
    # Generate data
    users = generate_dummy_users()
    
    # Convert to dictionaries for JSON serialization
    user_dicts = []
    for user in users:
        user_dict = {
            "id": user.id if hasattr(user, 'id') else random.randint(1, 1000),
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "gender": user.gender,
            "bio": user.bio,
            "location": user.location,
            "occupation": user.occupation,
            "interests": user.interests.split(','),
            "profile_picture": user.profile_picture,
            "subscription_type": user.subscription_type,
            "credits": user.credits
        }
        user_dicts.append(user_dict)
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    # Write to JSON file
    with open('data/dummy_profiles.json', 'w') as f:
        json.dump(user_dicts, f, indent=2)
    
    print(f"Exported {len(user_dicts)} dummy profiles to data/dummy_profiles.json")

if __name__ == "__main__":
    # Choose whether to populate database or export to JSON
    # Uncomment the function you want to use
    # populate_database()
    export_dummy_data_to_json()