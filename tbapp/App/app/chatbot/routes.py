import sqlite3
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from datetime import datetime
import random
def get_openai_client():
    """Get or initialize the OpenAI client using app config"""
    global client, USE_NEW_OPENAI
    if 'client' in globals() and client:
        return client, USE_NEW_OPENAI

    api_key = current_app.config.get('OPENAI_API_KEY')
    if not api_key:
        print("[WARNING] OpenAI API key not found in config")
        return None, False

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        USE_NEW_OPENAI = True
        return client, True
    except (ImportError, Exception) as e:
        try:
            import openai
            openai.api_key = api_key
            client = openai
            USE_NEW_OPENAI = False
            return client, False
        except Exception as e2:
            print(f"[WARNING] OpenAI initialization failed: {e2}")
            return None, False
import os
import json

# Import models
from extensions import db
from models import User, Match, Message, Conversation, ChatbotConversation, ChatbotMessage

# Blueprint configuration
chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/chatbot', template_folder='templates')

_openai_checked = False

@chatbot_bp.before_app_request
def check_openai():
    global _openai_checked
    if not _openai_checked:
        client, is_new = get_openai_client()
        if client:
            print(f"[OK] OpenAI client initialized ({'v1+' if is_new else 'legacy'})")
        else:
            print("[WARNING] OpenAI not available - chatbot features will be limited")
        _openai_checked = True

@chatbot_bp.route('/')
@login_required
def chatbot():
    """Chatbot page with conversation history"""
    # Get user's conversation history
    conversations = ChatbotConversation.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).order_by(ChatbotConversation.updated_at.desc()).limit(10).all()
    
    current_time = datetime.now().strftime("%I:%M %p")
    return render_template('chatbot/chatbot.html', 
                         current_time=current_time,
                         conversations=conversations)

@chatbot_bp.route('/api/conversations')
@login_required
def get_conversations():
    """API endpoint to get user's chatbot conversation history"""
    conversations = ChatbotConversation.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).order_by(ChatbotConversation.updated_at.desc()).all()
    
    conversation_data = []
    for conv in conversations:
        last_message = ChatbotMessage.query.filter_by(
            conversation_id=conv.id
        ).order_by(ChatbotMessage.created_at.desc()).first()
        
        conversation_data.append({
            'id': conv.id,
            'title': conv.title,
            'created_at': conv.created_at.strftime('%Y-%m-%d %H:%M'),
            'updated_at': conv.updated_at.strftime('%Y-%m-%d %H:%M'),
            'last_message': last_message.content if last_message else 'No messages yet',
            'message_count': len(conv.messages)
        })
    
    return jsonify(conversation_data)

@chatbot_bp.route('/api/conversation/<int:conversation_id>/messages')
@login_required
def get_conversation_messages(conversation_id):
    """Get messages for a specific conversation"""
    conversation = ChatbotConversation.query.filter_by(
        id=conversation_id,
        user_id=current_user.id
    ).first_or_404()
    
    messages = ChatbotMessage.query.filter_by(
        conversation_id=conversation_id
    ).order_by(ChatbotMessage.created_at.asc()).all()
    
    message_data = []
    for msg in messages:
        message_data.append({
            'id': msg.id,
            'content': msg.content,
            'role': msg.role,
            'is_command': msg.is_command,
            'command_executed': msg.command_executed,
            'created_at': msg.created_at.strftime('%H:%M')
        })
    
    return jsonify({
        'conversation': {
            'id': conversation.id,
            'title': conversation.title,
            'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M')
        },
        'messages': message_data
    })

@chatbot_bp.route('/api/conversation/new', methods=['POST'])
@login_required
def create_new_conversation():
    """Create a new chatbot conversation"""
    data = request.get_json()
    title = data.get('title', f'Chat {datetime.now().strftime("%m/%d %H:%M")}')
    
    conversation = ChatbotConversation(
        user_id=current_user.id,
        title=title
    )
    
    db.session.add(conversation)
    db.session.commit()
    
    return jsonify({
        'id': conversation.id,
        'title': conversation.title,
        'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M')
    })

@chatbot_bp.route('/api/openai/chat', methods=['POST'])
@login_required
def openai_chat():
    """Enhanced OpenAI chat with conversation storage and webapp control"""
    try:
        data = request.get_json()
        print(f"Received chat request: {data}")  # Debug log
        
        # Extract data
        message = data.get('message', '')
        conversation_id = data.get('conversation_id')
        
        print(f"Processing message: '{message}' for user: {current_user.name}")  # Debug log
        
        # Get or create conversation
        if conversation_id:
            conversation = ChatbotConversation.query.filter_by(
                id=conversation_id,
                user_id=current_user.id
            ).first()
            if not conversation:
                return jsonify({'error': 'Conversation not found'}), 404
        else:
            # Create new conversation
            title = message[:50] + '...' if len(message) > 50 else message
            conversation = ChatbotConversation(
                user_id=current_user.id,
                title=title
            )
            db.session.add(conversation)
            db.session.commit()
        
        # Check if it's a command
        is_command = message.strip().startswith('/')
        command_result = None
        
        # Execute command if it's a command
        if is_command:
            command_result = execute_webapp_command(message.strip())
        
        # Store user message
        user_message = ChatbotMessage(
            conversation_id=conversation.id,
            user_id=current_user.id,
            content=message,
            role='user',
            is_command=is_command,
            command_executed=command_result is not None if is_command else False
        )
        db.session.add(user_message)
        
        # Get conversation history for context
        recent_messages = ChatbotMessage.query.filter_by(
            conversation_id=conversation.id
        ).order_by(ChatbotMessage.created_at.desc()).limit(10).all()
        
        # Build conversation history for OpenAI
        messages_for_ai = []
        for msg in reversed(recent_messages):
            messages_for_ai.append({
                'role': msg.role,
                'content': msg.content
            })
        
        # Add current message
        messages_for_ai.append({'role': 'user', 'content': message})
        
        # Enhanced system prompt with webapp control capabilities
        system_prompt = f"""
You are Travel Buddy AI Assistant, an advanced AI chatbot with full administrative control over the Travel Buddy app. You must provide UNIQUE, PERSONALIZED, and ACCURATE responses for each question - never give generic or repeated answers.

IMPORTANT: Each response MUST be different and specific to the user's question. Analyze each query carefully and provide relevant, helpful answers.

User Information:
- Name: {current_user.name}
- Email: {current_user.email}
- Profile Complete: {current_user.profile_complete}
- Subscription: {current_user.subscription_type}
- Location: {current_user.location or 'Not set'}
- Age: {current_user.age or 'Not set'}
- Bio: {current_user.bio or 'Not set'}
- Interests: {current_user.interests or 'Not set'}

Your Core Capabilities:
1. **Personalized Travel Advice**: Give specific advice based on user's profile, travel style, and interests
2. **Webapp Control**: Execute commands to modify settings, view data, and manage the app
3. **Profile Optimization**: Analyze and suggest improvements to user profiles for better matching
4. **Match Analysis**: Provide insights about user's travel buddies and matching patterns
5. **Real-time App Management**: Modify user preferences, subscription, and settings

Command Execution:
When users type commands starting with '/', execute them immediately and provide detailed feedback:
- /profile [action] - Manage user profile (view, edit, analyze)
- /matches [action] - Handle buddies (view, analyze, manage)
- /messages [action] - Message management (count, mark read, analyze)
- /settings [setting] [value] - Change app settings instantly
- /search [criteria] - Search for buddies with specific criteria
- /analytics - Show detailed user analytics and trip insights
- /premium [action] - Manage subscription (upgrade, cancel, status)
- /safety [action] - Access safety features (block, report, tips, location check)
- /trips [action] - Manage your planned trips
- /help - Show all available commands

Response Guidelines:
1. **Be Specific**: Reference the user's actual data and profile information
2. **Be Unique**: Never repeat the same response for different questions
3. **Be Actionable**: Provide concrete next steps and suggestions
4. **Be Personal**: Use the user's name and reference their specific situation
5. **Be Engaging**: Use appropriate emojis and conversational tone
6. **Be Accurate**: Provide factual information about travel and safety

For each response:
- Address the specific question asked
- Incorporate relevant user data when appropriate
- Provide actionable advice or information
- Suggest follow-up actions or commands when relevant
- Use the user's name and personalize the response

Personality: Friendly, knowledgeable, adventurous, and professional travel advisor with technical webapp control abilities.

IMPORTANT: If a command was executed, acknowledge the specific action taken and its result.
"""
        
        # Prepare messages for OpenAI
        ai_messages = [{'role': 'system', 'content': system_prompt}]
        ai_messages.extend(messages_for_ai[-8:])  # Keep last 8 messages for context
        
        # Add command result context if available
        if command_result:
            ai_messages.append({
                'role': 'system', 
                'content': f'Command executed successfully. Result: {command_result}'
            })
        
        # Call OpenAI API with proper error handling
        try:
            ai_client, is_new = get_openai_client()
            if not ai_client:
                raise Exception("OpenAI client not initialized")

            if is_new:
                # Use new OpenAI client
                response = ai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=ai_messages,
                    max_tokens=800,
                    temperature=0.7,
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                )
                bot_response = response.choices[0].message.content
            else:
                # Use legacy OpenAI API
                response = ai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=ai_messages,
                    max_tokens=800,
                    temperature=0.7,
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                )
                bot_response = response.choices[0].message.content
                
            print(f"OpenAI Response: {bot_response[:100]}...")  # Debug log
            
        except Exception as openai_error:
            print(f"OpenAI API Error: {str(openai_error)}")
            # Use enhanced fallback with command execution
            bot_response = handle_fallback_response(message, current_user)
            if command_result:
                bot_response = f"Command executed: {command_result}\n\n{bot_response}"
        
        # Store bot message
        bot_message = ChatbotMessage(
            conversation_id=conversation.id,
            user_id=current_user.id,
            content=bot_response,
            role='assistant'
        )
        db.session.add(bot_message)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': bot_response,
            'response': bot_response,
            'conversation_id': conversation.id,
            'conversation_title': conversation.title,
            'timestamp': datetime.now().strftime("%I:%M %p"),
            'command_executed': command_result is not None if is_command else False,
            'command_result': command_result
        })
        
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        
        # Enhanced fallback with command handling
        fallback_response = handle_fallback_response(message, current_user)
        
        # Store fallback response if conversation exists
        if 'conversation' in locals():
            bot_message = ChatbotMessage(
                conversation_id=conversation.id,
                user_id=current_user.id,
                content=fallback_response,
                role='assistant'
            )
            db.session.add(bot_message)
            db.session.commit()
        
        return jsonify({
            'message': fallback_response,
            'response': fallback_response,
            'timestamp': datetime.now().strftime("%I:%M %p"),
            'fallback': True
        })

def execute_webapp_command(command):
    """Execute webapp control commands and return results"""
    command_lower = command.lower().strip()
    
    try:
        if command_lower.startswith('/profile'):
            return handle_profile_command(command_lower)
        elif command_lower.startswith('/matches'):
            return handle_matches_command(command_lower)
        elif command_lower.startswith('/messages'):
            return handle_messages_command(command_lower)
        elif command_lower.startswith('/settings'):
            return handle_settings_command(command_lower)
        elif command_lower.startswith('/search'):
            return handle_search_command(command_lower)
        elif command_lower.startswith('/analytics'):
            return handle_analytics_command(command_lower)
        elif command_lower.startswith('/premium'):
            return handle_premium_command(command_lower)
        elif command_lower.startswith('/safety'):
            return handle_safety_command(command_lower)
        elif command_lower.startswith('/help'):
            return handle_help_command(command_lower)
        else:
            return f"Unknown command: {command}. Type /help for available commands."
    except Exception as e:
        return f"Error executing command: {str(e)}"

def handle_profile_command(command):
    """Handle profile-related commands"""
    from flask_login import current_user
    parts = command.split()
    
    if len(parts) == 1 or 'view' in command:
        # Show profile information
        profile_info = {
            'name': current_user.name,
            'age': current_user.age,
            'location': current_user.location,
            'bio': current_user.bio,
            'occupation': current_user.occupation,
            'interests': current_user.interests,
            'profile_complete': current_user.profile_complete
        }
        return f"Profile loaded: {json.dumps(profile_info, indent=2)}"
    
    elif 'edit' in command or 'update' in command:
        return "Profile editing mode activated. You can update: name, age, bio, location, occupation, interests."
    
    elif 'complete' in command:
        if not current_user.profile_complete:
            current_user.profile_complete = True
            db.session.commit()
            return "Profile marked as complete!"
        else:
            return "Profile is already complete."
    
    elif 'incomplete' in command:
        current_user.profile_complete = False
        db.session.commit()
        return "Profile marked as incomplete."
    
    return "Profile command executed. Available actions: view, edit, complete, incomplete"

def handle_matches_command(command):
    """Handle matches-related commands"""
    matches = Match.query.filter_by(user_id=current_user.id, matched=True).all()
    
    if 'count' in command or 'view' in command or len(command.split()) == 1:
        match_count = len(matches)
        recent_matches = matches[-5:] if matches else []
        match_names = []
        
        for match in recent_matches:
            matched_user = User.query.get(match.matched_user_id)
            if matched_user:
                match_names.append(matched_user.name)
        
        return f"You have {match_count} total matches. Recent matches: {', '.join(match_names) if match_names else 'None'}"
    
    elif 'clear' in command:
        # This would be a dangerous operation, so just simulate
        return "Match clearing requires additional confirmation. Contact support for bulk match management."
    
    return f"Matches command executed. You have {len(matches)} matches."

def handle_messages_command(command):
    """Handle messages-related commands"""
    sent_messages = Message.query.filter_by(sender_id=current_user.id).count()
    received_messages = Message.query.filter_by(receiver_id=current_user.id).count()
    unread_messages = Message.query.filter_by(receiver_id=current_user.id, is_read=False).count()
    
    if 'count' in command or 'view' in command or len(command.split()) == 1:
        return f"Messages: {sent_messages} sent, {received_messages} received, {unread_messages} unread"
    
    elif 'unread' in command:
        return f"You have {unread_messages} unread messages"
    
    elif 'mark' in command and 'read' in command:
        # Mark all messages as read
        Message.query.filter_by(receiver_id=current_user.id, is_read=False).update({'is_read': True})
        db.session.commit()
        return f"Marked {unread_messages} messages as read"
    
    return "Messages command executed"

def handle_settings_command(command):
    """Handle settings-related commands"""
    parts = command.split()
    
    if len(parts) == 1:
        settings_info = {
            'subscription': current_user.subscription_type,
            'profile_complete': current_user.profile_complete,
            'preferred_age_range': f"{current_user.preferred_age_min}-{current_user.preferred_age_max}",
            'preferred_gender': current_user.preferred_gender,
            'preferred_location': current_user.preferred_location
        }
        return f"Current settings: {json.dumps(settings_info, indent=2)}"
    
    elif 'age' in command:
        # Update age preferences
        try:
            if 'min' in command:
                age = int([p for p in parts if p.isdigit()][0])
                current_user.preferred_age_min = age
                db.session.commit()
                return f"Minimum age preference updated to {age}"
            elif 'max' in command:
                age = int([p for p in parts if p.isdigit()][0])
                current_user.preferred_age_max = age
                db.session.commit()
                return f"Maximum age preference updated to {age}"
        except (IndexError, ValueError):
            return "Please specify a valid age number"
    
    return "Settings command executed. You can modify: age preferences, gender preferences, location"

def handle_search_command(command):
    """Handle search-related commands"""
    parts = command.split()
    
    if len(parts) == 1:
        return "Search mode activated. You can search by: age, location, interests, occupation"
    
    # Simulate search functionality
    search_term = ' '.join(parts[1:])
    
    # Search users based on criteria
    if 'age' in search_term:
        try:
            age = int([p for p in parts if p.isdigit()][0])
            users = User.query.filter(User.age == age, User.id != current_user.id).limit(5).all()
            return f"Found {len(users)} users aged {age}"
        except (IndexError, ValueError):
            return "Please specify a valid age to search for"
    
    elif 'location' in search_term or any(city in search_term for city in ['new york', 'los angeles', 'chicago', 'miami']):
        location_term = search_term.replace('location', '').strip()
        users = User.query.filter(User.location.contains(location_term), User.id != current_user.id).limit(5).all()
        return f"Found {len(users)} users in location matching '{location_term}'"
    
    else:
        # General search
        users = User.query.filter(User.id != current_user.id).limit(10).all()
        return f"Search completed. Found {len(users)} users matching your criteria"

def handle_analytics_command(command):
    """Handle analytics-related commands"""
    # Calculate user statistics
    match_count = Match.query.filter_by(user_id=current_user.id).count()
    message_count = Message.query.filter_by(sender_id=current_user.id).count()
    received_count = Message.query.filter_by(receiver_id=current_user.id).count()
    
    days_since_join = (datetime.utcnow() - current_user.created_at).days
    
    analytics = {
        'profile_views': random.randint(50, 200),  # Simulated data
        'matches': match_count,
        'messages_sent': message_count,
        'messages_received': received_count,
        'days_active': days_since_join,
        'profile_completion': '100%' if current_user.profile_complete else '75%',
        'last_active': 'Today'
    }
    
    return f"Your Connectify Analytics:\n{json.dumps(analytics, indent=2)}"

def handle_premium_command(command):
    """Handle premium/subscription commands"""
    current_plan = current_user.subscription_type
    
    if 'status' in command or len(command.split()) == 1:
        return f"Current subscription: {current_plan.upper()}. Upgrade available to Premium or VIP for enhanced features."
    
    elif 'upgrade' in command:
        if 'premium' in command:
            current_user.subscription_type = 'premium'
            db.session.commit()
            return "Upgraded to Premium! You now have unlimited likes and can see who liked you."
        elif 'vip' in command:
            current_user.subscription_type = 'vip'
            db.session.commit()
            return "Upgraded to VIP! You now have all premium features plus priority support and profile boosts."
        else:
            return "Available upgrades: Premium ($19.99/month) or VIP ($29.99/month)"
    
    elif 'cancel' in command:
        current_user.subscription_type = 'basic'
        db.session.commit()
        return "Subscription cancelled. Reverted to Basic plan."
    
    return "Premium command executed. Available actions: status, upgrade, cancel"

def handle_safety_command(command):
    """Handle safety and privacy commands"""
    if 'block' in command:
        return "Block feature accessed. You can block users from their profile or report them for inappropriate behavior."
    
    elif 'report' in command:
        return "Report feature accessed. You can report users for harassment, fake profiles, or inappropriate content."
    
    elif 'privacy' in command:
        return "Privacy settings accessed. You can control profile visibility, message permissions, and location sharing."
    
    elif 'tips' in command:
        return "Safety tips: Always meet in public places, tell someone about your date plans, trust your instincts, and report suspicious behavior."
    
    return "Safety command executed. Available actions: block, report, privacy, tips"

def handle_help_command(command):
    """Handle help commands"""
    help_text = """
🤖 **Travel Buddy AI Assistant Commands**

📋 **Profile & Trips:**
• `/profile` - View your profile
• `/profile edit` - Edit profile information
• `/trips` - View your upcoming trips
• `/profile complete` - Mark profile as complete

🌍 **Buddies & Matching:**
• `/matches` - View your travel buddies
• `/search [criteria]` - Find buddies by location/interests
• `/messages` - Check message statistics

[GEAR] **Settings & Preferences:**
• `/settings` - View current settings
• `/settings age min [number]` - Set minimum age for buddies
• `/settings age max [number]` - Set maximum age for buddies

📊 **Analytics & Insights:**
• `/analytics` - View your activity analytics
• `/premium` - Manage subscription

[SHIELD] **Safety & Privacy:**
• `/safety` - Access safety features
• `/safety tips` - Get travel safety advice
• `/safety check` - Perform local safety check

❓ **Help:**
• `/help` - Show this help message

I can also provide travel advice, destination tips, and help find your perfect travel companion!
    """
    
    return help_text

def handle_fallback_response(message, user=None):
    """Enhanced fallback responses with Travel Buddy context and user data"""
    import random
    
    if not message:
        responses = [
            f"I'm having trouble connecting right now. Please try again in a moment! 🤖",
            f"Oops! My connection hiccupped. Give me another try! ⚡",
            f"Technical difficulties on my end. Let's try that again! 🔧"
        ]
        return random.choice(responses)
        
    message_lower = message.lower()
    user_name = user.name if user else "there"
    
    # Handle commands with specific responses
    if message_lower.startswith('/'):
        command_responses = [
            f"I see you're trying to use a command, {user_name}! Type `/help` to see all available commands I can execute for you. 🚀",
            f"Command detected, {user_name}! While I'm offline, type `/help` when I'm back to see what I can do. [GEAR]",
            f"Great thinking with commands, {user_name}! Use `/help` to explore all my capabilities. [LIGHTBULB]"
        ]
        return random.choice(command_responses)
    
    # Personalized responses based on Travel Buddy context
    if user:
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            greetings = [
                f"Hello {user_name}! 👋 Welcome to Travel Buddy! How can I help you plan your next adventure today?",
                f"Hi there, {user_name}! 😊 Ready to find your perfect travel companion? What destination is on your mind?",
                f"Hey {user_name}! 🌍 Your personal travel assistant is here. Ready to explore the world?"
            ]
            return random.choice(greetings)
        
        if any(word in message_lower for word in ['premium', 'subscription', 'upgrade', 'paid']):
            premium_info = [
                f"[SPARKLE] Premium perks: Unlimited likes, priority matching, and advanced travel filters! It's like traveling with a VIP pass, {user_name}. Check `/premium` for options!",
                f"🚀 Level up your travel game! Premium offers exclusive features like profile boosts and detailed analytics. Worth every penny for frequent travelers!",
                f"💎 Premium transforms your experience: No limits, enhanced visibility, and priority support! Travel success starts with the right tools, {user_name}!"
            ]
            return random.choice(premium_info)
    
    if any(word in message_lower for word in ['safety', 'safe', 'report', 'block']):
        safety_advice = [
            f"[SHIELD] Safety first always, {user_name}! Meet in public, tell friends your plans, trust your instincts, and use our reporting tools. Your safety is our top priority!",
            f"[LOCK] Smart travel safety: Video chat with buddies before meeting, choose public venues, and never share personal info too quickly. Stay safe out there!",
            f"[WARNING] Essential safety reminders: Public first meetings, inform friends, trust gut feelings, and report any concerning behavior. We're here to protect you!"
        ]
        return random.choice(safety_advice)
    
    elif any(word in message_lower for word in ['trip', 'plan', 'idea', 'suggestion', 'activity']):
        trip_ideas = [
            f"[STAR] Creative trip ideas, {user_name}: Hiking adventures, cultural city tours, food tasting journeys, or relaxing beach getaways! What's your style?",
            f"[LIGHTBULB] Trip inspiration: Museum visits, national parks, local festivals, or off-the-beaten-path explores! Shared experiences make the best trips.",
            f"[ART] Unique travel concepts: Volunteer programs, language immersion, photography tours, or cooking classes abroad! Make it memorable!"
        ]
        return random.choice(trip_ideas)
    
    elif any(word in message_lower for word in ['message', 'chat', 'conversation', 'talk']):
        conversation_tips = [
            f"💬 Conversation gold: Ask about their bucket list, share funny travel mishaps, and be genuinely curious about their travel style. Show your personality!",
            f"[CHAT] Chat like a pro: Reference their dream destinations, ask follow-up questions, and share your best travel tips. Chemistry builds naturally!",
            f"📱 Messaging mastery: Be authentic, respond thoughtfully, and share your excitement about upcoming trips. Good conversations flow both ways!"
        ]
        return random.choice(conversation_tips)
    
    else:
        # Varied general responses
        general_responses = [
            f"Interesting question, {user_name}! 🤔 I'm here to help with all things Travel Buddy - trip planning, finding buddies, destination tips, and more!",
            f"Great to chat with you, {user_name}! 😊 Whether you need travel tips, app help, or budget advice, I'm your go-to assistant. What's on your mind?",
            f"I love helping with travel questions, {user_name}! 🌍 From itinerary building to companion matching, I've got insights for your next adventure!",
            f"You've got my attention, {user_name}! ✈️ I specialize in travel success, app mastery, and destination insights. How can I help you plan today?"
        ]
        return random.choice(general_responses)

# Legacy endpoints for backward compatibility - redirect to enhanced versions
@chatbot_bp.route('/api/message', methods=['POST'])
@login_required
def handle_message_legacy():
    """Legacy API endpoint - redirects to new enhanced endpoint"""
    # Use the new enhanced endpoint
    return openai_chat()
