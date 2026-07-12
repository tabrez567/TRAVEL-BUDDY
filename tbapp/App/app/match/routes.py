from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
import json
import os
import random
from math import radians, sin, cos, sqrt, atan2

# Import db and models
from extensions import db
from models import User, Match

# Blueprint configuration
match_bp = Blueprint('match', __name__, 
                    url_prefix='/match',
                    template_folder='templates')

# Load dummy data
def load_dummy_profiles():
    """Load dummy profiles from JSON file"""
    data_path = os.path.join(os.path.dirname(__file__), '../data/profiles.json')
    try:
        with open(data_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback to basic dummy data if file not found
        return [
            {
                'id': 1,
                'name': 'Emma Watson',
                'age': 28,
                'gender': 'Female',
                'location': 'London, UK',
                'bio': 'Love reading and traveling. Looking for someone genuine.',
                'profile_picture': 'C:\\Users\\TABRE\\OneDrive\\Desktop',
                'interests': ['Reading', 'Travel', 'Movies']
            },
            {
                'id': 2,
                'name': 'James Smith',
                'age': 32,
                'gender': 'Male',
                'location': 'New York, USA',
                'bio': 'Software engineer who loves hiking and cooking.',
                'profile_picture': '/static/img/avatars/default.jpg',
                'interests': ['Technology', 'Hiking', 'Cooking']
            }
        ]

@match_bp.route('/swipe')
@login_required
def swipe():
    """Swipe page for discovering potential matches"""
    return render_template('match/swipe.html')

@match_bp.route('/recommended')
@login_required
def recommended():
    """Recommended matches page"""
    return render_template('match/recommended.html')

@match_bp.route('/search')
@login_required
def search():
    """Search for matches with filters"""
    return render_template('match/search.html')

@match_bp.route('/api/profiles')
@login_required
def get_profiles():
    """API endpoint to get potential matches"""
    # In a real app, this would query the database with user preferences
    # For now, we'll use dummy data
    
    # Get query parameters for filtering
    age_min = request.args.get('age_min', type=int, default=18)
    age_max = request.args.get('age_max', type=int, default=99)
    gender = request.args.get('gender', default=None)
    location = request.args.get('location', default=None)
    
    # Load dummy profiles
    dummy_profiles = load_dummy_profiles()
    
    # Filter profiles based on criteria
    filtered_profiles = []
    for profile in dummy_profiles:
        if age_min <= profile['age'] <= age_max:
            if not gender or profile['gender'].lower() == gender.lower():
                if not location or location.lower() in profile['location'].lower():
                    filtered_profiles.append(profile)
    
    # Exclude profiles the user has already liked or disliked
    # In a real app, this would check the database
    user_matches = db.session.query(Match).filter_by(user_id=current_user.id).all()
    excluded_ids = [match.matched_user_id for match in user_matches]
    
    # For demo purposes, we'll just return a limited number of profiles
    response_profiles = [p for p in filtered_profiles if p['id'] not in excluded_ids][:10]
    
    return jsonify(response_profiles)

@match_bp.route('/api/like', methods=['POST'])
@login_required
def like_profile():
    """API endpoint to like a profile"""
    data = request.get_json()
    profile_id = data.get('profile_id')
    super_like = data.get('super_like', False)
    
    # In a real app, this would save to the database
    # For now, we'll just return a success response
    
    # Check if it's a match (for demo purposes, randomly decide)
    is_match = random.random() > 0.7
    
    response = {
        'success': True,
        'is_match': is_match,
        'message': 'Super liked!' if super_like else 'Liked!'
    }
    
    if is_match:
        response['match_message'] = "It's a match! You can now start chatting."
    
    return jsonify(response)

@match_bp.route('/api/dislike', methods=['POST'])
@login_required
def dislike_profile():
    """API endpoint to dislike a profile"""
    data = request.get_json()
    profile_id = data.get('profile_id')
    
    # In a real app, this would save to the database
    # For now, we'll just return a success response
    
    return jsonify({
        'success': True,
        'message': 'Disliked'
    })