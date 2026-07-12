import random
import json
from datetime import datetime, timedelta

def calculate_travel_compatibility(user1, user2):
    """
    Calculate travel-specific compatibility between two users.
    
    Args:
        user1: The first user object
        user2: The second user object
        
    Returns:
        float: Travel compatibility score between 0.0 and 1.0
    """
    travel_score = 0.0
    factors = 0
    
    # Travel style compatibility
    if hasattr(user1, 'travel_style') and hasattr(user2, 'travel_style'):
        if user1.travel_style and user2.travel_style:
            if user1.travel_style == user2.travel_style:
                travel_score += 1.0
            else:
                # Some styles are more compatible than others
                compatible_styles = {
                    ('budget', 'backpacker'): 0.8,
                    ('luxury', 'business'): 0.8,
                    ('adventure', 'backpacker'): 0.7,
                    ('cultural', 'adventure'): 0.6,
                }
                style_pair = tuple(sorted([user1.travel_style, user2.travel_style]))
                travel_score += compatible_styles.get(style_pair, 0.3)
            factors += 1
    
    # Budget compatibility
    if hasattr(user1, 'budget_range') and hasattr(user2, 'budget_range'):
        if user1.budget_range and user2.budget_range:
            if user1.budget_range == user2.budget_range:
                travel_score += 1.0
            else:
                # Adjacent budget ranges are somewhat compatible
                budget_levels = ['low', 'medium', 'high']
                try:
                    idx1 = budget_levels.index(user1.budget_range)
                    idx2 = budget_levels.index(user2.budget_range)
                    if abs(idx1 - idx2) == 1:  # Adjacent levels
                        travel_score += 0.6
                    else:
                        travel_score += 0.2
                except ValueError:
                    travel_score += 0.3
            factors += 1
    
    # Destination preferences
    if hasattr(user1, 'preferred_destinations') and hasattr(user2, 'preferred_destinations'):
        if user1.preferred_destinations and user2.preferred_destinations:
            try:
                dest1 = set(json.loads(user1.preferred_destinations))
                dest2 = set(json.loads(user2.preferred_destinations))
                if dest1 and dest2:
                    intersection = len(dest1.intersection(dest2))
                    union = len(dest1.union(dest2))
                    if union > 0:
                        travel_score += intersection / union
                    else:
                        travel_score += 0.5
            except (json.JSONDecodeError, TypeError):
                travel_score += 0.3
            factors += 1
    
    # Travel interests
    if hasattr(user1, 'travel_interests') and hasattr(user2, 'travel_interests'):
        if user1.travel_interests and user2.travel_interests:
            try:
                interests1 = set(json.loads(user1.travel_interests))
                interests2 = set(json.loads(user2.travel_interests))
                if interests1 and interests2:
                    intersection = len(interests1.intersection(interests2))
                    union = len(interests1.union(interests2))
                    if union > 0:
                        travel_score += intersection / union
                    else:
                        travel_score += 0.3
            except (json.JSONDecodeError, TypeError):
                travel_score += 0.3
            factors += 1
    
    # Group size preference
    if hasattr(user1, 'group_size_preference') and hasattr(user2, 'group_size_preference'):
        if user1.group_size_preference and user2.group_size_preference:
            if user1.group_size_preference == user2.group_size_preference:
                travel_score += 1.0
            else:
                # Some combinations are more compatible
                compatible_groups = {
                    ('solo', 'small_group'): 0.7,
                    ('couple', 'small_group'): 0.8,
                    ('small_group', 'large_group'): 0.6,
                }
                group_pair = tuple(sorted([user1.group_size_preference, user2.group_size_preference]))
                travel_score += compatible_groups.get(group_pair, 0.3)
            factors += 1
    
    # Travel dates compatibility (if available)
    if hasattr(user1, 'preferred_travel_dates') and hasattr(user2, 'preferred_travel_dates'):
        if user1.preferred_travel_dates and user2.preferred_travel_dates:
            try:
                dates1 = json.loads(user1.preferred_travel_dates)
                dates2 = json.loads(user2.preferred_travel_dates)
                # Simple overlap check - in real app, would parse dates and check overlaps
                if dates1 and dates2:
                    travel_score += 0.5  # Placeholder for date overlap logic
            except (json.JSONDecodeError, TypeError):
                travel_score += 0.3
            factors += 1
    
    return travel_score / factors if factors > 0 else 0.5

def calculate_match_percentage(user1, user2):
    """
    Calculate match percentage between two users based on their preferences and profiles.
    Enhanced for Travel Buddy with travel-specific compatibility.
    
    Args:
        user1: The first user object
        user2: The second user object
        
    Returns:
        int: Match percentage between 55-99%
    """
    # Base score - ensures we don't show extremely low matches
    base_score = 55
    
    # Maximum additional score
    max_additional = 44  # To reach maximum of 99%
    
    # Calculate interest similarity
    interest_score = 0
    if hasattr(user1, 'interests') and hasattr(user2, 'interests'):
        # Handle both object-based interests and string-based interests
        if isinstance(user1.interests, str):
            user1_interests = set(user1.interests.split(','))
        else:
            user1_interests = set(interest.name for interest in user1.interests)
            
        if isinstance(user2.interests, str):
            user2_interests = set(user2.interests.split(','))
        else:
            user2_interests = set(interest.name for interest in user2.interests)
        
        if user1_interests and user2_interests:
            # Calculate Jaccard similarity: intersection / union
            intersection = len(user1_interests.intersection(user2_interests))
            union = len(user1_interests.union(user2_interests))
            
            if union > 0:
                interest_score = intersection / union
    
    # Calculate age preference match
    age_score = 0
    if hasattr(user1, 'preferred_age_min') and hasattr(user1, 'preferred_age_max') and hasattr(user2, 'age'):
        if user1.preferred_age_min <= user2.age <= user1.preferred_age_max:
            age_score = 1.0
        else:
            # Partial score for near misses
            age_diff = min(
                abs(user1.preferred_age_min - user2.age) if user2.age < user1.preferred_age_min else 0,
                abs(user2.age - user1.preferred_age_max) if user2.age > user1.preferred_age_max else 0
            )
            age_score = max(0, 1 - (age_diff / 10))  # Decrease score by 10% for each year outside range
    
    # Calculate location proximity score
    location_score = 0
    # In a real app, we would calculate distance between users
    # For demo, use random value
    location_score = random.uniform(0.6, 1.0)
    
    # Calculate travel compatibility (new for Travel Buddy)
    travel_compatibility = calculate_travel_compatibility(user1, user2)
    
    # Calculate compatibility score based on profile data
    compatibility_score = 0
    # In a real app, this would use personality traits, relationship goals, etc.
    # For demo, use random value with some bias based on other scores
    base_compatibility = random.uniform(0.5, 1.0)
    compatibility_score = (base_compatibility + interest_score) / 2
    
    # Weights for different factors (updated for Travel Buddy)
    weights = {
        'interests': 0.20,
        'age': 0.15,
        'location': 0.15,
        'travel': 0.35,  # Increased weight for travel compatibility
        'compatibility': 0.15
    }
    
    # Calculate weighted score
    weighted_score = (
        (interest_score * weights['interests']) +
        (age_score * weights['age']) +
        (location_score * weights['location']) +
        (travel_compatibility * weights['travel']) +
        (compatibility_score * weights['compatibility'])
    )
    
    # Convert to percentage in the range 55-99%
    match_percentage = base_score + int(weighted_score * max_additional)
    
    # Ensure within bounds
    match_percentage = min(99, max(55, match_percentage))
    
    return match_percentage