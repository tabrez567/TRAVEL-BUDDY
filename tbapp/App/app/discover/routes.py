from flask import Blueprint, render_template, jsonify, request, current_app
from flask_login import login_required, current_user
from models import User, UserPreference, Match
from utils.matching import calculate_match_percentage
import random

discover_bp = Blueprint('discover', __name__, url_prefix='/discover')

@discover_bp.route('/')
@login_required
def discover():
    """Render the discover page"""
    return render_template('discover/discover.html')

from flask import Blueprint, render_template, jsonify, request, current_app
from flask_login import login_required, current_user
from models import User, UserPreference, Match
from utils.matching import calculate_match_percentage
import random
import json

discover_bp = Blueprint('discover', __name__, url_prefix='/discover')

@discover_bp.route('/')
@login_required
def discover_page():
    """Render the discover page"""
    return render_template('discover/discover.html')

@discover_bp.route('/search')
@login_required
def search():
    """Render the advanced search page"""
    return render_template('discover/search.html')

@discover_bp.route('/api/recommendations')
@login_required
def get_recommendations():
    """Get profile recommendations based on user preferences"""
    try:
        # Get query parameters
        offset = request.args.get('offset', 0, type=int)
        limit = request.args.get('limit', 12, type=int)
        
        # Get filter parameters
        gender = request.args.get('gender', 'all')
        min_age = request.args.get('min_age', 18, type=int)
        max_age = request.args.get('max_age', 99, type=int)
        distance = request.args.get('distance', 100, type=int)
        relationship_type = request.args.get('relationship_type', 'any')
        interests_str = request.args.get('interests', '')
        interests = [i.strip() for i in interests_str.split(',') if i.strip()] if interests_str else []
        
        # Get user preferences if no specific filters provided
        user_preferences = UserPreference.query.filter_by(user_id=current_user.id).first()
        
        # Build query for potential matches using filters or preferences
        query = User.query.filter(User.id != current_user.id)  # Exclude current user
        
        # Apply gender filter
        if gender != 'all':
            if gender == 'women':
                query = query.filter(User.gender == 'Female')
            elif gender == 'men':
                query = query.filter(User.gender == 'Male')
            elif gender == 'nonbinary':
                query = query.filter(User.gender.in_(['Non-binary', 'Other']))
        elif user_preferences and user_preferences.preferred_gender and user_preferences.preferred_gender != 'Any':
            query = query.filter(User.gender == user_preferences.preferred_gender)
        
        # Apply age filter
        try:
            if user_preferences:
                effective_min_age = max(min_age, user_preferences.min_age or 18)
                effective_max_age = min(max_age, user_preferences.max_age or 99)
            else:
                effective_min_age = min_age
                effective_max_age = max_age
                
            query = query.filter(User.age >= effective_min_age, User.age <= effective_max_age)
        except Exception as age_filter_error:
            current_app.logger.warning(f"Age filter error: {age_filter_error}")
            # Continue without age filter if there's an issue
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        potential_matches = query.offset(offset).limit(limit).all()
        
        # If no matches found, create some dummy data for demo
        if not potential_matches and offset == 0:
            # Create some demo profiles
            demo_profiles = [
                {
                    'id': 'demo_1',
                    'name': 'Emma Johnson',
                    'age': 26,
                    'gender': 'Female',
                    'bio': 'Love traveling and trying new cuisines. Looking for someone genuine and fun!',
                    'occupation': 'Marketing Manager',
                    'profile_picture': '/static/img/avatars/default.jpg'
                },
                {
                    'id': 'demo_2', 
                    'name': 'Michael Chen',
                    'age': 29,
                    'gender': 'Male',
                    'bio': 'Software developer who enjoys hiking and photography. Let\'s explore the world together!',
                    'occupation': 'Software Engineer',
                    'profile_picture': '/static/img/avatars/default.jpg'
                },
                {
                    'id': 'demo_3',
                    'name': 'Sarah Wilson',
                    'age': 24,
                    'gender': 'Female', 
                    'bio': 'Yoga instructor and bookworm. Seeking someone who values mindfulness and growth.',
                    'occupation': 'Yoga Instructor',
                    'profile_picture': '/static/img/avatars/default.jpg'
                }
            ]
            
            # Format demo profiles
            profiles = []
            for demo_user in demo_profiles:
                user_interests = random.sample([
                    "Travel", "Music", "Fitness", "Art", "Food", "Movies", "Reading",
                    "Gaming", "Sports", "Photography", "Technology", "Nature"
                ], random.randint(3, 6))
                
                match_percentage = random.randint(75, 95)
                calculated_distance = random.randint(1, 30)
                
                profiles.append({
                    'id': demo_user['id'],
                    'name': demo_user['name'],
                    'age': demo_user['age'],
                    'profilePicture': demo_user['profile_picture'],
                    'bio': demo_user['bio'],
                    'distance': calculated_distance,
                    'occupation': demo_user['occupation'],
                    'interests': user_interests,
                    'verified': random.choice([True, False]),
                    'activityScore': random.uniform(0.7, 1.0),
                    'compatibilityScore': match_percentage / 100,
                    'matchPercentage': match_percentage
                })
                
            return jsonify({
                'profiles': profiles,
                'hasMore': False,
                'total': len(profiles),
                'offset': offset,
                'limit': limit
            })
        
        # Format profiles for response
        profiles = []
        for user in potential_matches:
            # Get user's profile picture
            profile_pic = user.profile_picture if user.profile_picture else '/static/img/avatars/default.jpg'
            
            # Get user's interests (mock data for now)
            user_interests = [
                "Travel", "Music", "Fitness", "Art", "Food", "Movies", "Reading",
                "Gaming", "Sports", "Photography", "Technology", "Nature"
            ]
            
            # If interests filter is provided, ensure some overlap
            if interests:
                # Add some of the filtered interests to increase relevance
                user_interests = interests[:2] + random.sample(user_interests, min(4, len(user_interests)))
            else:
                user_interests = random.sample(user_interests, random.randint(3, 6))
            
            # Calculate match percentage
            match_percentage = calculate_match_percentage(current_user, user) if hasattr(current_user, 'interests') else None
            if not match_percentage:
                # Generate based on interest overlap if interests are provided
                if interests and user_interests:
                    overlap = len(set(interests) & set(user_interests))
                    base_score = min(90, 60 + (overlap * 10))
                    match_percentage = base_score + random.randint(-10, 10)
                else:
                    match_percentage = random.randint(65, 95)
            
            # Calculate distance (mock for demo)
            calculated_distance = min(distance, random.randint(1, min(50, distance)))
            
            # Create bio with variation
            bio_options = [
                "Love exploring new places and trying different cuisines. Always up for an adventure!",
                "Passionate about fitness and healthy living. Looking for someone to share life's journey with.",
                "Creative soul who enjoys art, music, and meaningful conversations over coffee.",
                "Travel enthusiast and foodie. Believe in making every moment count.",
                "Outdoor lover who enjoys hiking, camping, and stargazing. Let's explore together!",
                "Book lover and movie enthusiast. Enjoy quiet evenings and exciting adventures equally.",
                "Fitness enthusiast and dog lover. Looking for genuine connections and new experiences.",
                "Music and art lover. Enjoy discovering new places and meeting interesting people."
            ]
            
            user_bio = user.bio if user.bio else random.choice(bio_options)
            
            # Create occupation if not available
            occupations = [
                "Software Engineer", "Teacher", "Doctor", "Designer", "Marketing Manager",
                "Nurse", "Entrepreneur", "Writer", "Photographer", "Consultant",
                "Architect", "Chef", "Lawyer", "Artist", "Engineer"
            ]
            user_occupation = user.occupation if user.occupation else random.choice(occupations)
            
            profiles.append({
                'id': user.id,
                'name': user.name,
                'age': user.age if user.age else random.randint(22, 35),
                'profilePicture': profile_pic,
                'bio': user_bio,
                'distance': calculated_distance,
                'occupation': user_occupation,
                'interests': user_interests,
                'verified': bool(user.is_verified) if hasattr(user, 'is_verified') and user.is_verified else random.choice([True, False]),
                'activityScore': random.uniform(0.6, 1.0),
                'compatibilityScore': match_percentage / 100 if match_percentage else random.uniform(0.6, 0.95),
                'matchPercentage': match_percentage
            })
        
        # Determine if there are more profiles
        has_more = (offset + len(profiles)) < total_count
        
        return jsonify({
            'profiles': profiles,
            'hasMore': has_more,
            'total': total_count,
            'offset': offset,
            'limit': limit
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({
            'error': 'Failed to load recommendations',
            'profiles': [],
            'hasMore': False
        }), 500

@discover_bp.route('/api/matching/action', methods=['POST'])
@login_required
def record_action():
    """Record user action (like/pass/superlike)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        profile_id = data.get('profileId')
        action = data.get('action')
        
        if not profile_id or not action or action not in ['like', 'pass', 'superlike']:
            return jsonify({'error': 'Invalid request parameters'}), 400
        
        # Get the target user
        target_user = User.query.get(profile_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Record the action (in a real app, save to database)
        user_match = Match(
            user_id=current_user.id,
            matched_user_id=profile_id,
            liked=(action in ['like', 'superlike']),
            super_liked=(action == 'superlike')
        )
        
        # In a real app, we would save this to the database
        # db.session.add(user_match)
        # db.session.commit()
        
        # Check if it's a match (both users liked each other)
        is_match = False
        if action in ['like', 'superlike']:
            # In a real app, we would query the database to check if the other user liked this user
            # other_user_match = Match.query.filter_by(
            #     user_id=profile_id,
            #     matched_user_id=current_user.id,
            #     liked=True
            # ).first()
            # is_match = other_user_match is not None
            
            # For demo purposes, randomly determine if it's a match
            # Super likes have higher match probability
            match_probability = 0.4 if action == 'superlike' else 0.25
            is_match = random.random() < match_probability
        
        # If it's a match, create a conversation
        conversation_id = None
        if is_match:
            # In a real app, we would create a conversation between the users
            # conversation = Conversation(user1_id=current_user.id, user2_id=profile_id)
            # db.session.add(conversation)
            # db.session.commit()
            # conversation_id = conversation.id
            
            # Mock conversation ID for demo
            conversation_id = f"conversation-{current_user.id}-{profile_id}"
            
            return jsonify({
                'success': True,
                'match': True,
                'name': target_user.name,
                'conversationId': conversation_id,
                'message': f"It's a match with {target_user.name}!"
            })
        
        return jsonify({
            'success': True,
            'match': False,
            'message': f"Action '{action}' recorded successfully"
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in record_action: {str(e)}")
        return jsonify({
            'error': 'Failed to process action',
            'success': False
        }), 500

@discover_bp.route('/api/matches/count')
@login_required
def get_match_count():
    """Get the number of matches for the current user"""
    try:
        # In a real app, we would query the database for the number of matches
        # count = Conversation.query.filter(
        #     (Conversation.user1_id == current_user.id) | (Conversation.user2_id == current_user.id)
        # ).count()
        
        # For demo purposes, return a random number
        count = random.randint(5, 25)
        
        return jsonify({
            'count': count,
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in get_match_count: {str(e)}")
        return jsonify({
            'error': 'Failed to get match count',
            'count': 0
        }), 500

@discover_bp.route('/api/filters', methods=['GET', 'POST'])
@login_required
def handle_filters():
    """Get or save user filter preferences"""
    try:
        if request.method == 'GET':
            # Get saved filter preferences
            user_preferences = UserPreference.query.filter_by(user_id=current_user.id).first()
            
            if user_preferences:
                filters = {
                    'genderPreference': user_preferences.preferred_gender or 'all',
                    'ageRange': [user_preferences.min_age or 18, user_preferences.max_age or 40],
                    'distance': user_preferences.max_distance or 50,
                    'relationshipType': 'any',  # Could be added to UserPreference model
                    'interests': []  # Could be expanded
                }
            else:
                filters = {
                    'genderPreference': 'all',
                    'ageRange': [18, 40],
                    'distance': 50,
                    'relationshipType': 'any',
                    'interests': []
                }
            
            return jsonify(filters)
            
        else:  # POST
            # Save filter preferences
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Get or create user preferences
            user_preferences = UserPreference.query.filter_by(user_id=current_user.id).first()
            if not user_preferences:
                user_preferences = UserPreference(user_id=current_user.id)
            
            # Update preferences
            if 'genderPreference' in data:
                gender_map = {
                    'men': 'Male',
                    'women': 'Female',
                    'all': 'Any'
                }
                user_preferences.preferred_gender = gender_map.get(data['genderPreference'], 'Any')
            
            if 'ageRange' in data and len(data['ageRange']) == 2:
                user_preferences.min_age = data['ageRange'][0]
                user_preferences.max_age = data['ageRange'][1]
            
            if 'distance' in data:
                user_preferences.max_distance = data['distance']
            
            # In a real app, we would save to database
            # db.session.add(user_preferences)
            # db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Filters saved successfully'
            })
            
    except Exception as e:
        current_app.logger.error(f"Error in handle_filters: {str(e)}")
        return jsonify({
            'error': 'Failed to handle filters'
        }), 500

@discover_bp.route('/api/interests')
@login_required
def get_interests():
    """Get available interests for filtering"""
    try:
        # In a real app, this would come from a database
        interests = [
            "Travel", "Music", "Fitness", "Art", "Food", "Movies", "Reading",
            "Gaming", "Sports", "Photography", "Technology", "Nature",
            "Dancing", "Cooking", "Yoga", "Hiking", "Swimming", "Running",
            "Cycling", "Climbing", "Surfing", "Skiing", "Tennis", "Basketball",
            "Football", "Volleyball", "Baseball", "Golf", "Boxing", "Martial Arts",
            "Fashion", "Beauty", "Shopping", "Crafts", "DIY", "Gardening",
            "Pets", "Animals", "Volunteering", "Charity", "Politics", "Science",
            "History", "Philosophy", "Psychology", "Spirituality", "Meditation",
            "Writing", "Blogging", "Podcasts", "Comedy", "Theater", "Opera",
            "Concerts", "Festivals", "Nightlife", "Bars", "Coffee", "Wine",
            "Beer", "Cocktails", "Fine Dining", "Street Food", "Vegetarian",
            "Vegan", "Keto", "Paleo", "Crossfit", "Weightlifting", "Cardio"
        ]
        
        return jsonify({
            'interests': sorted(interests),
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in get_interests: {str(e)}")
        return jsonify({
            'error': 'Failed to get interests',
            'interests': []
        }), 500