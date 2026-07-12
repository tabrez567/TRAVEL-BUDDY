import os
import shutil

def restructure_models():
    # Step 1: Create a backup of models.py
    shutil.copy('models.py', 'models.py.bak')
    print("Created backup of models.py")
    
    # Step 2: Move the content of models.py to models/base.py
    with open('models.py', 'r', encoding='utf-8') as f:
        models_content = f.read()
    
    # Create models/base.py
    with open(os.path.join('models', 'base.py'), 'w', encoding='utf-8') as f:
        f.write(models_content)
    
    print("Created models/base.py with content from models.py")
    
    # Step 3: Update models/__init__.py to import from base.py
    with open(os.path.join('models', '__init__.py'), 'w', encoding='utf-8') as f:
        f.write("""
# Import models from base.py
from app.models.base import User, Match, Message, Conversation

# Import models from discover.py
from app.models.discover import UserPreference, UserAction
""")
    
    print("Updated models/__init__.py")
    
    # Step 4: Update imports in all modules
    modules = ['auth', 'profile', 'match', 'chat', 'dashboard', 'notifications', 'monetization', 'safety', 'chatbot', 'discover']
    
    for module in modules:
        routes_path = os.path.join(module, 'routes.py')
        if not os.path.exists(routes_path):
            continue
            
        try:
            with open(routes_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace imports
            content = content.replace('from app.models import User', 'from app.models import User')
            
            with open(routes_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Updated {routes_path}")
        except UnicodeDecodeError:
            print(f"Skipping {routes_path} due to encoding issues")

if __name__ == "__main__":
    restructure_models()
    print("Models restructured successfully!")