import os
import sys
import re

def fix_imports():
    # Fix circular imports between models.py and models/__init__.py
    models_init_path = os.path.join(os.getcwd(), 'models', '__init__.py')
    with open(models_init_path, 'w') as f:
        f.write('''
# Import models to make them available
from models.discover import UserPreference, UserAction, Match

# Add other model imports here as needed
''')
    print('Updated models/__init__.py')
    
    # Fix imports in __init__.py
    init_path = os.path.join(os.getcwd(), '__init__.py')
    with open(init_path, 'r') as f:
        content = f.read()
    
    # Update the user_loader function to import User directly from models.py
    updated_content = re.sub(
        r'@login_manager\.user_loader\s*\ndef load_user\(user_id\):\s*from models import User\s*return User\.query\.get\(int\(user_id\)\)',
        '@login_manager.user_loader\ndef load_user(user_id):\n    from models import User\n    return User.query.get(int(user_id))',
        content
    )
    
    with open(init_path, 'w') as f:
        f.write(updated_content)
    print('Updated __init__.py')
    
    # List of all blueprint directories
    blueprint_dirs = [
        'auth', 'profile', 'match', 'chat', 'dashboard', 
        'notifications', 'monetization', 'safety', 'chatbot'
    ]
    
    # Fix imports in blueprint files
    for bp in blueprint_dirs:
        routes_path = os.path.join(os.getcwd(), bp, 'routes.py')
        if os.path.exists(routes_path):
            with open(routes_path, 'r') as f:
                content = f.read()
            
            # Update import statements
            updated_content = content.replace('from models import User', 'import sys\nimport os\nsys.path.append(os.path.dirname(os.path.abspath(__file__)))\nfrom models import User')
            
            with open(routes_path, 'w') as f:
                f.write(updated_content)
            print(f'Updated {bp}/routes.py')

if __name__ == '__main__':
    fix_imports()
    print('\nAll import issues have been fixed. Try running the app now.')