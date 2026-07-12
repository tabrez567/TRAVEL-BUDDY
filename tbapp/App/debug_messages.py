
import sys
import os
from pprint import pprint

sys.path.insert(0, os.path.abspath('app'))

try:
    from flask import Flask
    from config import Config
    from extensions import db, init_mongodb, get_mongo_db
    from models import User
    from mongodb_models import get_conversation_id
except ImportError as e:
    print(f"Error importing: {e}")
    sys.exit(1)

def debug_chat():
    mongo_db = get_mongo_db()
    
    print("--- USERS (SQLAlchemy) ---")
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")
    
    print("\n--- MESSAGES (MongoDB) ---")
    # Get all messages
    msgs = list(mongo_db.messages.find({}).limit(10))
    for m in msgs:
        print(f"MsgID: {m.get('_id')}")
        print(f"  CID: {m.get('conversation_id')}")
        print(f"  Sender: {m.get('sender_id')} (Type: {type(m.get('sender_id'))})")
        print(f"  Receiver: {m.get('receiver_id')} (Type: {type(m.get('receiver_id'))})")
        print(f"  Content: {m.get('content')}")
        print("-" * 20)

    print("\n--- CONVERSATIONS (MongoDB) ---")
    convs = list(mongo_db.conversations.find({}))
    for c in convs:
        print(f"CID: {c.get('conversation_id')}")
        print(f"  Participants: {c.get('participants')}")
        print(f"  Last Msg: {c.get('last_message', {}).get('content')}")
        print("-" * 20)
        
    if users and len(users) >= 2:
        u1 = users[0]
        u2 = users[1]
        cid = get_conversation_id(u1.id, u2.id)
        print(f"\nChecking specific pair: {u1.name} ({u1.id}) <-> {u2.name} ({u2.id})")
        print(f"Expected CID: {cid}")
        
        count = mongo_db.messages.count_documents({'conversation_id': cid})
        print(f"Message count for this CID: {count}")
        
        # Test the exact query usage from models
        q_res = list(mongo_db.messages.find({'conversation_id': cid}).sort('created_at', 1))
        print(f"Query result count: {len(q_res)}")

def main():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    init_mongodb(app)

    with app.app_context():
        debug_chat()

if __name__ == "__main__":
    main()
