from flask import Blueprint, render_template, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
#import randompip

analytics_bp = Blueprint('analytics', __name__, url_prefix='/analytics')

@analytics_bp.route('/')
@login_required
def analytics_dashboard():
    """Render the analytics dashboard page"""
    return render_template('dashboard/analytics.html')

@analytics_bp.route('/api/profile-views')
@login_required
def profile_views():
    """Get profile view statistics"""
    # In a real app, would fetch from database
    # For demo, generate random data
    
    # Get date range (last 30 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Generate daily view data
    daily_views = []
    current_date = start_date
    
    while current_date <= end_date:
        # Generate random view count (higher on weekends)
        if current_date.weekday() >= 5:  # Weekend
            view_count = random.randint(15, 40)
        else:  # Weekday
            view_count = random.randint(5, 25)
        
        daily_views.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'views': view_count
        })
        
        current_date += timedelta(days=1)
    
    # Calculate total views
    total_views = sum(day['views'] for day in daily_views)
    
    # Calculate average daily views
    avg_daily_views = round(total_views / len(daily_views))
    
    # Calculate percentage change from previous period
    prev_period_views = sum(random.randint(5, 30) for _ in range(30))  # Random previous period
    percentage_change = round(((total_views - prev_period_views) / prev_period_views) * 100, 1)
    
    return jsonify({
        'total_views': total_views,
        'avg_daily_views': avg_daily_views,
        'percentage_change': percentage_change,
        'daily_data': daily_views
    })

@analytics_bp.route('/api/matches-stats')
@login_required
def matches_stats():
    """Get match statistics"""
    # In a real app, would fetch from database
    # For demo, generate random data
    
    # Total matches
    total_matches = random.randint(10, 50)
    
    # Match rate (matches / total swipes)
    total_swipes = total_matches + random.randint(50, 200)  # Total swipes
    match_rate = round((total_matches / total_swipes) * 100, 1)
    
    # Conversation rate (conversations started / matches)
    conversations_started = random.randint(5, total_matches)
    conversation_rate = round((conversations_started / total_matches) * 100, 1) if total_matches > 0 else 0
    
    # Match sources
    match_sources = [
        {'source': 'Discover', 'count': random.randint(5, 20)},
        {'source': 'Search', 'count': random.randint(3, 15)},
        {'source': 'Mutual Friends', 'count': random.randint(1, 10)},
        {'source': 'Events', 'count': random.randint(0, 5)}
    ]
    
    # Ensure total matches matches the sum of sources
    total_source_matches = sum(source['count'] for source in match_sources)
    if total_source_matches != total_matches:
        # Adjust the first source to make the total match
        match_sources[0]['count'] += (total_matches - total_source_matches)
    
    return jsonify({
        'total_matches': total_matches,
        'match_rate': match_rate,
        'conversation_rate': conversation_rate,
        'match_sources': match_sources
    })

@analytics_bp.route('/api/profile-performance')
@login_required
def profile_performance():
    """Get profile performance metrics"""
    # In a real app, would fetch from database
    # For demo, generate random data
    
    # Profile completeness
    profile_sections = [
        {'name': 'Photos', 'completed': random.choice([True, True, True, False]), 'weight': 30},
        {'name': 'Bio', 'completed': random.choice([True, True, False]), 'weight': 20},
        {'name': 'Interests', 'completed': random.choice([True, True, True, False]), 'weight': 15},
        {'name': 'Education', 'completed': random.choice([True, False]), 'weight': 10},
        {'name': 'Work', 'completed': random.choice([True, False]), 'weight': 10},
        {'name': 'Verification', 'completed': random.choice([True, False]), 'weight': 15}
    ]
    
    # Calculate profile completeness percentage
    completed_weight = sum(section['weight'] for section in profile_sections if section['completed'])
    total_weight = sum(section['weight'] for section in profile_sections)
    profile_completeness = round((completed_weight / total_weight) * 100)
    
    # Engagement score (0-100)
    engagement_score = random.randint(60, 95)
    
    # Visibility score (0-100)
    visibility_score = random.randint(50, 90)
    
    # Profile strengths and weaknesses
    strengths = []
    weaknesses = []
    
    potential_strengths = [
        'High-quality profile photos',
        'Detailed and engaging bio',
        'Diverse interests',
        'Quick response time',
        'Verified profile',
        'Regular activity'
    ]
    
    potential_weaknesses = [
        'Limited profile photos',
        'Short or generic bio',
        'Few listed interests',
        'Incomplete profile sections',
        'Low activity level',
        'Slow response time'
    ]
    
    # Randomly select 2-3 strengths
    num_strengths = random.randint(2, 3)
    strengths = random.sample(potential_strengths, num_strengths)
    
    # Randomly select 1-2 weaknesses
    num_weaknesses = random.randint(1, 2)
    weaknesses = random.sample(potential_weaknesses, num_weaknesses)
    
    return jsonify({
        'profile_completeness': profile_completeness,
        'profile_sections': profile_sections,
        'engagement_score': engagement_score,
        'visibility_score': visibility_score,
        'strengths': strengths,
        'weaknesses': weaknesses
    })

@analytics_bp.route('/api/activity-heatmap')
@login_required
def activity_heatmap():
    """Get user activity heatmap data"""
    # In a real app, would fetch from database
    # For demo, generate random data
    
    # Generate activity data for each hour of each day of the week
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    hours = list(range(24))  # 0-23 hours
    
    heatmap_data = []
    
    for day_idx, day in enumerate(days):
        for hour in hours:
            # Higher activity in evenings and weekends
            if day_idx >= 5:  # Weekend
                if 10 <= hour <= 23:  # Daytime and evening
                    activity = random.randint(30, 100)
                else:  # Late night/early morning
                    activity = random.randint(5, 40)
            else:  # Weekday
                if 7 <= hour <= 9 or 17 <= hour <= 23:  # Morning and evening
                    activity = random.randint(20, 80)
                elif 0 <= hour <= 6:  # Late night/early morning
                    activity = random.randint(0, 15)
                else:  # Work hours
                    activity = random.randint(10, 30)
            
            heatmap_data.append({
                'day': day,
                'hour': hour,
                'activity': activity
            })
    
    # Get peak activity times
    sorted_data = sorted(heatmap_data, key=lambda x: x['activity'], reverse=True)
    peak_times = [
        {'day': item['day'], 'hour': item['hour'], 'activity': item['activity']}
        for item in sorted_data[:5]  # Top 5 peak times
    ]
    
    return jsonify({
        'heatmap_data': heatmap_data,
        'peak_times': peak_times
    })

@analytics_bp.route('/api/interest-analytics')
@login_required
def interest_analytics():
    """Get analytics about user interests and matches"""
    # In a real app, would fetch from database
    # For demo, generate random data
    
    # Common interests with matches
    common_interests = [
        {'name': 'Travel', 'count': random.randint(5, 15)},
        {'name': 'Music', 'count': random.randint(4, 12)},
        {'name': 'Fitness', 'count': random.randint(3, 10)},
        {'name': 'Food', 'count': random.randint(3, 8)},
        {'name': 'Movies', 'count': random.randint(2, 7)},
        {'name': 'Reading', 'count': random.randint(1, 6)},
        {'name': 'Photography', 'count': random.randint(1, 5)}
    ]
    
    # Sort by count
    common_interests.sort(key=lambda x: x['count'], reverse=True)
    
    # Popular interests among potential matches
    popular_interests = [
        {'name': 'Travel', 'percentage': random.randint(60, 85)},
        {'name': 'Music', 'percentage': random.randint(55, 80)},
        {'name': 'Food', 'percentage': random.randint(50, 75)},
        {'name': 'Fitness', 'percentage': random.randint(45, 70)},
        {'name': 'Movies', 'percentage': random.randint(40, 65)},
        {'name': 'Art', 'percentage': random.randint(30, 55)},
        {'name': 'Reading', 'percentage': random.randint(25, 50)},
        {'name': 'Photography', 'percentage': random.randint(20, 45)},
        {'name': 'Dancing', 'percentage': random.randint(15, 40)},
        {'name': 'Hiking', 'percentage': random.randint(10, 35)}
    ]
    
    # Sort by percentage
    popular_interests.sort(key=lambda x: x['percentage'], reverse=True)
    
    # Interest match rate
    interest_match_rates = [
        {'interest': 'Travel', 'match_rate': random.randint(30, 90)},
        {'interest': 'Music', 'match_rate': random.randint(25, 85)},
        {'interest': 'Fitness', 'match_rate': random.randint(20, 80)},
        {'interest': 'Food', 'match_rate': random.randint(15, 75)},
        {'interest': 'Movies', 'match_rate': random.randint(10, 70)}
    ]
    
    # Sort by match rate
    interest_match_rates.sort(key=lambda x: x['match_rate'], reverse=True)
    
    return jsonify({
        'common_interests': common_interests,
        'popular_interests': popular_interests,
        'interest_match_rates': interest_match_rates
    })

@analytics_bp.route('/api/recommendations')
@login_required
def get_recommendations():
    """Get personalized recommendations for profile improvement"""
    # In a real app, would analyze user data and generate personalized recommendations
    # For demo, return generic recommendations
    
    recommendations = [
        {
            'category': 'Profile',
            'title': 'Add more high-quality photos',
            'description': 'Profiles with 4+ photos get 40% more matches on average.',
            'priority': 'high'
        },
        {
            'category': 'Activity',
            'title': 'Be more active during peak hours',
            'description': 'Your potential matches are most active between 8-10pm. Try logging in during these hours.',
            'priority': 'medium'
        },
        {
            'category': 'Messaging',
            'title': 'Improve your response rate',
            'description': 'You respond to 60% of your matches. Increasing this to 80% could improve your visibility.',
            'priority': 'medium'
        },
        {
            'category': 'Profile',
            'title': 'Complete your bio section',
            'description': 'Adding a detailed bio can increase your match rate by up to 30%.',
            'priority': 'high'
        },
        {
            'category': 'Verification',
            'title': 'Verify your profile',
            'description': 'Verified profiles receive 50% more views and 30% more matches.',
            'priority': 'medium'
        }
    ]
    
    # Randomly select 3-5 recommendations
    num_recommendations = random.randint(3, 5)
    selected_recommendations = random.sample(recommendations, num_recommendations)
    
    # Sort by priority
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    selected_recommendations.sort(key=lambda x: priority_order[x['priority']])
    
    return jsonify({
        'recommendations': selected_recommendations
    })