
import sys
import os
from datetime import datetime, timedelta

# Add 'app' directory to system path so we can import project modules
# Assumes this script is run from the project root
sys.path.insert(0, os.path.abspath('app'))

try:
    # Create a minimal Flask app context
    from flask import Flask
    from config import Config
    from extensions import db, init_mongodb, get_mongo_db
    # Import specific utilities needed for seeding
    from werkzeug.security import generate_password_hash
except ImportError as e:
    print(f"Error importing app modules: {e}")
    print("Please ensure you are running this script from the project root directory.")
    sys.exit(1)


def seed_users():
    """Create 6 dummy users (id, name, email, hashed PW, created_at)"""
    # Define test users with plain passwords
    users_data = [
        {"name": "Alice Admin", "email": "alice@test.com", "role": "admin", "password": "password123"},
        {"name": "Bob Builder", "email": "bob@test.com", "role": "user", "password": "password123"},
        {"name": "Charlie Chat", "email": "charlie@test.com", "role": "user", "password": "password123"},
        {"name": "David Dev", "email": "david@test.com", "role": "user", "password": "password123"},
        {"name": "Eve Eve", "email": "eve@test.com", "role": "user", "password": "password123"},
        {"name": "Frank Fix", "email": "frank@test.com", "role": "user", "password": "password123"}
    ]

    created_map = {}

    print("Checking/Creating users...")
    for u in users_data:
        # Check by email to avoid duplicates
        existing = User.query.filter_by(email=u['email']).first()
        if not existing:
            # Create new user using the project's hashing method (pbkdf2:sha256 default in Werkzeug)
            hashed_pw = generate_password_hash(u['password'], method='pbkdf2:sha256')
            
            new_user = User(
                name=u['name'],
                email=u['email'],
                password=hashed_pw,
                created_at=datetime.utcnow() - timedelta(days=60),  # Account created 2 months ago
                is_verified=True,
                profile_complete=True,
                is_verified_traveler=True,
                location="New York, USA" if u['role'] == "admin" else "London, UK"
            )
            db.session.add(new_user)
            try:
                db.session.commit()
                print(f"  [+] Created user: {u['name']} ({u['email']})")
                created_map[u['email']] = new_user
            except Exception as e:
                db.session.rollback()
                print(f"  [!] Error creating {u['email']}: {e}")
        else:
            print(f"  [=] User exists: {u['name']} ({u['email']})")
            created_map[u['email']] = existing

    return created_map


def seed_conversations(users_map):
    """Create sample conversations and messages using existing MongoDB helpers"""
    if not users_map:
        print("No users available to create chat.")
        return

    mongo_db = get_mongo_db()
    if mongo_db is None:
        print("MongoDB not configured/available. Skipping chat seed.")
        return

    # Helper to get user object by email
    def get_user(email):
        return users_map.get(email)

    alice = get_user("alice@test.com")
    bob = get_user("bob@test.com")
    charlie = get_user("charlie@test.com")

    if not (alice and bob and charlie):
        print("Required users (Alice, Bob, Charlie) not found. Skipping chat seed.")
        return

    print("Creating conversations and messages...")

    # --- Conversation 1: Alice & Bob ---
    # Chronological order handled by timestamps
    msgs1 = [
        (alice, bob, "Hi Bob! Are you free for a call?", 60),  # 60 mins ago
        (bob, alice, "Hey Alice! Yes, give me 5 mins.", 55),
        (alice, bob, "Sure, let me know.", 50),
        (bob, alice, "Ready now.", 45),
        (alice, bob, "Calling...", 44)
    ]

    print(f"  Seeding chat: {alice.name} <-> {bob.name}")
    for sender, receiver, content, mins_ago in msgs1:
        # Idempotency check: prevent duplicate messages
        existing_msg = mongo_db.messages.find_one({
            'sender_id': int(sender.id),
            'receiver_id': int(receiver.id),
            'content': content
        })

        if existing_msg:
            print(f"  [=] Message exists: {content[:40]}...")
            continue

        timestamp = datetime.utcnow() - timedelta(minutes=mins_ago)
        
        # save_message handles insertion AND conversation document update (participants, last_message)
        msg = save_message(
            sender_id=sender.id,
            receiver_id=receiver.id,
            content=content,
            message_type='text',
            created_at=timestamp
        )
        if msg:
            print(f"  [+] Message saved: {content[:40]}...")
        else:
            print(f"  [!] Failed to save message: {content[:40]}...")

    # --- Conversation 2: Alice & Charlie ---
    msgs2 = [
        (charlie, alice, "Hi Alice, I saw your travel plan.", 120),  # 2 hours ago
        (alice, charlie, "Oh, really? Which part?", 100),
        (charlie, alice, "The Japan trip. Looks amazing!", 95),
        (alice, charlie, "Thanks! You should join us next time.", 90)
    ]

    print(f"  Seeding chat: {alice.name} <-> {charlie.name}")
    for sender, receiver, content, mins_ago in msgs2:
        existing_msg = mongo_db.messages.find_one({
            'sender_id': int(sender.id),
            'receiver_id': int(receiver.id),
            'content': content
        })

        if existing_msg:
            print(f"  [=] Message exists: {content[:40]}...")
            continue

        timestamp = datetime.utcnow() - timedelta(minutes=mins_ago)
        save_message(
            sender_id=sender.id,
            receiver_id=receiver.id,
            content=content,
            message_type='text',
            created_at=timestamp
        )
        print(f"  [+] Message saved: {content[:40]}...")

    # Verification: Check if conversation documents were created/updated
    try:
        # Conversation ID format is typically min_max IDs
        cid_ab = f"{min(int(alice.id), int(bob.id))}_{max(int(alice.id), int(bob.id))}"
        cid_ac = f"{min(int(alice.id), int(charlie.id))}_{max(int(alice.id), int(charlie.id))}"
        
        conv_ab = mongo_db.conversations.find_one({'conversation_id': cid_ab})
        conv_ac = mongo_db.conversations.find_one({'conversation_id': cid_ac})
        
        print("  [i] Conversation (Alice-Bob) exists:", bool(conv_ab))
        print("  [i] Conversation (Alice-Charlie) exists:", bool(conv_ac))
    except Exception as e:
        print(f"  [!] Error verifying conversations: {e}")

    print("Conversations seeded.")


def main():
    print("--- seeding data ---")

    # Initialize Flask app
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    init_mongodb(app)

    with app.app_context():
        # Import models inside app context to avoid premature access
        try:
            from models import User
            from mongodb_models import save_message
        except Exception as e:
            print(f"Error importing models/helpers: {e}")
            return

        # Make imported symbols globally available for the functions
        globals()['User'] = User
        globals()['save_message'] = save_message

        # Execution
        users_map = seed_users()
        seed_conversations(users_map)

    print("\n--------------------------------------------------------------")
    print("Test users and sample chat data created successfully.")
    print("Login Credentials:")
    print("  Email:    alice@test.com  Password: password123")
    print("  Email:    bob@test.com    Password: password123")
    print("  Email:    charlie@test.com Password: password123")
    print("--------------------------------------------------------------")


if __name__ == "__main__":
    main()
