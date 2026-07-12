import sys
import os
sys.path.insert(0, os.path.abspath('app'))
from app import create_app
from models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("SQL Users:")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Name: {u.name}")
