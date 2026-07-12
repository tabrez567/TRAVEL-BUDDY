"""
OAuth Service Module
Handles OAuth authentication for Google, Facebook, and Twitter
"""
from authlib.integrations.flask_client import OAuth
from flask import current_app
import os

# Initialize OAuth
oauth = OAuth()

def init_oauth(app):
    """Initialize OAuth with Flask app"""
    oauth.init_app(app)
    
    # Google OAuth
    oauth.register(
        name='google',
        client_id=app.config.get('GOOGLE_OAUTH_CLIENT_ID'),
        client_secret=app.config.get('GOOGLE_OAUTH_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid profile email'},
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        authorize_params={'prompt': 'consent'},
    )
    
    # Facebook OAuth
    oauth.register(
        name='facebook',
        client_id=app.config.get('FACEBOOK_OAUTH_CLIENT_ID'),
        client_secret=app.config.get('FACEBOOK_OAUTH_CLIENT_SECRET'),
        access_token_url='https://graph.facebook.com/oauth/access_token',
        access_token_params=None,
        authorize_url='https://www.facebook.com/oauth/authorize',
        authorize_params=None,
        api_base_url='https://graph.facebook.com/',
        userinfo_endpoint='https://graph.facebook.com/me?fields=id,name,email,picture',
        client_kwargs={'scope': 'public_profile,email'},
    )
    
    # Twitter OAuth 2.0
    oauth.register(
        name='twitter',
        client_id=app.config.get('TWITTER_OAUTH_CLIENT_ID'),
        client_secret=app.config.get('TWITTER_OAUTH_CLIENT_SECRET'),
        server_metadata_url='https://auth.twitter.com/.well-known/oauth-authorization-server',
        client_kwargs={'scope': 'tweet.read users.read follows.read follows.write offline.access'},
    )


def get_oauth_client(provider):
    """Get OAuth client for specified provider"""
    try:
        return oauth.create_client(provider)
    except Exception as e:
        print(f"Error getting OAuth client for {provider}: {e}")
        return None


def parse_oauth_user_data(provider, user_data):
    """
    Parse OAuth provider user data into standard format
    
    Returns:
        dict: Standard user data with keys: email, name, picture, provider, provider_id
    """
    parsed = {
        'provider': provider,
        'email': None,
        'name': None,
        'picture': None,
        'provider_id': None,
    }
    
    if provider == 'google':
        parsed['email'] = user_data.get('email')
        parsed['name'] = user_data.get('name')
        parsed['picture'] = user_data.get('picture')
        parsed['provider_id'] = user_data.get('sub')
        
    elif provider == 'facebook':
        parsed['email'] = user_data.get('email')
        parsed['name'] = user_data.get('name')
        parsed['picture'] = user_data.get('picture', {}).get('data', {}).get('url') if isinstance(user_data.get('picture'), dict) else None
        parsed['provider_id'] = user_data.get('id')
        
    elif provider == 'twitter':
        # Twitter v2 API returns data in different format
        if 'data' in user_data:
            user_info = user_data.get('data', {})
            parsed['name'] = user_info.get('name')
            parsed['provider_id'] = user_info.get('id')
            # Twitter doesn't provide email via public API without special permission
            parsed['email'] = None
        else:
            parsed['name'] = user_data.get('name')
            parsed['provider_id'] = user_data.get('id')
            parsed['email'] = user_data.get('email')
    
    return parsed
