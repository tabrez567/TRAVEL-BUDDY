"""
MongoDB models for chat messages and conversations
"""
from datetime import datetime
from bson import ObjectId
from extensions import get_mongo_db
from werkzeug.security import generate_password_hash

# User Management Functions
def mongo_create_user(email, name, password, **kwargs):
    """Create a user in MongoDB"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return None
    
    user = {
        'email': email.lower(),
        'name': name,
        'password': generate_password_hash(password, method='pbkdf2:sha256'),
        'created_at': datetime.utcnow(),
        'is_verified': kwargs.get('is_verified', False),
        'profile_complete': kwargs.get('profile_complete', True),
        **kwargs
    }
    
    result = mongo_db.users.insert_one(user)
    user['_id'] = str(result.inserted_id)
    return user

def mongo_get_user_by_email(email):
    """Get a user from MongoDB by email"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return None
    
    user = mongo_db.users.find_one({'email': email.lower()})
    if user:
        user['_id'] = str(user['_id'])
    return user

def mongo_get_user_by_id(user_id):
    """Get a user from MongoDB by ID"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return None
    
    try:
        user = mongo_db.users.find_one({'_id': ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception:
        # Might be searching for a SQL ID or invalid format
        return None

def mongo_update_user(user_id, update_data):
    """Update a user in MongoDB"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        if 'updated_at' not in update_data:
            update_data['updated_at'] = datetime.utcnow()
            
        result = mongo_db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating mongo user: {e}")
        return False


def get_conversation_id(user1_id, user2_id):
    """Generate consistent conversation ID from two user IDs"""
    # Sort IDs to ensure same conversation ID regardless of order
    ids = sorted([int(user1_id), int(user2_id)])
    return f"{ids[0]}_{ids[1]}"

def create_or_update_conversation(user1_id, user2_id, last_message_data=None):
    """Create or update a conversation between two users"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return None
    
    conversation_id = get_conversation_id(user1_id, user2_id)
    
    conversation = {
        'conversation_id': conversation_id,
        'participants': sorted([int(user1_id), int(user2_id)]),
        'user1_id': int(user1_id),
        'user2_id': int(user2_id),
        'last_message_at': last_message_data.get('created_at', datetime.utcnow()) if last_message_data else datetime.utcnow(),
        'last_message': last_message_data,
        'updated_at': datetime.utcnow()
    }
    
    # Upsert conversation
    mongo_db.conversations.update_one(
        {'conversation_id': conversation_id},
        {'$set': conversation, '$setOnInsert': {'created_at': datetime.utcnow()}},
        upsert=True
    )
    
    return conversation_id

def save_message(sender_id, receiver_id, content, message_type='text', **kwargs):
    """Save a message to MongoDB"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return None
    
    conversation_id = get_conversation_id(sender_id, receiver_id)
    
    message = {
        'conversation_id': conversation_id,
        'sender_id': int(sender_id),
        'receiver_id': int(receiver_id),
        'content': content,
        'message_type': message_type,
        'is_read': False,
        'created_at': datetime.utcnow(),
        **kwargs  # Allow additional fields like latitude, longitude, trip_id, etc.
    }
    
    # Insert message
    result = mongo_db.messages.insert_one(message)
    message['_id'] = str(result.inserted_id)
    
    # Update conversation with last message
    message_data = {
        'message_id': str(result.inserted_id),
        'content': content,
        'sender_id': int(sender_id),
        'message_type': message_type,
        'created_at': message['created_at']
    }
    create_or_update_conversation(sender_id, receiver_id, message_data)
    
    return message

def get_messages(user1_id, user2_id, limit=50, skip=0):
    """Get messages between two users"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return []
    
    conversation_id = get_conversation_id(user1_id, user2_id)
    
    messages = list(mongo_db.messages.find(
        {'conversation_id': conversation_id}
    ).sort('created_at', -1).skip(skip).limit(limit))
    
    # Reverse to return chronological order (oldest to newest)
    messages.reverse()
    
    # Convert ObjectId to string for JSON serialization
    for msg in messages:
        msg['_id'] = str(msg['_id'])
        msg['message_id'] = str(msg['_id'])
        # Convert datetime to ISO string
        if isinstance(msg.get('created_at'), datetime):
            msg['created_at'] = msg['created_at'].isoformat()
    
    return messages

def _parse_dt(value):
    """Best-effort parse for datetime fields coming from MongoDB."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            # Support ISO strings with trailing Z
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except Exception:
            return None
    return None


def get_user_conversations(user_id):
    """Get all conversations for a user.

    If conversations are missing (e.g. messages exist but conversation docs were never created),
    we backfill conversations from the messages collection.
    """
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return []

    user_id = int(user_id)

    # Find all conversations where user is a participant
    conversations = list(mongo_db.conversations.find({
        'participants': user_id
    }).sort('last_message_at', -1))

    # Backfill: if there are messages but no conversations, build conversation docs from messages
    if not conversations:
        msgs = list(
            mongo_db.messages.find({
                '$or': [{'sender_id': user_id}, {'receiver_id': user_id}]
            }).sort('created_at', -1)
        )

        seen = set()
        for msg in msgs:
            cid = msg.get('conversation_id')
            if not cid:
                cid = get_conversation_id(msg.get('sender_id'), msg.get('receiver_id'))
            if not cid or cid in seen:
                continue
            seen.add(cid)

            # Participants: prefer parsing from conversation_id format "a_b"
            participants = None
            if isinstance(cid, str) and '_' in cid:
                try:
                    a, b = cid.split('_', 1)
                    participants = sorted([int(a), int(b)])
                except Exception:
                    participants = None
            if not participants:
                participants = sorted([int(msg.get('sender_id')), int(msg.get('receiver_id'))])

            created_at = _parse_dt(msg.get('created_at')) or datetime.utcnow()

            last_message_data = {
                'message_id': msg.get('message_id') or str(msg.get('_id')),
                'content': msg.get('content', ''),
                'sender_id': int(msg.get('sender_id')),
                'message_type': msg.get('message_type', 'text'),
                'created_at': created_at,
            }

            doc = {
                'conversation_id': cid,
                'participants': participants,
                'user1_id': participants[0],
                'user2_id': participants[1],
                'last_message_at': created_at,
                'last_message': last_message_data,
                'updated_at': datetime.utcnow(),
            }

            mongo_db.conversations.update_one(
                {'conversation_id': cid},
                {'$set': doc, '$setOnInsert': {'created_at': datetime.utcnow()}},
                upsert=True,
            )

        conversations = list(mongo_db.conversations.find({
            'participants': user_id
        }).sort('last_message_at', -1))

    # Convert ObjectId and datetime for JSON serialization
    for conv in conversations:
        if '_id' in conv:
            conv['_id'] = str(conv['_id'])
        if isinstance(conv.get('last_message_at'), datetime):
            conv['last_message_at'] = conv['last_message_at'].isoformat()
        if isinstance(conv.get('created_at'), datetime):
            conv['created_at'] = conv['created_at'].isoformat()
        if isinstance(conv.get('updated_at'), datetime):
            conv['updated_at'] = conv['updated_at'].isoformat()
        if conv.get('last_message') and isinstance(conv['last_message'].get('created_at'), datetime):
            conv['last_message']['created_at'] = conv['last_message']['created_at'].isoformat()

    return conversations

def mark_message_as_read(message_id, user_id):
    """Mark a message as read"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        result = mongo_db.messages.update_one(
            {'_id': ObjectId(message_id), 'receiver_id': int(user_id)},
            {'$set': {'is_read': True, 'read_at': datetime.utcnow()}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error marking message as read: {e}")
        return False

def mark_conversation_as_read(user1_id, user2_id, reader_id):
    """Mark all messages in a conversation as read"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    conversation_id = get_conversation_id(user1_id, user2_id)
    
    try:
        result = mongo_db.messages.update_many(
            {
                'conversation_id': conversation_id,
                'receiver_id': int(reader_id),
                'is_read': False
            },
            {'$set': {'is_read': True, 'read_at': datetime.utcnow()}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error marking conversation as read: {e}")
        return False

def get_unread_count(user_id):
    """Get total unread message count for a user"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return 0
    
    try:
        count = mongo_db.messages.count_documents({
            'receiver_id': int(user_id),
            'is_read': False
        })
        return count
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return 0

def delete_message(message_id, user_id):
    """Delete a message (only by sender)"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        result = mongo_db.messages.delete_one({
            '_id': ObjectId(message_id),
            'sender_id': int(user_id)
        })
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting message: {e}")
        return False

def update_message_status(message_id, status, user_id):
    """Update message delivery/read status"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        update_data = {f'{status}_at': datetime.utcnow()}
        if status == 'read':
            update_data['is_read'] = True
            update_data['read_by'] = int(user_id)
        
        result = mongo_db.messages.update_one(
            {'_id': ObjectId(message_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating message status: {e}")
        return False

def add_message_reaction(message_id, user_id, reaction):
    """Add a reaction to a message"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        # Check if reaction already exists
        existing = mongo_db.message_reactions.find_one({
            'message_id': message_id,
            'user_id': int(user_id),
            'reaction': reaction
        })
        
        if existing:
            # Remove reaction if it already exists (toggle)
            mongo_db.message_reactions.delete_one({'_id': existing['_id']})
            return 'removed'
        else:
            # Add new reaction
            reaction_doc = {
                'message_id': message_id,
                'user_id': int(user_id),
                'reaction': reaction,
                'created_at': datetime.utcnow()
            }
            mongo_db.message_reactions.insert_one(reaction_doc)
            return 'added'
    except Exception as e:
        print(f"Error adding message reaction: {e}")
        return False

def get_message_reactions(message_id):
    """Get all reactions for a message"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return []
    
    try:
        reactions = list(mongo_db.message_reactions.find({'message_id': message_id}))
        # Convert ObjectId to string
        for reaction in reactions:
            reaction['_id'] = str(reaction['_id'])
            if isinstance(reaction.get('created_at'), datetime):
                reaction['created_at'] = reaction['created_at'].isoformat()
        return reactions
    except Exception as e:
        print(f"Error getting message reactions: {e}")
        return []

def update_user_online_status(user_id, is_online):
    """Update user's online status"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        update_data = {
            'is_online': is_online,
            'last_seen': datetime.utcnow()
        }
        
        if is_online:
            update_data['online_at'] = datetime.utcnow()
        else:
            update_data['offline_at'] = datetime.utcnow()
        
        mongo_db.user_status.update_one(
            {'user_id': int(user_id)},
            {'$set': update_data},
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error updating user online status: {e}")
        return False

def get_user_online_status(user_id):
    """Get user's online status"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return None
    
    try:
        status = mongo_db.user_status.find_one({'user_id': int(user_id)})
        if status:
            # Convert datetime fields
            for field in ['last_seen', 'online_at', 'offline_at']:
                if isinstance(status.get(field), datetime):
                    status[field] = status[field].isoformat()
        return status
    except Exception as e:
        print(f"Error getting user online status: {e}")
        return None

def get_online_users():
    """Get all currently online users"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return []
    
    try:
        online_users = list(mongo_db.user_status.find({'is_online': True}))
        return [status['user_id'] for status in online_users]
    except Exception as e:
        print(f"Error getting online users: {e}")
        return []

def save_typing_status(user_id, conversation_id, is_typing):
    """Save typing status for a user in a conversation"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
    
    try:
        if is_typing:
            # Add typing status
            mongo_db.typing_status.update_one(
                {'user_id': int(user_id), 'conversation_id': conversation_id},
                {'$set': {'is_typing': True, 'started_at': datetime.utcnow()}},
                upsert=True
            )
        else:
            # Remove typing status
            mongo_db.typing_status.delete_one({
                'user_id': int(user_id), 
                'conversation_id': conversation_id
            })
        return True
    except Exception as e:
        print(f"Error saving typing status: {e}")
        return False

def get_typing_users(conversation_id):
    """Get users currently typing in a conversation"""
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return []
    
    try:
        # Clean up old typing statuses (older than 5 seconds)
        cutoff_time = datetime.utcnow().replace(second=datetime.utcnow().second - 5)
        mongo_db.typing_status.delete_many({'started_at': {'$lt': cutoff_time}})
        
        typing_users = list(mongo_db.typing_status.find({'conversation_id': conversation_id}))
        return [status['user_id'] for status in typing_users]
    except Exception as e:
        print(f"Error getting typing users: {e}")
        return []

