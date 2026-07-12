from flask import Blueprint, render_template, jsonify, request, current_app
from flask_login import login_required, current_user
from flask_socketio import emit, join_room, leave_room
import json
import os
from datetime import datetime

from extensions import db, socketio, get_mongo_db
from models import Message, Conversation, User, Trip, Event
from mongodb_models import (
    save_message, get_messages as mongo_get_messages, get_user_conversations,
    mark_conversation_as_read, get_conversation_id, get_unread_count,
    update_message_status, add_message_reaction, get_message_reactions,
    update_user_online_status, get_user_online_status, get_online_users,
    save_typing_status, get_typing_users
)

# Blueprint configuration
chat_bp = Blueprint('chat', __name__, url_prefix='/chat', template_folder='templates')

# Load dummy messages
def load_dummy_messages():
    """Load dummy messages from JSON file"""
    try:
        data_path = os.path.join(os.path.dirname(__file__), '../../data/messages.json')
        with open(data_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Return empty list if file doesn't exist
        return []
    except Exception as e:
        print(f"Error loading dummy messages: {e}")
        return []

@chat_bp.route('/')
@login_required
def chat():
    """Main chat page"""
    return render_template('chat/chat.html')

@chat_bp.route('/api/conversations')
@login_required
def get_conversations():
    """API endpoint to get user conversations from MongoDB"""
    try:
        # Get conversations from MongoDB (returns empty list if MongoDB unavailable)
        conversations = get_user_conversations(current_user.id)
        
        # Format conversations with user data
        conversations_list = []
        for conv in conversations:
            # Get the other user ID (ensure ints)
            try:
                user1 = int(conv.get('user1_id'))
                user2 = int(conv.get('user2_id'))
            except Exception:
                user1 = conv.get('user1_id')
                user2 = conv.get('user2_id')

            other_user_id = user2 if user1 == int(current_user.id) else user1
            
            # Get user data from SQLAlchemy (for user profile info)
            other_user = User.query.get(other_user_id)
            if not other_user:
                # Handle deleted/test users gracefully
                class DummyUser:
                    id = other_user_id
                    name = f"User {other_user_id}"
                    profile_picture = None
                other_user = DummyUser()
            
            # Get unread count for this conversation
            conversation_id = get_conversation_id(current_user.id, other_user_id)
            mongo_db = get_mongo_db()
            unread_count = 0
            if mongo_db is not None:
                unread_count = mongo_db.messages.count_documents({
                    'conversation_id': conversation_id,
                    'receiver_id': current_user.id,
                    'is_read': False
                })
            
            conversations_list.append({
                'conversation_id': conv['conversation_id'],
                'user': {
                    'id': other_user.id,
                    'name': other_user.name,
                    'profile_picture': other_user.profile_picture or f'/static/img/avatars/{other_user.id % 10 + 1}.jpg'
                },
                'last_message': conv.get('last_message'),
                'last_message_at': conv.get('last_message_at'),
                'unread_count': unread_count
            })
        
        # Sort by last_message_at
        conversations_list.sort(
            key=lambda x: x.get('last_message_at') or '', 
            reverse=True
        )
        
        return jsonify(conversations_list)
    except Exception as e:
        print(f"Error getting conversations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify([])

@chat_bp.route('/api/messages/<int:user_id>')
@login_required
def get_messages_api(user_id):
    """API endpoint to get messages with a specific user from MongoDB"""
    try:
        limit = request.args.get('limit', 50, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        # Get messages from MongoDB (returns empty list if MongoDB unavailable)
        messages = mongo_get_messages(current_user.id, user_id, limit=limit, skip=skip)
        
        # Mark conversation as read when user views messages (only if MongoDB available)
        if messages:
            mark_conversation_as_read(current_user.id, user_id, current_user.id)
        
        # Format messages for frontend
        formatted_messages = []
        for msg in messages:
            # Get sender user data
            sender_id = int(msg['sender_id'])
            sender = User.query.get(sender_id)
            sender_name = sender.name if sender else f'User {sender_id}'
            
            # Extract message ID safely
            message_id = msg.get('message_id') or str(msg.get('_id'))

            formatted_messages.append({
                'message_id': message_id,
                'sender_id': sender_id,
                'sender_name': sender_name,
                'receiver_id': int(msg['receiver_id']),
                'content': msg['content'],
                'message_type': msg.get('message_type', 'text'),
                'is_read': msg.get('is_read', False),
                'timestamp': msg.get('created_at').isoformat() if isinstance(msg.get('created_at'), datetime) else msg.get('created_at'),
                'created_at': msg.get('created_at').isoformat() if isinstance(msg.get('created_at'), datetime) else msg.get('created_at'),
                'latitude': msg.get('latitude'),
                'longitude': msg.get('longitude'),
                'trip_id': msg.get('trip_id'),
                'event_id': msg.get('event_id'),
                'attachment_url': msg.get('attachment_url')
            })
        
        return jsonify(formatted_messages)
    except Exception as e:
        print(f"Error getting messages: {e}")
        import traceback
        traceback.print_exc()
        return jsonify([])

@chat_bp.route('/api/travel-suggestions')
@login_required
def get_travel_suggestions():
    """API endpoint to get travel suggestions for the current user"""
    try:
        # Return dummy travel suggestions for now
        suggestions = {
            'upcoming_trips': [
                {
                    'id': 1,
                    'title': 'Tokyo Adventure',
                    'destination': 'Tokyo, Japan',
                    'start_date': '2024-12-01T00:00:00Z',
                    'description': 'Exploring the vibrant streets of Tokyo'
                },
                {
                    'id': 2,
                    'title': 'Paris Getaway',
                    'destination': 'Paris, France',
                    'start_date': '2024-12-15T00:00:00Z',
                    'description': 'Romantic trip to the City of Light'
                }
            ],
            'nearby_events': [
                {
                    'id': 1,
                    'title': 'Travel Meetup',
                    'location': 'Local Coffee Shop',
                    'start_date': '2024-10-25T18:00:00Z',
                    'description': 'Meet fellow travelers in your area'
                }
            ]
        }
        
        return jsonify(suggestions)
    except Exception as e:
        print(f"Error getting travel suggestions: {e}")
        return jsonify({'error': 'Failed to get travel suggestions'}), 500

@chat_bp.route('/api/share-location', methods=['POST'])
@login_required
def share_location():
    """API endpoint to share location with travel buddy"""
    try:
        data = request.get_json()
        receiver_id = data.get('receiver_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        location_name = data.get('location_name', 'Shared Location')
        
        # Save location message to MongoDB (optional)
        message = save_message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=f"📍 {location_name}",
            message_type='location',
            latitude=latitude,
            longitude=longitude
        )
        
        # If MongoDB unavailable, create temporary message structure
        if not message:
            message = {
                '_id': f"temp_{datetime.utcnow().timestamp()}",
                'content': f"📍 {location_name}",
                'created_at': datetime.utcnow()
            }
        
        # Emit to receiver via Socket.IO
        from extensions import socketio
        socketio.emit('receive_message', {
            'message_id': message.get('message_id') or message.get('_id'),
            'sender_id': current_user.id,
            'sender_name': current_user.name,
            'receiver_id': receiver_id,
            'content': message['content'],
            'message_type': 'location',
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': message.get('created_at'),
            'created_at': message.get('created_at')
        }, room=str(receiver_id))
        
        return jsonify({'success': True, 'message_id': message.get('message_id') or message.get('_id')})
    except Exception as e:
        print(f"Error sharing location: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to share location'}), 500

@chat_bp.route('/api/plan-trip', methods=['POST'])
@login_required
def plan_trip():
    """API endpoint to create a trip plan with travel buddy"""
    try:
        data = request.get_json()
        receiver_id = data.get('receiver_id')
        trip_title = data.get('title')
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        description = data.get('description')
        
        # Create trip
        new_trip = Trip(
            title=trip_title,
            destination=destination,
            description=description,
            start_date=datetime.fromisoformat(start_date) if start_date else None,
            end_date=datetime.fromisoformat(end_date) if end_date else None,
            creator_id=current_user.id,
            created_at=datetime.utcnow()
        )
        
        db.session.add(new_trip)
        db.session.commit()
        
        # Send trip invitation message to MongoDB (optional)
        message = save_message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=f"🗺️ Trip Plan: {trip_title} to {destination}",
            message_type='trip_invitation',
            trip_id=new_trip.id
        )
        
        # If MongoDB unavailable, create temporary message structure
        if not message:
            message = {
                '_id': f"temp_{datetime.utcnow().timestamp()}",
                'content': f"🗺️ Trip Plan: {trip_title} to {destination}",
                'created_at': datetime.utcnow()
            }
        
        # Emit to receiver via Socket.IO
        from extensions import socketio
        socketio.emit('receive_message', {
            'message_id': message.get('message_id') or message.get('_id'),
            'sender_id': current_user.id,
            'sender_name': current_user.name,
            'receiver_id': receiver_id,
            'content': message['content'],
            'message_type': 'trip_invitation',
            'trip_id': new_trip.id,
            'timestamp': message.get('created_at'),
            'created_at': message.get('created_at')
        }, room=str(receiver_id))
        
        return jsonify({'success': True, 'trip_id': new_trip.id})
    except Exception as e:
        print(f"Error planning trip: {e}")
        return jsonify({'error': 'Failed to plan trip'}), 500

# SocketIO events
@socketio.on('send_message')
def handle_send_message(data):
    """Handle sending a message and save to MongoDB"""
    try:
        message_content = data.get('message')
        receiver_id = data.get('receiver_id')
        message_type = data.get('message_type', 'text')
        
        if not message_content or not receiver_id:
            emit('error', {'message': 'Missing required fields'})
            return
        
        # Save message to MongoDB (optional - will work without MongoDB)
        saved_message = save_message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=message_content,
            message_type=message_type,
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            trip_id=data.get('trip_id'),
            event_id=data.get('event_id'),
            attachment_url=data.get('attachment_url')
        )
        
        # If MongoDB is not available, create a temporary message structure
        if not saved_message:
            from datetime import datetime
            saved_message = {
                'message_id': f"temp_{datetime.utcnow().timestamp()}",
                'sender_id': current_user.id,
                'receiver_id': receiver_id,
                'content': message_content,
                'message_type': message_type,
                'created_at': datetime.utcnow(),
                'is_read': False
            }
            if data.get('latitude'):
                saved_message['latitude'] = data.get('latitude')
            if data.get('longitude'):
                saved_message['longitude'] = data.get('longitude')
        
        # Format message data for Socket.IO
        message_data = {
            'message_id': saved_message.get('message_id') or str(saved_message.get('_id')),
            'sender_id': current_user.id,
            'sender_name': current_user.name,
            'receiver_id': receiver_id,
            'content': message_content,
            'message_type': message_type,
            'is_read': False,
            'timestamp': saved_message.get('created_at').isoformat() if isinstance(saved_message.get('created_at'), datetime) else saved_message.get('created_at'),
            'created_at': saved_message.get('created_at').isoformat() if isinstance(saved_message.get('created_at'), datetime) else saved_message.get('created_at')
        }
        
        # Add optional fields
        if saved_message.get('latitude'):
            message_data['latitude'] = saved_message['latitude']
        if saved_message.get('longitude'):
            message_data['longitude'] = saved_message['longitude']
        if saved_message.get('trip_id'):
            message_data['trip_id'] = saved_message['trip_id']
        if saved_message.get('event_id'):
            message_data['event_id'] = saved_message['event_id']
        
        # Get conversation ID for room
        conversation_id = get_conversation_id(current_user.id, receiver_id)
        
        # Emit to conversation room (both users should be in this room)
        # Important: exclude sender to avoid duplicate rendering (sender already renders locally)
        emit('receive_message', message_data, room=conversation_id, include_self=False)

        # Also emit to receiver's personal room so their inbox can update even if they haven't joined the conversation room yet
        emit('receive_message', message_data, room=str(receiver_id))

        print(f"Message emitted to room {conversation_id}: {message_data['content'][:50]}...")
        
        # Emit delivery confirmation to sender
        emit('message_delivered', {
            'message_id': message_data['message_id'],
            'sender_id': current_user.id,
            'receiver_id': receiver_id
        }, room=str(current_user.id))
        
    except Exception as e:
        print(f"Error sending message: {e}")
        import traceback
        traceback.print_exc()
        emit('error', {'message': 'Failed to send message'})

@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicator"""
    receiver_id = data['receiver_id']
    is_typing = data['is_typing']
    
    emit('user_typing', {
        'user_id': current_user.id,
        'user_name': current_user.name,
        'is_typing': is_typing
    }, room=receiver_id)

@socketio.on('message_read')
def handle_message_read(data):
    """Handle message read receipt and update MongoDB"""
    try:
        message_id = data.get('message_id')
        sender_id = data.get('sender_id')
        
        if not message_id:
            return
        
        # Mark message as read in MongoDB
        from mongodb_models import mark_message_as_read
        mark_message_as_read(message_id, current_user.id)
        
        # Emit read receipt to sender
        if sender_id:
            emit('message_read_receipt', {
                'message_id': message_id,
                'reader_id': current_user.id,
                'read_at': datetime.utcnow().isoformat()
            }, room=str(sender_id))
        else:
            emit('message_read_receipt', {
                'message_id': message_id,
                'reader_id': current_user.id,
                'read_at': datetime.utcnow().isoformat()
            }, broadcast=False)
        
    except Exception as e:
        print(f"Error handling message read: {e}")
        import traceback
        traceback.print_exc()

@socketio.on('add_reaction')
def handle_add_reaction(data):
    """Handle adding/removing message reactions"""
    try:
        message_id = data.get('message_id')
        reaction = data.get('reaction')
        
        if not message_id or not reaction:
            emit('error', {'message': 'Missing required fields'})
            return
        
        from mongodb_models import add_message_reaction, get_message_reactions
        
        # Add/remove reaction
        result = add_message_reaction(message_id, current_user.id, reaction)
        
        if result:
            # Get updated reactions
            reactions = get_message_reactions(message_id)
            
            # Emit to conversation room
            conversation_id = get_conversation_id(current_user.id, data.get('receiver_id', 0))
            emit('reaction_update', {
                'message_id': message_id,
                'reactions': reactions,
                'action': result,  # 'added' or 'removed'
                'user_id': current_user.id,
                'reaction': reaction
            }, room=conversation_id)
            
    except Exception as e:
        print(f"Error handling reaction: {e}")
        import traceback
        traceback.print_exc()
        emit('error', {'message': 'Failed to add reaction'})

@socketio.on('get_online_status')
def handle_get_online_status(data):
    """Get online status of users"""
    try:
        user_ids = data.get('user_ids', [])
        from mongodb_models import get_user_online_status
        
        statuses = {}
        for user_id in user_ids:
            status = get_user_online_status(user_id)
            if status:
                statuses[str(user_id)] = status
        
        emit('online_status_update', {'statuses': statuses})
        
    except Exception as e:
        print(f"Error getting online status: {e}")
        emit('error', {'message': 'Failed to get online status'})

@socketio.on('join_conversation')
def handle_join_conversation(data):
    """Handle joining a conversation room with enhanced features"""
    conversation_id = data['conversation_id']
    join_room(conversation_id)
    
    # Update user online status
    from mongodb_models import update_user_online_status
    update_user_online_status(current_user.id, True)
    
    emit('user_joined', {
        'user_id': current_user.id,
        'conversation_id': conversation_id,
        'user_name': current_user.name
    })

@socketio.on('leave_conversation')
def handle_leave_conversation(data):
    """Handle leaving a conversation room"""
    conversation_id = data['conversation_id']
    leave_room(conversation_id)
    emit('user_left', {
        'user_id': current_user.id,
        'conversation_id': conversation_id,
        'user_name': current_user.name
    })

@socketio.on('connect')
def handle_connect():
    """Handle socket connection with online status"""
    if current_user.is_authenticated:
        join_room(str(current_user.id))
        
        # Update online status
        from mongodb_models import update_user_online_status
        update_user_online_status(current_user.id, True)
        
        emit('user_connected', {
            'user_id': current_user.id,
            'username': current_user.name,
            'online_at': datetime.utcnow().isoformat()
        })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle socket disconnection with offline status"""
    if current_user.is_authenticated:
        leave_room(str(current_user.id))
        
        # Update offline status
        from mongodb_models import update_user_online_status
        update_user_online_status(current_user.id, False)
        
        emit('user_disconnected', {
            'user_id': current_user.id,
            'username': current_user.name,
            'offline_at': datetime.utcnow().isoformat()
        })

@socketio.on('start_typing')
def handle_start_typing(data):
    """Handle typing start with conversation tracking"""
    try:
        receiver_id = data.get('receiver_id')
        if not receiver_id:
            return
        
        conversation_id = get_conversation_id(current_user.id, receiver_id)
        
        # Save typing status to MongoDB
        from mongodb_models import save_typing_status
        save_typing_status(current_user.id, conversation_id, True)
        
        # Emit to receiver
        emit('user_typing', {
            'user_id': current_user.id,
            'user_name': current_user.name,
            'conversation_id': conversation_id,
            'is_typing': True
        }, room=str(receiver_id))
        
    except Exception as e:
        print(f"Error handling typing start: {e}")

@socketio.on('stop_typing')
def handle_stop_typing(data):
    """Handle typing stop"""
    try:
        receiver_id = data.get('receiver_id')
        if not receiver_id:
            return
        
        conversation_id = get_conversation_id(current_user.id, receiver_id)
        
        # Remove typing status from MongoDB
        from mongodb_models import save_typing_status
        save_typing_status(current_user.id, conversation_id, False)
        
        # Emit to receiver
        emit('user_stopped_typing', {
            'user_id': current_user.id,
            'conversation_id': conversation_id,
            'is_typing': False
        }, room=str(receiver_id))
        
    except Exception as e:
        print(f"Error handling typing stop: {e}")

@socketio.on('get_typing_users')
def handle_get_typing_users(data):
    """Get users currently typing in a conversation"""
    try:
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            return
        
        from mongodb_models import get_typing_users
        typing_user_ids = get_typing_users(conversation_id)
        
        # Get user details for typing users
        typing_users = []
        for user_id in typing_user_ids:
            if user_id != current_user.id:  # Don't include self
                user = User.query.get(user_id)
                if user:
                    typing_users.append({
                        'user_id': user.id,
                        'user_name': user.name
                    })
        
        emit('typing_users_update', {
            'conversation_id': conversation_id,
            'typing_users': typing_users
        })
        
    except Exception as e:
        print(f"Error getting typing users: {e}")

@chat_bp.route('/api/search-users')
@login_required
def search_users():
    """API endpoint to search for users to start conversations with"""
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        if not query or len(query) < 2:
            return jsonify({'users': [], 'total': 0})
        
        # Search users by name or email (exclude current user)
        users_query = User.query.filter(
            User.id != current_user.id,
            db.or_(
                User.name.ilike(f'%{query}%'),
                User.email.ilike(f'%{query}%'),
                User.location.ilike(f'%{query}%'),
                User.interests.ilike(f'%{query}%'),
                User.bio.ilike(f'%{query}%')
            )
        )
        
        # Get total count
        total_count = users_query.count()
        
        # Apply pagination and get results
        users = users_query.offset(offset).limit(limit).all()
        
        # Format user data for frontend
        users_list = []
        for user in users:
            # Check if there's already a conversation
            conversation_id = get_conversation_id(current_user.id, user.id)
            has_conversation = False
            
            # Check MongoDB for existing conversation
            mongo_db = get_mongo_db()
            if mongo_db is not None:
                existing_conv = mongo_db.conversations.find_one({'conversation_id': conversation_id})
                has_conversation = existing_conv is not None
            
            users_list.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'age': user.age,
                'gender': user.gender,
                'bio': user.bio,
                'location': user.location,
                'occupation': user.occupation,
                'interests': user.interests,
                'profile_picture': user.profile_picture or f'/static/img/avatars/{user.id % 10 + 1}.jpg',
                'is_online': get_user_online_status(user.id) is not None,
                'has_conversation': has_conversation,
                'travel_style': user.travel_style,
                'preferred_destinations': user.preferred_destinations
            })
        
        return jsonify({
            'users': users_list,
            'total': total_count,
            'query': query,
            'offset': offset,
            'limit': limit
        })
        
    except Exception as e:
        print(f"Error searching users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to search users', 'users': [], 'total': 0}), 500

@chat_bp.route('/api/available-users')
@login_required
def get_available_users():
    """API endpoint to get all available users for starting conversations"""
    try:
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get all users except current user, ordered by most recent profile updates
        users_query = User.query.filter(
            User.id != current_user.id
        ).order_by(User.created_at.desc())
        
        # Get total count
        total_count = users_query.count()
        
        # Apply pagination
        users = users_query.offset(offset).limit(limit).all()
        
        # Format user data for frontend
        users_list = []
        for user in users:
            # Check if there's already a conversation
            conversation_id = get_conversation_id(current_user.id, user.id)
            has_conversation = False
            
            # Check MongoDB for existing conversation
            mongo_db = get_mongo_db()
            if mongo_db is not None:
                existing_conv = mongo_db.conversations.find_one({'conversation_id': conversation_id})
                has_conversation = existing_conv is not None
            
            # Only include users they're not already chatting with
            if not has_conversation:
                users_list.append({
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'age': user.age,
                    'gender': user.gender,
                    'bio': user.bio,
                    'location': user.location,
                    'occupation': user.occupation,
                    'interests': user.interests,
                    'profile_picture': user.profile_picture or f'/static/img/avatars/{user.id % 10 + 1}.jpg',
                    'is_online': get_user_online_status(user.id) is not None,
                    'travel_style': user.travel_style,
                    'preferred_destinations': user.preferred_destinations
                })
        
        return jsonify({
            'users': users_list,
            'total': total_count,
            'offset': offset,
            'limit': limit
        })
        
    except Exception as e:
        print(f"Error getting available users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get available users', 'users': [], 'total': 0}), 500

@chat_bp.route('/api/start-conversation/<int:user_id>', methods=['POST'])
@login_required
def start_conversation(user_id):
    """API endpoint to start a new conversation with a user"""
    try:
        # Check if user exists
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if conversation already exists
        conversation_id = get_conversation_id(current_user.id, user_id)
        mongo_db = get_mongo_db()
        
        existing_conversation = None
        if mongo_db is not None:
            existing_conversation = mongo_db.conversations.find_one({'conversation_id': conversation_id})
        
        if existing_conversation:
            return jsonify({
                'success': True,
                'conversation_id': conversation_id,
                'message': 'Conversation already exists',
                'user': {
                    'id': target_user.id,
                    'name': target_user.name,
                    'profile_picture': target_user.profile_picture or f'/static/img/avatars/{target_user.id % 10 + 1}.jpg'
                }
            })
        
        # Create new conversation in MongoDB
        if mongo_db is not None:
            new_conversation = {
                'conversation_id': conversation_id,
                'user1_id': current_user.id,
                'user2_id': user_id,
                'participants': [current_user.id, user_id],
                'created_at': datetime.utcnow(),
                'last_message': None,
                'last_message_at': datetime.utcnow(),
                'messages_count': 0
            }
            mongo_db.conversations.insert_one(new_conversation)
            print(f"Created new conversation: {conversation_id}")
        
        return jsonify({
            'success': True,
            'conversation_id': conversation_id,
            'message': 'Conversation created successfully',
            'user': {
                'id': target_user.id,
                'name': target_user.name,
                'profile_picture': target_user.profile_picture or f'/static/img/avatars/{target_user.id % 10 + 1}.jpg'
            }
        })
        
    except Exception as e:
        print(f"Error starting conversation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to start conversation'}), 500

@chat_bp.route('/api/send', methods=['POST'])
@login_required
def send_message():
    """HTTP API endpoint to send a message"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        receiver_id = data.get('receiver_id')
        message_content = data.get('message')
        message_type = data.get('message_type', 'text')
        
        if not receiver_id or not message_content:
            return jsonify({'error': 'Missing receiver_id or message'}), 400
        
        # Check if receiver exists
        receiver = User.query.get(receiver_id)
        if not receiver:
            return jsonify({'error': 'Receiver not found'}), 404
        
        # Save message to MongoDB
        saved_message = save_message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=message_content,
            message_type=message_type,
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            trip_id=data.get('trip_id'),
            event_id=data.get('event_id'),
            attachment_url=data.get('attachment_url')
        )
        
        if not saved_message:
            return jsonify({'error': 'Failed to save message (MongoDB unavailable)'}), 500
        
        # Emit to receiver via Socket.IO (if they're online)
        from extensions import socketio
        message_data = {
            'message_id': saved_message.get('message_id') or str(saved_message.get('_id')),
            'sender_id': current_user.id,
            'sender_name': current_user.name,
            'receiver_id': receiver_id,
            'content': message_content,
            'message_type': message_type,
            'is_read': False,
            'timestamp': saved_message.get('created_at').isoformat() if isinstance(saved_message.get('created_at'), datetime) else saved_message.get('created_at'),
            'created_at': saved_message.get('created_at').isoformat() if isinstance(saved_message.get('created_at'), datetime) else saved_message.get('created_at')
        }
        
        # Add optional fields
        if saved_message.get('latitude'):
            message_data['latitude'] = saved_message['latitude']
        if saved_message.get('longitude'):
            message_data['longitude'] = saved_message['longitude']
        if saved_message.get('trip_id'):
            message_data['trip_id'] = saved_message['trip_id']
        if saved_message.get('event_id'):
            message_data['event_id'] = saved_message['event_id']
        if saved_message.get('attachment_url'):
            message_data['attachment_url'] = saved_message['attachment_url']
        
        # Emit to receiver
        socketio.emit('receive_message', message_data, room=str(receiver_id))
        
        # Also emit back to sender for confirmation
        socketio.emit('message_sent', {
            'message_id': message_data['message_id'],
            'status': 'sent',
            'timestamp': message_data['timestamp']
        }, room=str(current_user.id))
        
        return jsonify({
            'success': True,
            'message_id': message_data['message_id'],
            'timestamp': message_data['timestamp']
        })
        
    except Exception as e:
        print(f"Error sending message: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to send message'}), 500

# SocketIO events