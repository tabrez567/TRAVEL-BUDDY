"""
Google Maps integration utilities for Travel Buddy
"""
import os
import requests
from flask import current_app

def get_place_details(place_id):
    """
    Get detailed information about a place using Google Places API
    
    Args:
        place_id: Google Places ID
        
    Returns:
        dict: Place details including name, address, coordinates, etc.
    """
    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return None
    
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'name,formatted_address,geometry,rating,photos,types',
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'OK':
            return data.get('result')
        return None
    except requests.RequestException:
        return None

def search_places(query, location=None, radius=50000):
    """
    Search for places using Google Places API
    
    Args:
        query: Search query (e.g., "restaurants in Tokyo")
        location: Optional lat,lng coordinates
        radius: Search radius in meters (default 50km)
        
    Returns:
        list: List of place results
    """
    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return []
    
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        'query': query,
        'key': api_key
    }
    
    if location:
        params['location'] = location
        params['radius'] = radius
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'OK':
            return data.get('results', [])
        return []
    except requests.RequestException:
        return []

def get_directions(origin, destination, mode='driving'):
    """
    Get directions between two points using Google Directions API
    
    Args:
        origin: Starting point (address or lat,lng)
        destination: End point (address or lat,lng)
        mode: Travel mode (driving, walking, bicycling, transit)
        
    Returns:
        dict: Directions data including route, duration, distance
    """
    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return None
    
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        'origin': origin,
        'destination': destination,
        'mode': mode,
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'OK':
            return data.get('routes', [])
        return []
    except requests.RequestException:
        return []

def geocode_address(address):
    """
    Convert address to coordinates using Google Geocoding API
    
    Args:
        address: Address string
        
    Returns:
        tuple: (latitude, longitude) or None
    """
    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return None
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'address': address,
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'OK' and data.get('results'):
            location = data['results'][0]['geometry']['location']
            return (location['lat'], location['lng'])
        return None
    except requests.RequestException:
        return None

def reverse_geocode(lat, lng):
    """
    Convert coordinates to address using Google Geocoding API
    
    Args:
        lat: Latitude
        lng: Longitude
        
    Returns:
        str: Formatted address or None
    """
    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return None
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'latlng': f"{lat},{lng}",
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'OK' and data.get('results'):
            return data['results'][0]['formatted_address']
        return None
    except requests.RequestException:
        return None
