import os

# List of all blueprint directories
blueprint_dirs = [
    'auth', 'profile', 'match', 'chat', 'dashboard', 
    'notifications', 'monetization', 'safety', 'chatbot', 'discover'
]

# Fix imports in blueprint __init__.py files
for bp in blueprint_dirs:
    # Fix __init__.py
    init_path = os.path.join(os.getcwd(), bp, '__init__.py')
    if os.path.exists(init_path):
        with open(init_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace 'from {bp} import routes' with 'from . import routes'
        updated_content = content.replace(f'from {bp} import routes', 'from . import routes')
        
        with open(init_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f'Updated {bp}/__init__.py')

print('All __init__.py files fixed!')