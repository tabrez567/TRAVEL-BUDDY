import os
import re

# List of all blueprint directories
blueprint_dirs = [
    'auth', 'profile', 'match', 'chat', 'dashboard', 
    'notifications', 'monetization', 'safety', 'chatbot', 'discover'
]

# Fix imports in blueprint routes.py files
for bp in blueprint_dirs:
    # Fix routes.py
    routes_path = os.path.join(os.getcwd(), bp, 'routes.py')
    if os.path.exists(routes_path):
        with open(routes_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix imports
        content = re.sub(r'from __init__ import db', 'from app import db', content)
        content = re.sub(r'from models import (.*)', r'from app.models import \1', content)
        
        # Remove sys.path manipulation
        content = re.sub(r'import sys\s*import os\s*sys\.path\.append\(.*?\)\s*', '', content, flags=re.DOTALL)
        content = re.sub(r'import sys\s*import os\s*sys\.path\.insert\(.*?\)\s*', '', content, flags=re.DOTALL)
        
        # Fix blueprint definitions if needed
        if 'Blueprint(' in content and not f"url_prefix='/{bp}'" in content and not f'url_prefix="/{bp}"' in content:
            # Find the blueprint definition line
            bp_match = re.search(r'(\w+_bp = Blueprint\([\'|"]\w+[\'|"], __name__,\s*(?:template_folder=[\'|"]\w+[\'|"],\s*)?(?:static_folder=[\'|"]\w+[\'|"])?\))', content)
            if bp_match:
                old_bp_def = bp_match.group(1)
                new_bp_def = f"{bp}_bp = Blueprint('{bp}', __name__, url_prefix='/{bp}', template_folder='templates')"
                content = content.replace(old_bp_def, new_bp_def)
        
        with open(routes_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {bp}/routes.py')

print('All imports fixed!')