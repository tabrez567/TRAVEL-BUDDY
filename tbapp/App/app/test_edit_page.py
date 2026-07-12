import sys
sys.path.append('.')
from models import User, db
from __init__ import create_app
import time

app = create_app()

# Create a test user if it doesn't exist
with app.app_context():
    user = User.query.filter_by(email='test@example.com').first()
    if not user:
        user = User(email='test@example.com', username='testuser')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        print('User created')
    else:
        print('User already exists')

    # Test the edit route
    with app.test_client() as client:
        # Login
        response = client.post('/auth/login', data={
            'email': 'test@example.com',
            'password': 'password123'
        }, follow_redirects=True)
        
        print(f"Login response: {response.status_code}")
        
        # Access edit page
        response = client.get('/profile/edit')
        print(f"Edit page response: {response.status_code}")
        
        if response.status_code == 200:
            print("Edit page loaded successfully")
            # Check if 'form' is in the template context
            if b'form.hidden_tag()' in response.data:
                print("Form is being used in the template")
            else:
                print("Form is not being used in the template or is undefined")
        else:
            print(f"Failed to load edit page: {response.status_code}")
