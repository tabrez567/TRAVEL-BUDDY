
import sys
import os
from datetime import datetime

# Add 'app' directory to system path
sys.path.insert(0, os.path.abspath('app'))

try:
    from flask import Flask
    from config import Config
    from extensions import init_mongodb, get_mongo_db
    from mongodb_models import get_conversation_id, create_or_update_conversation, _parse_dt
except ImportError as e:
    print(f"Error importing app modules: {e}")
    sys.exit(1)


def recover_conversations():
    mongo_db = get_mongo_db()
    if mongo_db is None:
        print("[ERROR] MongoDB not available.")
        return

    print("--- Starting Chat Recovery ---")
    
    # 1. Check if messages exist
    msg_count = mongo_db.messages.count_documents({})
    print(f"[INFO] Found {msg_count} messages in 'messages' collection.")
    
    if msg_count == 0:
        print("[WARNING] No messages to recover from. Aborting.")
        return

    # 2. Group messages by conversation_id to identify unique conversations
    # We can aggregate to find all unique sender/receiver pairs or distinct conversation_ids
    # Using aggregation to group by conversation info
    pipeline = [
        {
            "$group": {
                "_id": "$conversation_id",
                "last_message_doc": {"$last": "$$ROOT"},
                "count": {"$sum": 1},
                "participants_set": {"$addToSet": {"sender": "$sender_id", "receiver": "$receiver_id"}}
            }
        }
    ]
    
    results = list(mongo_db.messages.aggregate(pipeline))
    print(f"[INFO] Found {len(results)} unique conversations from messages.")

    recovered_count = 0
    
    for res in results:
        cid = res["_id"]
        last_msg = res["last_message_doc"]
        
        # Determine participants safely
        sender_id = last_msg.get('sender_id')
        receiver_id = last_msg.get('receiver_id')
        
        if not sender_id or not receiver_id:
            print(f"[SKIP] Invalid message data for conversation {cid}")
            continue

        # Ensure IDs are ints
        try:
            u1_id = int(sender_id)
            u2_id = int(receiver_id)
        except ValueError:
            print(f"[SKIP] Invalid user IDs for conversation {cid}: {sender_id}, {receiver_id}")
            continue

        # Re-derive standard conversation ID to be safe
        derived_cid = get_conversation_id(u1_id, u2_id)
        if cid != derived_cid:
            print(f"[NOTICE] Message CID '{cid}' differs from derived '{derived_cid}'. Using derived ID for consistency.")
        
        # Prepare last message data
        created_at = _parse_dt(last_msg.get('created_at')) or datetime.utcnow()
        
        last_message_data = {
            'message_id': str(last_msg.get('_id')),
            'content': last_msg.get('content', ''),
            'sender_id': u1_id,
            'message_type': last_msg.get('message_type', 'text'),
            'created_at': created_at
        }
        
        # 3. Create or update conversation document
        # This function upserts (updates if exists, inserts if not)
        try:
            create_or_update_conversation(u1_id, u2_id, last_message_data)
            recovered_count += 1
            print(f"[OK] Recovered conversation {derived_cid} (User {u1_id} <-> User {u2_id})")
        except Exception as e:
            print(f"[ERROR] Failed to recover conversation {derived_cid}: {e}")

    print("------------------------------------------------")
    print(f"Recovery Complete. {recovered_count} conversations processed/restored.")
    print("No messages were deleted or modified.")
    print("------------------------------------------------")


def main():
    app = Flask(__name__)
    app.config.from_object(Config)
    init_mongodb(app)

    with app.app_context():
        recover_conversations()

if __name__ == "__main__":
    main()
