from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
import json
import os
import random
from datetime import datetime, timedelta

# Blueprint configuration
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard', template_folder='templates')

@dashboard_bp.route('/')
@login_required
def dashboard():
    """Travel Buddy dashboard page"""
    from models import Trip, Event, Match, User, EventParticipant
    from extensions import db
    
    # Get user's upcoming trips
    upcoming_trips = Trip.query.filter(
        Trip.user_id == current_user.id,
        Trip.start_date > datetime.now()
    ).order_by(Trip.start_date.asc()).limit(3).all()
    
    # Get user's recent matches
    recent_matches = []
    try:
        recent_matches = db.session.query(User).join(Match, User.id == Match.matched_user_id).filter(
            Match.user_id == current_user.id,
            Match.matched == True
        ).order_by(Match.matched_at.desc()).limit(5).all()
    except Exception as e:
        print(f"Error fetching recent matches: {e}")
        recent_matches = []
    
    # Get upcoming events user is participating in
    upcoming_events = []
    try:
        # First get event participants for current user
        user_event_participants = EventParticipant.query.filter_by(
            user_id=current_user.id, 
            status='confirmed'
        ).all()
        
        # Then get the events for those participants
        event_ids = [ep.event_id for ep in user_event_participants]
        if event_ids:
            upcoming_events = Event.query.filter(
                Event.id.in_(event_ids),
                Event.event_date > datetime.now()
            ).order_by(Event.event_date.asc()).limit(3).all()
    except Exception as e:
        print(f"Error fetching upcoming events: {e}")
        upcoming_events = []
    
    # Get travel statistics
    total_trips = Trip.query.filter_by(user_id=current_user.id).count()
    completed_trips = Trip.query.filter_by(user_id=current_user.id, status='completed').count()
    total_matches = Match.query.filter_by(user_id=current_user.id, matched=True).count()
    
    dashboard_data = {
        'upcoming_trips': upcoming_trips,
        'recent_matches': recent_matches,
        'upcoming_events': upcoming_events,
        'stats': {
            'total_trips': total_trips,
            'completed_trips': completed_trips,
            'total_matches': total_matches,
            'profile_completeness': current_user.profile_complete
        }
    }
    
    return render_template('dashboard/dashboard.html', data=dashboard_data)

@dashboard_bp.route('/theme-demo')
def theme_demo():
    """Theme demo page"""
    return render_template('theme-demo.html')

@dashboard_bp.route('/settings')
@login_required
def settings():
    """User settings page"""
    return render_template('dashboard/settings.html')

@dashboard_bp.route('/api/analytics')
@login_required
def get_analytics():
    """API endpoint to get user analytics data"""
    # In a real app, this would query the database
    # For now, we'll generate dummy data
    
    # Profile views data (last 7 days)
    dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6, -1, -1)]
    profile_views = [12, 18, 15, 22, 19, 25, 30]
    
    # Match statistics
    total_matches = 42
    new_matches_week = 7
    match_rate = "68%"
    
    # Activity data
    messages_sent = 127
    messages_received = 98
    active_days = 23
    
    # Compatibility scores by category
    compatibility_categories = [
        {'category': 'Interests', 'score': 85},
        {'category': 'Lifestyle', 'score': 72},
        {'category': 'Values', 'score': 90},
        {'category': 'Personality', 'score': 68}
    ]
    
    return jsonify({
        'profile_views': {
            'dates': dates,
            'values': profile_views
        },
        'matches': {
            'total': total_matches,
            'new_this_week': new_matches_week,
            'rate': match_rate
        },
        'activity': {
            'messages_sent': messages_sent,
            'messages_received': messages_received,
            'active_days': active_days
        },
        'compatibility': compatibility_categories
    })

@dashboard_bp.route('/analytics')
@login_required
def analytics():
    """Render the analytics dashboard page"""
    return render_template('dashboard/analytics.html')

# API Endpoints for Analytics Dashboard
@dashboard_bp.route('/api/analytics/profile-views')
@login_required
def profile_views():
    """Get profile view statistics"""
    time_range = request.args.get('timeRange', '30d')
    
    # Generate mock data for demonstration
    days = 30
    if time_range == '7d':
        days = 7
    elif time_range == '90d':
        days = 90
    elif time_range == '1y':
        days = 365
    
    daily_views = []
    total_views = 0
    
    # Generate daily view data
    for i in range(days):
        date = (datetime.now() - timedelta(days=days-i-1)).strftime('%Y-%m-%d')
        count = random.randint(5, 50)
        daily_views.append({
            'date': date,
            'count': count
        })
        total_views += count
    
    # Calculate average daily views
    average_daily_views = round(total_views / days)
    
    # Calculate percentage change from previous period
    previous_period_views = sum(random.randint(5, 50) for _ in range(days))
    percentage_change = round(((total_views - previous_period_views) / previous_period_views) * 100)
    
    return jsonify({
        'dailyViews': daily_views,
        'totalViews': total_views,
        'averageDailyViews': average_daily_views,
        'percentageChange': percentage_change
    })

@dashboard_bp.route('/api/analytics/match-stats')
@login_required
def match_stats():
    """Get match statistics"""
    time_range = request.args.get('timeRange', '30d')
    
    # Generate mock data for demonstration
    days = 30
    if time_range == '7d':
        days = 7
    elif time_range == '90d':
        days = 90
    elif time_range == '1y':
        days = 365
    
    # Generate match rate data
    match_rate_data = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=days-i-1)).strftime('%Y-%m-%d')
        rate = random.randint(10, 40)
        match_rate_data.append({
            'date': date,
            'rate': rate
        })
    
    # Generate match sources data
    match_sources = [
        {'source': 'Discover', 'percentage': 45},
        {'source': 'Search', 'percentage': 25},
        {'source': 'Mutual Friends', 'percentage': 15},
        {'source': 'Events', 'percentage': 10},
        {'source': 'Other', 'percentage': 5}
    ]
    
    # Calculate overall statistics
    total_matches = random.randint(50, 200)
    overall_match_rate = random.randint(15, 35)
    conversation_rate = random.randint(40, 80)
    
    return jsonify({
        'matchRate': match_rate_data,
        'matchSources': match_sources,
        'totalMatches': total_matches,
        'overallMatchRate': overall_match_rate,
        'conversationRate': conversation_rate
    })

@dashboard_bp.route('/api/analytics/profile-performance')
@login_required
def profile_performance():
    """Get profile performance metrics"""
    # Generate mock data for demonstration
    
    # Profile completeness
    completeness_sections = [
        {'name': 'Photos', 'completed': True},
        {'name': 'Bio', 'completed': True},
        {'name': 'Interests', 'completed': True},
        {'name': 'Education', 'completed': False},
        {'name': 'Work', 'completed': True},
        {'name': 'Location', 'completed': True},
        {'name': 'Preferences', 'completed': True},
        {'name': 'Verification', 'completed': False}
    ]
    
    completed_count = sum(1 for section in completeness_sections if section['completed'])
    completeness_percentage = round((completed_count / len(completeness_sections)) * 100)
    
    # Performance scores
    engagement_score = random.randint(6, 9)
    visibility_score = random.randint(5, 9)
    
    # Profile insights
    strengths = [
        'High-quality profile photos',
        'Detailed and engaging bio',
        'Diverse interests that attract matches',
        'Regular activity on the platform',
        'Quick response to messages'
    ]
    
    weaknesses = [
        'Missing education information',
        'Not verified profile',
        'Limited connection with mutual friends',
        'Could improve profile visibility with premium features'
    ]
    
    return jsonify({
        'completeness': {
            'percentage': completeness_percentage,
            'sections': completeness_sections
        },
        'scores': {
            'engagement': engagement_score,
            'visibility': visibility_score
        },
        'insights': {
            'strengths': strengths,
            'weaknesses': weaknesses
        }
    })

@dashboard_bp.route('/api/analytics/activity-heatmap')
@login_required
def activity_heatmap():
    """Get activity heatmap data"""
    time_range = request.args.get('timeRange', '30d')
    
    # Generate mock heatmap data
    heatmap_data = []
    
    # For each day of the week (0 = Sunday, 6 = Saturday)
    for day in range(7):
        # For each hour of the day (0-23)
        for hour in range(24):
            # Activity level: 0 (none) to 4 (very high)
            # Higher probability of activity during evening hours and weekends
            if day in [0, 5, 6]:  # Weekend
                if 10 <= hour <= 23:
                    level = random.choices([0, 1, 2, 3, 4], weights=[5, 10, 20, 40, 25])[0]
                else:
                    level = random.choices([0, 1, 2, 3, 4], weights=[40, 30, 20, 10, 0])[0]
            else:  # Weekday
                if 17 <= hour <= 23:
                    level = random.choices([0, 1, 2, 3, 4], weights=[10, 20, 40, 20, 10])[0]
                elif 7 <= hour <= 9:
                    level = random.choices([0, 1, 2, 3, 4], weights=[20, 30, 30, 15, 5])[0]
                else:
                    level = random.choices([0, 1, 2, 3, 4], weights=[50, 30, 15, 5, 0])[0]
            
            heatmap_data.append({
                'day': day,
                'hour': hour,
                'level': level
            })
    
    # Generate peak times
    peak_times = [
        'Weekdays 7-9 PM',
        'Weekends 2-6 PM',
        'Sunday evenings',
        'Friday after 8 PM'
    ]
    
    return jsonify({
        'heatmap': heatmap_data,
        'peakTimes': peak_times
    })

@dashboard_bp.route('/api/analytics/interest-analytics')
@login_required
def interest_analytics():
    """Get interest analytics data"""
    time_range = request.args.get('timeRange', '30d')
    
    # Generate mock data for common interests with matches
    common_interests = [
        {'interest': 'Travel', 'matchRate': 85},
        {'interest': 'Music', 'matchRate': 72},
        {'interest': 'Fitness', 'matchRate': 68},
        {'interest': 'Food', 'matchRate': 65},
        {'interest': 'Movies', 'matchRate': 60},
        {'interest': 'Reading', 'matchRate': 45},
        {'interest': 'Photography', 'matchRate': 40},
        {'interest': 'Art', 'matchRate': 35}
    ]
    
    # Generate mock data for popular interests among potential matches
    popular_interests = [
        {'interest': 'Travel', 'percentage': 75},
        {'interest': 'Fitness', 'percentage': 65},
        {'interest': 'Food', 'percentage': 60},
        {'interest': 'Music', 'percentage': 55},
        {'interest': 'Movies', 'percentage': 50},
        {'interest': 'Outdoors', 'percentage': 45},
        {'interest': 'Art', 'percentage': 30},
        {'interest': 'Gaming', 'percentage': 25}
    ]
    
    return jsonify({
        'commonInterests': common_interests,
        'popularInterests': popular_interests
    })

@dashboard_bp.route('/api/analytics/recommendations')
@login_required
def recommendations():
    """Get personalized profile improvement recommendations"""
    # Generate mock recommendations
    recommendations_data = [
        {
            'category': 'Profile',
            'title': 'Add education information',
            'description': 'Users with complete education details receive 15% more profile views.',
            'priority': 'high'
        },
        {
            'category': 'Photos',
            'title': 'Add one more high-quality photo',
            'description': 'Profiles with 4+ photos receive 40% more matches.',
            'priority': 'medium'
        },
        {
            'category': 'Verification',
            'title': 'Verify your profile',
            'description': 'Verified profiles receive 60% more messages and appear more trustworthy.',
            'priority': 'high'
        },
        {
            'category': 'Activity',
            'title': 'Be active during peak hours',
            'description': 'Try logging in between 7-9 PM on weekdays to maximize your visibility.',
            'priority': 'medium'
        },
        {
            'category': 'Messaging',
            'title': 'Improve response rate',
            'description': 'Responding to messages within 24 hours increases your chances of meaningful conversations.',
            'priority': 'low'
        },
        {
            'category': 'Interests',
            'title': 'Add more specific interests',
            'description': 'Users with 5+ specific interests receive 25% more matches with high compatibility.',
            'priority': 'medium'
        }
    ]
    
    return jsonify({
        'recommendations': recommendations_data
    })