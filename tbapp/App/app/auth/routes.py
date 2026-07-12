from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import os
import secrets

# Import db and User model
from extensions import db
from models import User
from mongodb_models import mongo_get_user_by_email, mongo_create_user

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth', template_folder='templates')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login page"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        # Check if user exists in MongoDB (storing login info there)
        user_data = mongo_get_user_by_email(email)
        
        # Check if credentials are correct in MongoDB
        if not user_data or not check_password_hash(user_data['password'], password):
            flash('Please check your login details and try again.', 'danger')
            return redirect(url_for('auth.login'))
            
        # For compatibility with the rest of the application (SQL relationships),
        # we log in the SQL user instance.
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # If user exists in Mongo but not SQL, create a shell SQL user
            user = User(
                email=email,
                name=user_data.get('name', email),
                password='STORED_IN_MONGODB', # Dummy password for SQL
                is_verified=True,
                profile_complete=True
            )
            db.session.add(user)
            db.session.commit()
            
        # Log in the user
        login_user(user, remember=remember)
        
        # Update last login time in both to be sure
        from mongodb_models import mongo_update_user
        mongo_update_user(user_data['_id'], {'last_login': datetime.utcnow()})
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Debug: Print login success
        print(f"[DEBUG] User {email} authenticated via MongoDB")
        
        # Redirect to dashboard
        flash('Logged in successfully!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    
    return render_template('auth/login.html')

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    """User registration page"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.dashboard'))
    
    if request.method == 'POST':
        # Print form data for debugging
        print(f"[DEBUG] Form data: {request.form}")
        print(f"[DEBUG] Files: {request.files}")
        
        email = request.form.get('email')
        name = request.form.get('name')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        terms = request.form.get('terms')
        
        # Validate form data
        error = False
        
        if not email or not name or not password or not confirm_password:
            flash('All fields are required', 'danger')
            error = True
            
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            error = True
            
        if not terms:
            flash('You must agree to the terms and conditions', 'danger')
            error = True
        
        # Check if user already exists in MongoDB
        user_data = mongo_get_user_by_email(email)
        
        if user_data:
            flash('Email address already exists', 'danger')
            error = True
            
        if error:
            # Return to the form with errors
            return render_template('auth/signup.html')
            
        # Create new user in MongoDB (PRIMARY store for login info)
        user_data = mongo_create_user(
            email=email,
            name=name,
            password=password,
            is_verified=True,
            profile_complete=True
        )
        
        # Create shell user in SQLite for relationships
        new_user = User(
            email=email,
            name=name,
            password='STORED_IN_MONGODB',
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        )
        
        # Add user to SQLite
        try:
            db.session.add(new_user)
            db.session.commit()
            
            # Store SQL ID in Mongo for reference
            from mongodb_models import mongo_update_user
            mongo_update_user(user_data['_id'], {'sql_id': new_user.id})
        except Exception as e:
            print(f"Error creating SQL shell user: {e}")
            db.session.rollback()
            # If SQL fails, we might have a problem with relations, 
            # but for now we continue as Mongo is the primary for auth
        
        # Handle profile picture upload if present
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                filename = secure_filename(f"{email}_{int(datetime.utcnow().timestamp())}.jpg")
                upload_dir = os.path.join('app', 'static', 'uploads')
                os.makedirs(upload_dir, exist_ok=True)
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                profile_pic_url = f'/static/uploads/{filename}'
                from mongodb_models import mongo_update_user
                mongo_update_user(user_data['_id'], {'profile_picture': profile_pic_url})
                new_user.profile_picture = profile_pic_url
                db.session.commit()
        
        # Log in the user (using SQL object for compatibility)
        login_user(new_user)
        
        flash('Account created successfully!', 'success')
        # Redirect to Travel Buddy dashboard after signup
        return redirect(url_for('dashboard.dashboard'))
    
    return render_template('auth/signup.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    """Password reset request page"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Placeholder for password reset functionality
        # Database code will be implemented later
        # For now, just show a message
        flash('Password reset functionality will be implemented with database later.', 'info')
        
        return redirect(url_for('auth.login'))
    
    return render_template('auth/reset_password.html')

# ==================== OAuth Routes ====================

@auth_bp.route('/oauth/<provider>')
def oauth_authorize(provider):
    """Redirect to OAuth provider"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.dashboard'))
    
    # Validate provider
    if provider not in ['google', 'facebook', 'twitter']:
        flash('Invalid OAuth provider', 'danger')
        return redirect(url_for('auth.login'))
    
    # Check if OAuth is configured
    config_keys = {
        'google': ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'],
        'facebook': ['FACEBOOK_OAUTH_CLIENT_ID', 'FACEBOOK_OAUTH_CLIENT_SECRET'],
        'twitter': ['TWITTER_OAUTH_CLIENT_ID', 'TWITTER_OAUTH_CLIENT_SECRET'],
    }
    
    from flask import current_app
    required_keys = config_keys.get(provider, [])
    if not all(current_app.config.get(key) for key in required_keys):
        print(f"[WARNING] {provider.upper()} OAuth not configured")
        flash(f'{provider.capitalize()} OAuth is not configured', 'danger')
        return redirect(url_for('auth.login'))
    
    try:
        from oauth_service import oauth
        client = oauth.create_client(provider)
        
        redirect_uri = url_for('auth.oauth_callback', provider=provider, _external=True)
        return client.authorize_redirect(redirect_uri)
    except Exception as e:
        print(f"[ERROR] OAuth redirect error for {provider}: {e}")
        flash(f'Error connecting to {provider.capitalize()}', 'danger')
        return redirect(url_for('auth.login'))


@auth_bp.route('/oauth/callback/<provider>')
def oauth_callback(provider):
    """Handle OAuth callback"""
    
    # Validate provider
    if provider not in ['google', 'facebook', 'twitter']:
        flash('Invalid OAuth provider', 'danger')
        return redirect(url_for('auth.login'))
    
    try:
        from oauth_service import oauth, parse_oauth_user_data
        
        client = oauth.create_client(provider)
        
        # Handle authorization response
        token = client.authorize_access_token()
        if token is None:
            raise Exception('Failed to get access token')
        
        # Get user info from provider
        if provider == 'google':
            user_data = client.get(f'{client.load_server_metadata()["userinfo_endpoint"]}', token=token).json()
        elif provider == 'facebook':
            user_data = client.get('/me?fields=id,name,email,picture', token=token).json()
        elif provider == 'twitter':
            # Twitter v2 API
            user_data = client.get('/2/users/me', token=token).json()
            # Get additional user info
            user_info_response = client.get('/2/users/me?user.fields=created_at,description,public_metrics', token=token).json()
            if 'data' in user_info_response:
                user_data['data'].update(user_info_response['data'])
        else:
            raise Exception(f'Unsupported provider: {provider}')
        
        # Parse user data
        parsed_data = parse_oauth_user_data(provider, user_data)
        
        # Generate email if not provided (for Twitter)
        if not parsed_data['email']:
            # For Twitter or other providers without email, create a pseudo-email
            parsed_data['email'] = f"{provider}_{parsed_data['provider_id']}@travel-buddy.local"
        
        # Ensure email is lowercase
        parsed_data['email'] = parsed_data['email'].lower()
        
        print(f"[INFO] OAuth login attempt for {provider}: {parsed_data['email']}")
        
        # Check if user exists in MongoDB
        user_data = mongo_get_user_by_email(parsed_data['email'])
        
        if user_data:
            # User exists, log them in
            print(f"[INFO] Existing user logged in via {provider}: {parsed_data['email']}")
            
            # Update last login
            from mongodb_models import mongo_update_user
            mongo_update_user(user_data['_id'], {
                'last_login': datetime.utcnow(),
                f'{provider}_id': parsed_data['provider_id']  # Store OAuth provider ID
            })
        else:
            # Create new user
            print(f"[INFO] Creating new user via {provider}: {parsed_data['email']}")
            
            # Generate a random password for OAuth users (they won't use it)
            random_password = secrets.token_urlsafe(16)
            
            user_data = mongo_create_user(
                email=parsed_data['email'],
                name=parsed_data['name'] or parsed_data['email'].split('@')[0],
                password=random_password,
                is_verified=True,
                profile_complete=False,
                **{f'{provider}_id': parsed_data['provider_id']},  # Store OAuth provider ID
                profile_picture=parsed_data['picture'],
                oauth_provider=provider,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            
            # Also create SQL shell user for relationships
            sql_user = User(
                email=parsed_data['email'],
                name=parsed_data['name'] or parsed_data['email'].split('@')[0],
                password='STORED_IN_MONGODB',
                profile_picture=parsed_data['picture'],
                is_verified=True,
                profile_complete=False,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            
            try:
                db.session.add(sql_user)
                db.session.commit()
                
                # Store SQL ID in Mongo for reference
                from mongodb_models import mongo_update_user
                mongo_update_user(user_data['_id'], {'sql_id': sql_user.id})
            except Exception as e:
                print(f"[ERROR] Failed to create SQL shell user: {e}")
                db.session.rollback()
        
        # Get or create SQL user for Flask-Login
        sql_user = User.query.filter_by(email=parsed_data['email']).first()
        
        if not sql_user:
            # Create a shell SQL user if it doesn't exist
            sql_user = User(
                email=parsed_data['email'],
                name=parsed_data['name'] or parsed_data['email'].split('@')[0],
                password='STORED_IN_MONGODB',
                profile_picture=parsed_data['picture'],
                is_verified=True,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            db.session.add(sql_user)
            db.session.commit()
        
        # Log in the user
        login_user(sql_user, remember=True)
        
        # Update last login on SQL user
        sql_user.last_login = datetime.utcnow()
        db.session.commit()
        
        flash(f'Successfully logged in with {provider.capitalize()}!', 'success')
        return redirect(url_for('dashboard.dashboard'))
        
    except Exception as e:
        print(f"[ERROR] OAuth callback error for {provider}: {e}")
        import traceback
        traceback.print_exc()
        
        flash(f'Authentication failed. Please try again or use email/password login.', 'danger')
        return redirect(url_for('auth.login'))