from flask_migrate import Migrate
from app import create_app, db

def setup_migrations():
    """Set up database migrations with Flask-Migrate"""
    app = create_app()
    migrate = Migrate(app, db)
    return app, migrate

def init_migrations():
    """Initialize migrations if they don't exist"""
    import os
    from flask_migrate import init, stamp
    
    app, migrate = setup_migrations()
    
    with app.app_context():
        # Check if migrations directory exists
        if not os.path.exists(os.path.join(app.root_path, 'migrations')):
            # Initialize migrations
            init()
            # Create initial migration and stamp it as current
            stamp()
            print("Migrations initialized successfully.")
        else:
            print("Migrations directory already exists.")

def create_migration(message="database update"):
    """Create a new migration with the given message"""
    from flask_migrate import migrate
    
    app, _ = setup_migrations()
    
    with app.app_context():
        migrate(message=message)
        print(f"Migration created with message: {message}")

def upgrade_database():
    """Upgrade the database to the latest migration"""
    from flask_migrate import upgrade
    
    app, _ = setup_migrations()
    
    with app.app_context():
        upgrade()
        print("Database upgraded successfully.")

def downgrade_database(revision="-1"):
    """Downgrade the database to the specified revision"""
    from flask_migrate import downgrade
    
    app, _ = setup_migrations()
    
    with app.app_context():
        downgrade(revision)
        print(f"Database downgraded to revision: {revision}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python migrations.py [init|create|upgrade|downgrade]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "init":
        init_migrations()
    elif command == "create":
        message = sys.argv[2] if len(sys.argv) > 2 else "database update"
        create_migration(message)
    elif command == "upgrade":
        upgrade_database()
    elif command == "downgrade":
        revision = sys.argv[2] if len(sys.argv) > 2 else "-1"
        downgrade_database(revision)
    else:
        print(f"Unknown command: {command}")
        print("Available commands: init, create, upgrade, downgrade")
        sys.exit(1)