import os
import re

def fix_circular_imports():
    # Step 1: Fix models/__init__.py to be empty
    models_init_path = os.path.join('models', '__init__.py')
    with open(models_init_path, 'w') as f:
        f.write("""
# This file intentionally left empty to avoid circular imports
# Import models directly from app.models or app.models.discover
""")
    
    print(f"Updated {models_init_path}")
    
    # Step 2: Fix auth/routes.py and other module imports to use absolute imports
    modules = ['auth', 'profile', 'match', 'chat', 'dashboard', 'notifications', 'monetization', 'safety', 'chatbot', 'discover']
    
    for module in modules:
        routes_path = os.path.join(module, 'routes.py')
        if not os.path.exists(routes_path):
            continue
            
        try:
            with open(routes_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace relative imports with absolute imports
            if 'from ..models import' in content:
                content = content.replace('from ..models import', 'from app.models import')
            
            with open(routes_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Updated {routes_path}")
        except UnicodeDecodeError:
            print(f"Skipping {routes_path} due to encoding issues")
    
    # Step 3: Fix models/discover.py to use absolute imports
    discover_path = os.path.join('models', 'discover.py')
    if os.path.exists(discover_path):
        try:
            with open(discover_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace sys.path manipulation and relative imports
            content = re.sub(r'import sys\nimport os\n\n# Ensure the app directory is in the path\nsys\.path\.insert\(0, os\.path\.dirname\(os\.path\.dirname\(os\.path\.abspath\(__file__\)\)\)\)\n\n# Now import db from __init__\nfrom __init__ import db', 'from app import db', content)
            
            with open(discover_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Updated {discover_path}")
        except UnicodeDecodeError:
            print(f"Skipping {discover_path} due to encoding issues")

if __name__ == "__main__":
    fix_circular_imports()
    print("All circular imports fixed!")