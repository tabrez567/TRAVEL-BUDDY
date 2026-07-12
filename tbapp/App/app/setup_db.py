import os
import sys

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.migrations import init_migrations, upgrade_database
from app.db_optimize import optimize_sqlite, create_indexes, backup_database

def setup_database():
    """Set up the database with migrations and optimizations"""
    print("Setting up the database...")
    
    # Create the application
    app = create_app()
    
    with app.app_context():
        # Check if database exists
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        db_exists = os.path.exists(db_path)
        
        if not db_exists:
            print("Creating database tables...")
            db.create_all()
            print("Database tables created.")
        
        # Initialize migrations
        print("\nInitializing database migrations...")
        init_migrations()
        
        # Apply optimizations
        print("\nOptimizing SQLite database...")
        optimize_sqlite()
        
        # Create indexes
        print("\nCreating database indexes...")
        create_indexes()
        
        # Create backup
        print("\nCreating database backup...")
        backup_database()
    
    print("\nDatabase setup completed successfully!")

if __name__ == "__main__":
    setup_database()