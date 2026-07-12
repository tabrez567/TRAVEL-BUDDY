from flask import Blueprint, render_template, jsonify, request, flash, redirect, url_for, current_app
from flask_login import login_required, current_user
from flask_wtf import FlaskForm
import json
import os
import time
from datetime import datetime
from werkzeug.utils import secure_filename

# Import db and User model
from extensions import db
from models import User

def calculate_profile_completeness(user):
    """Calculate the profile completeness percentage for Travel Buddy"""
    # Define fields that contribute to profile completeness
    basic_fields = [
        user.name,
        user.age,
        user.gender,
        user.location,
        user.bio,
        user.profile_picture
    ]
    
    # Travel-specific fields
    travel_fields = [
        user.travel_style,
        user.budget_range,
        user.preferred_destinations,
        user.travel_interests,
        user.languages_spoken,
        user.passport_country
    ]
    
    # Count non-empty fields
    basic_completed = sum(1 for field in basic_fields if field)
    travel_completed = sum(1 for field in travel_fields if field)
    
    # Calculate percentage with travel fields weighted more
    total_fields = len(basic_fields) + len(travel_fields)
    completed = basic_completed + travel_completed
    
    return int((completed / total_fields) * 100)

# Blueprint configuration
profile_bp = Blueprint('profile', __name__, 
                      url_prefix='/profile',
                      template_folder='templates')

@profile_bp.route('/')
@login_required
def profile():
    """User profile page"""
    # Get user profile data
    user_data = {
        'name': current_user.name,
        'age': current_user.age,
        'gender': current_user.gender,
        'location': current_user.location,
        'bio': current_user.bio,
        'interests': current_user.interests.split(',') if current_user.interests else [],
        'occupation': current_user.occupation,
        'profile_picture': current_user.profile_picture or '/static/img/avatars/default.jpg',
        'profile_completeness': calculate_profile_completeness(current_user),
        # Travel-specific fields
        'travel_style': current_user.travel_style,
        'budget_range': current_user.budget_range,
        'preferred_destinations': json.loads(current_user.preferred_destinations) if current_user.preferred_destinations else [],
        'travel_interests': json.loads(current_user.travel_interests) if current_user.travel_interests else [],
        'languages_spoken': json.loads(current_user.languages_spoken) if current_user.languages_spoken else [],
        'passport_country': current_user.passport_country,
        'group_size_preference': current_user.group_size_preference,
        'accommodation_preference': current_user.accommodation_preference,
        'transportation_preference': current_user.transportation_preference,
        'is_verified_traveler': current_user.is_verified_traveler,
        'safety_score': current_user.safety_score
    }
    
    return render_template('profile/profile.html', user=user_data)

@profile_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new_profile():
    """New profile creation page"""
    if request.method == 'POST':
        # Update user profile
        current_user.name = request.form.get('name', current_user.name)
        current_user.bio = request.form.get('bio', current_user.bio)
        current_user.age = request.form.get('age', current_user.age, type=int)
        current_user.gender = request.form.get('gender', current_user.gender)
        current_user.location = request.form.get('location', current_user.location)
        
        # Handle interests as array
        interests = request.form.getlist('interests[]')
        if interests:
            current_user.interests = ','.join(interests)
        
        # Handle profile picture upload
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Create uploads directory if it doesn't exist
                upload_dir = current_app.config['UPLOAD_FOLDER']
                os.makedirs(upload_dir, exist_ok=True)
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                current_user.profile_picture = url_for('static', filename=f'uploads/{filename}')
        
        # Check if profile is complete
        current_user.profile_complete = calculate_profile_completeness(current_user) >= 80
        
        db.session.commit()
        flash('Profile created successfully!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    
    return render_template('profile/newprofile.html')

@profile_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit():
    """Edit profile page"""
    # Create a simple form object for CSRF protection
    form = FlaskForm()
    
    if request.method == 'POST' and form.validate_on_submit():
        # Update basic user profile
        current_user.name = request.form.get('name', current_user.name)
        current_user.bio = request.form.get('bio', current_user.bio)
        current_user.age = request.form.get('age', current_user.age, type=int)
        current_user.gender = request.form.get('gender', current_user.gender)
        current_user.location = request.form.get('location', current_user.location)
        current_user.occupation = request.form.get('occupation', current_user.occupation)
        # Handle interests as array
        interests = request.form.getlist('interests[]')
        if interests:
            current_user.interests = ','.join(interests)
        
        # Update travel-specific fields
        current_user.travel_style = request.form.get('travel_style', current_user.travel_style)
        current_user.budget_range = request.form.get('budget_range', current_user.budget_range)
        current_user.passport_country = request.form.get('passport_country', current_user.passport_country)
        current_user.group_size_preference = request.form.get('group_size_preference', current_user.group_size_preference)
        current_user.accommodation_preference = request.form.get('accommodation_preference', current_user.accommodation_preference)
        current_user.transportation_preference = request.form.get('transportation_preference', current_user.transportation_preference)
        current_user.emergency_contact = request.form.get('emergency_contact', current_user.emergency_contact)
        current_user.medical_info = request.form.get('medical_info', current_user.medical_info)
        
        # Handle JSON fields
        preferred_destinations = request.form.getlist('preferred_destinations[]')
        if preferred_destinations:
            current_user.preferred_destinations = json.dumps(preferred_destinations)
        
        travel_interests = request.form.getlist('travel_interests[]')
        if travel_interests:
            current_user.travel_interests = json.dumps(travel_interests)
        
        languages_spoken = request.form.getlist('languages_spoken[]')
        if languages_spoken:
            current_user.languages_spoken = json.dumps(languages_spoken)
        
        preferred_travel_dates = request.form.get('preferred_travel_dates')
        if preferred_travel_dates:
            current_user.preferred_travel_dates = preferred_travel_dates
        
        # Handle profile picture upload
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Create uploads directory if it doesn't exist
                upload_dir = current_app.config['UPLOAD_FOLDER']
                os.makedirs(upload_dir, exist_ok=True)
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                current_user.profile_picture = url_for('static', filename=f'uploads/{filename}')
        
        # Check if profile is complete
        current_user.profile_complete = calculate_profile_completeness(current_user) >= 80
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('profile.profile'))
    
    return render_template('profile/edit.html', form=form)

@profile_bp.route('/verify')
@login_required
def verify():
    """Profile verification page"""
    return render_template('profile/verify.html')

@profile_bp.route('/submit_verification', methods=['POST'])
@login_required
def submit_verification():
    """Handle profile verification submission"""
    try:
        # Handle selfie upload
        if 'selfie' in request.files:
            selfie = request.files['selfie']
            if selfie and selfie.filename:
                selfie_filename = secure_filename(f"selfie_{current_user.id}_{int(datetime.utcnow().timestamp())}.jpg")
                # Create verification directory if it doesn't exist
                upload_dir = os.path.join('app/static/uploads/verification')
                os.makedirs(upload_dir, exist_ok=True)
                selfie_path = os.path.join(upload_dir, selfie_filename)
                selfie.save(selfie_path)
                
        # Handle ID proof upload
        if 'id_proof' in request.files:
            id_proof = request.files['id_proof']
            if id_proof and id_proof.filename:
                id_filename = secure_filename(f"id_{current_user.id}_{int(datetime.utcnow().timestamp())}.jpg")
                id_path = os.path.join(upload_dir, id_filename)
                id_proof.save(id_path)
        
        # In a real application, you would store these paths in a verification request table
        # For this demo, we'll just mark the user as verified immediately
        # In production, this would go through a review process
        
        # Mark user as verified (in a real app, this would happen after admin review)
        current_user.is_verified = True
        db.session.commit()
        
        flash('Your profile has been verified successfully!', 'success')
        return redirect(url_for('profile.profile'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error during verification: {str(e)}', 'danger')
        return redirect(url_for('profile.verify'))

@profile_bp.route('/analytics')
@login_required
def analytics():
    """Profile analytics page"""
    return render_template('profile/analytics.html')

@profile_bp.route('/api/details')
@login_required
def get_profile_details():
    """API endpoint to get profile details"""
    return jsonify({
        'name': current_user.name,
        'email': current_user.email,
        'age': current_user.age,
        'gender': current_user.gender,
        'location': current_user.location,
        'occupation': current_user.occupation,
        'bio': current_user.bio,
        'interests': current_user.interests,
        'profile_picture': current_user.profile_picture or '/static/img/avatars/default.jpg',
        'is_verified': current_user.is_verified,
        'profile_complete': calculate_profile_completeness(current_user)
    })

@profile_bp.route('/api/update', methods=['POST'])
@login_required
def update_profile():
    """API endpoint to update profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['name', 'bio', 'age', 'gender', 'location', 'occupation', 'interests']
        for field in allowed_fields:
            if field in data:
                setattr(current_user, field, data[field])
        
        # Check if profile is complete
        current_user.profile_complete = calculate_profile_completeness(current_user) >= 80
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating profile: {str(e)}'
        }), 400

def calculate_profile_completeness(user):
    """Calculate profile completeness percentage"""
    # Define required fields and their weights
    fields = {
        'name': 15,
        'age': 10,
        'gender': 10,
        'location': 10,
        'occupation': 10,
        'bio': 15,
        'interests': 15,
        'profile_picture': 15
    }
    
    # Calculate completeness
    completeness = 0
    for field, weight in fields.items():
        if getattr(user, field) not in [None, '']:
            completeness += weight
    
    return completeness