#!/usr/bin/env python3
"""
Create database tables including the new Payment model
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extensions import db
from models import User, Payment, Match, Message, Conversation, UserPreference, ChatbotConversation, ChatbotMessage
from __init__ import create_app

def create_tables():
    """Create all database tables"""
    
    app = create_app()
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Successfully created all database tables!")
            
            # Check what tables were created
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"\n📋 Available tables in database:")
            for table in sorted(tables):
                print(f"  • {table}")
                
            # Check if payments table was created
            if 'payments' in tables:
                print(f"\n💳 Payments table created successfully!")
                
                # Get column info for payments table
                columns = inspector.get_columns('payments')
                print(f"   Columns ({len(columns)}):")
                for col in columns[:10]:  # Show first 10 columns
                    print(f"     - {col['name']}: {col['type']}")
                if len(columns) > 10:
                    print(f"     ... and {len(columns) - 10} more columns")
            else:
                print("❌ Payments table was not created")
                
        except Exception as e:
            print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    print("🚀 Creating database tables...")
    create_tables()