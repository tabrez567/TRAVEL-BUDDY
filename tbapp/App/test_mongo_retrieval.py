import sys
import os
sys.path.insert(0, os.path.abspath('app'))
from app import create_app
from mongodb_models import get_user_conversations
from extensions import init_mongodb

app = create_app()
with app.app_context():
    init_mongodb(app)
    user_id = 9 # Alice Admin
    convs = get_user_conversations(user_id)
    print(f"User {user_id} conversations count: {len(convs)}")
    for c in convs:
        print(f"- CID: {c.get('conversation_id')}, User: {c.get('user', {}).get('name')}")
