from flask import Blueprint, render_template, request, jsonify, current_app
from flask_login import login_required, current_user
from models import User, UserPreference
from utils import calculate_match_percentage
import random

search_bp = Blueprint('search', __name__, url_prefix='/search')

@search_bp.route('/')
@login_required
def search_page():
    """Render the advanced search page"""
    return render_template('discover/search.html')

@search_bp.route('/api/filters', methods=['GET'])
def get_filters():
    """Get user's saved search filters"""
    # Get user preferences
    user_preferences = UserPreference.query.filter_by(user_id=current_user.id).first()
    
    if not user_preferences:
        # Return default preferences
        return jsonify({
            'gender': {
                'men': False,
                'women': True,
                'nonbinary': False
            },
            'age': {
                'min': 18,
                'max': 45
            },
            'distance': 50,
            'relationshipType': {
                'relationship': True,
                'casual': False,
                'friendship': False
            },
            'verifiedOnly': False,
            'interests': []
        })
    
    # Return user preferences
    return jsonify({
        'gender': {
            'men': user_preferences.interested_in_men,
            'women': user_preferences.interested_in_women,
            'nonbinary': user_preferences.interested_in_nonbinary
        },
        'age': {
            'min': user_preferences.min_age,
            'max': user_preferences.max_age
        },
        'distance': user_preferences.max_distance,
        'relationshipType': {
            'relationship': user_preferences.seeking_relationship,
            'casual': user_preferences.seeking_casual,
            'friendship': user_preferences.seeking_friendship
        },
        'verifiedOnly': user_preferences.show_verified_only,
        'interests': [] # In a real app, would fetch from user_interests table
    })

@search_bp.route('/api/filters', methods=['POST'])
def save_filters():
    """Save user's search filters"""
    data = request.json
    
    # Get or create user preferences
    user_preferences = UserPreference.query.filter_by(user_id=current_user.id).first()
    if not user_preferences:
        user_preferences = UserPreference(user_id=current_user.id)
    
    # Update preferences
    user_preferences.interested_in_men = data['gender'].get('men', False)
    user_preferences.interested_in_women = data['gender'].get('women', False)
    user_preferences.interested_in_nonbinary = data['gender'].get('nonbinary', False)
    user_preferences.min_age = data['age'].get('min', 18)
    user_preferences.max_age = data['age'].get('max', 99)
    user_preferences.max_distance = data.get('distance', 50)
    user_preferences.seeking_relationship = data['relationshipType'].get('relationship', True)
    user_preferences.seeking_casual = data['relationshipType'].get('casual', False)
    user_preferences.seeking_friendship = data['relationshipType'].get('friendship', False)
    user_preferences.show_verified_only = data.get('verifiedOnly', False)
    
    # In a real app, would save interests to user_interests table
    
    # Save to database
    # db.session.add(user_preferences)
    # db.session.commit()
    
    return jsonify({'success': True})

@search_bp.route('/api/results')
def search_results():
    """Get search results based on filters"""
    # Get query parameters
    offset = request.args.get('offset', 0, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    # Get filter parameters
    interested_in_men = request.args.get('men', 'false').lower() == 'true'
    interested_in_women = request.args.get('women', 'false').lower() == 'true'
    interested_in_nonbinary = request.args.get('nonbinary', 'false').lower() == 'true'
    min_age = request.args.get('minAge', 18, type=int)
    max_age = request.args.get('maxAge', 99, type=int)
    max_distance = request.args.get('distance', 50, type=int)
    seeking_relationship = request.args.get('relationship', 'false').lower() == 'true'
    seeking_casual = request.args.get('casual', 'false').lower() == 'true'
    seeking_friendship = request.args.get('friendship', 'false').lower() == 'true'
    verified_only = request.args.get('verified', 'false').lower() == 'true'
    interests = request.args.getlist('interests')
    
    # In a real app, would build a complex query based on filters
    # For demo, we'll return mock data
    
    # Query for potential matches
    potential_matches = User.query.filter(
        User.id != current_user.id,  # Exclude current user
    ).offset(offset).limit(limit).all()
    
    # Format profiles for response
    profiles = []
    for user in potential_matches:
        # Get user's profile picture
        profile_pic = user.profile_picture if user.profile_picture else '/static/images/default-avatar.jpg'
        
        # Get user's interests
        user_interests = [interest.name for interest in user.interests] if hasattr(user, 'interests') else [
            # Sample interests for demo
            "Travel", "Music", "Fitness", "Art", "Food", "Movies", "Reading"
        ]
        
        # Calculate match percentage
        match_percentage = calculate_match_percentage(current_user, user)
        
        # Calculate distance (would use geolocation in a real app)
        distance = random.randint(1, 50)  # Mock distance for demo
        
        # Apply filters
        # In a real app, this filtering would be done in the database query
        # For demo, we'll do it here
        
        # Skip if gender doesn't match preferences
        if hasattr(user, 'gender'):
            if (user.gender == 'male' and not interested_in_men) or \
               (user.gender == 'female' and not interested_in_women) or \
               (user.gender == 'nonbinary' and not interested_in_nonbinary):
                continue
        
        # Skip if age doesn't match preferences
        if hasattr(user, 'age') and (user.age < min_age or user.age > max_age):
            continue
        
        # Skip if distance doesn't match preferences
        if distance > max_distance:
            continue
        
        # Skip if verification doesn't match preferences
        if verified_only and not (hasattr(user, 'is_verified') and user.is_verified):
            continue
        
        # Skip if relationship type doesn't match preferences
        if hasattr(user, 'relationship_preference'):
            if (user.relationship_preference == 'relationship' and not seeking_relationship) or \
               (user.relationship_preference == 'casual' and not seeking_casual) or \
               (user.relationship_preference == 'friendship' and not seeking_friendship):
                continue
        
        # Skip if interests don't match (if interests filter is provided)
        if interests and not any(interest in user_interests for interest in interests):
            continue
        
        profiles.append({
            'id': user.id,
            'name': user.first_name,
            'age': user.age if hasattr(user, 'age') else random.randint(21, 35),  # Mock age for demo
            'profilePicture': profile_pic,
            'bio': user.bio if hasattr(user, 'bio') else "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            'distance': distance,
            'occupation': user.occupation if hasattr(user, 'occupation') else "Professional",
            'interests': user_interests,
            'verified': bool(user.is_verified) if hasattr(user, 'is_verified') else random.choice([True, False]),
            'matchPercentage': match_percentage,
            'activityScore': random.uniform(0.6, 1.0),  # Mock activity score
            'compatibilityScore': random.uniform(0.5, 1.0),  # Mock compatibility score
        })
    
    # Return response
    return jsonify({
        'profiles': profiles,
        'hasMore': len(profiles) == limit  # If we got a full page, there might be more
    })

@search_bp.route('/api/interests')
def get_interests():
    """Get list of available interests for filtering"""
    # In a real app, would fetch from database
    # For demo, return a static list
    interests = [
        "Travel", "Music", "Fitness", "Art", "Food", "Movies", "Reading",
        "Photography", "Dancing", "Hiking", "Cooking", "Gaming", "Yoga",
        "Fashion", "Technology", "Sports", "Writing", "Pets", "Volunteering",
        "Meditation", "Cycling", "Swimming", "Running", "Singing", "Gardening"
    ]
    
    return jsonify({'interests': interests})