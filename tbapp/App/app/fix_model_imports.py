import os
import re

def fix_model_imports():
    # Fix models/__init__.py to properly expose models
    models_init_path = os.path.join('models', '__init__.py')
    with open(models_init_path, 'w') as f:
        f.write("""
# This file serves as a central point for importing models throughout the application

# Re-export models from the parent module
from ..models import User, Match, Message, Conversation

# Import models from discover.py
from .discover import UserPreference, UserAction
""")
    
    print(f"Updated {models_init_path}")
    
    # Fix auth/routes.py and other module imports
    modules = ['auth', 'profile', 'match', 'chat', 'dashboard', 'notifications', 'monetization', 'safety', 'chatbot', 'discover']
    
    for module in modules:
        routes_path = os.path.join(module, 'routes.py')
        if not os.path.exists(routes_path):
            continue
            
        with open(routes_path, 'r') as f:
            content = f.read()
        
        # Replace 'from app.models import User' with 'from ..models import User'
        content = re.sub(r'from app\.models import (.*)', r'from ..models import \1', content)
        
        with open(routes_path, 'w') as f:
            f.write(content)
        
        print(f"Updated {routes_path}")

if __name__ == "__main__":
    fix_model_imports()
    print("All model imports fixed!")