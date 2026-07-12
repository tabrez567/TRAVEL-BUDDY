import sys
import os

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app
from extensions import db
from models import User
from mongodb_models import mongo_get_user_by_email, mongo_create_user, get_mongo_db

def migrate():
    # Loop through both databases
    for use_dummy in [False, True]:
        db_type = "DUMMY" if use_dummy else "REAL"
        print(f"\n--- Migrating {db_type} Users to MongoDB ---")
        app = create_app(use_dummy_db=use_dummy)
        
        mongo_db = get_mongo_db()
        if mongo_db is None:
            print("MongoDB not connected. Skipping.")
            continue
            
        with app.app_context():
            users = User.query.all()
            for u in users:
                existing = mongo_get_user_by_email(u.email)
                if not existing:
                    print(f"Migrating {u.email}...")
                    # Insert directly to preserve password hash if possible, 
                    # but mongo_create_user hashes the password.
                    # We should probably insert manually to preserve the hash.
                    user_doc = {
                        'email': u.email.lower(),
                        'name': u.name,
                        'password': u.password, # Keep the same hash!
                        'created_at': u.created_at or datetime.utcnow(),
                        'last_login': u.last_login,
                        'is_verified': u.is_verified,
                        'profile_complete': u.profile_complete,
                        'sql_id': u.id # Store SQL ID for reference
                    }
                    mongo_db.users.insert_one(user_doc)
                    print(f"Done for {u.email}")
                else:
                    print(f"User {u.email} already in MongoDB.")
                    # Update SQL ID if missing
                    mongo_db.users.update_one(
                        {'email': u.email},
                        {'$set': {'sql_id': u.id}}
                    )

if __name__ == '__main__':
    from datetime import datetime
    migrate()
