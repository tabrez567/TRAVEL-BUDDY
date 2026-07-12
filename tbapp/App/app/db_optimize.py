from app import create_app, db

def optimize_sqlite():
    """Apply recommended SQLite optimizations"""
    app = create_app()
    
    with app.app_context():
        # Get SQLite connection
        connection = db.engine.raw_connection()
        cursor = connection.cursor()
        
        # Apply pragmas for better performance
        cursor.execute('PRAGMA journal_mode = WAL;')  # Write-Ahead Logging for better concurrency
        cursor.execute('PRAGMA synchronous = NORMAL;')  # Sync less often for better performance
        cursor.execute('PRAGMA cache_size = -64000;')  # Use 64MB of memory for DB cache
        cursor.execute('PRAGMA foreign_keys = ON;')  # Enforce foreign key constraints
        cursor.execute('PRAGMA temp_store = MEMORY;')  # Store temp tables in memory
        
        # Optimize the database
        cursor.execute('VACUUM;')  # Rebuild the database file to defragment
        cursor.execute('ANALYZE;')  # Collect statistics for query optimization
        
        # Commit changes
        connection.commit()
        
        # Get current settings to verify
        pragmas = [
            'journal_mode', 'synchronous', 'cache_size', 
            'foreign_keys', 'temp_store'
        ]
        
        print("SQLite Optimization Settings:")
        for pragma in pragmas:
            cursor.execute(f'PRAGMA {pragma};')
            value = cursor.fetchone()[0]
            print(f"  {pragma}: {value}")
        
        # Close cursor and connection
        cursor.close()
        connection.close()
        
        print("\nSQLite database optimized successfully.")

def create_indexes():
    """Create indexes for commonly queried columns"""
    app = create_app()
    
    with app.app_context():
        # Get SQLite connection
        connection = db.engine.raw_connection()
        cursor = connection.cursor()
        
        # Create indexes for commonly queried columns
        indexes = [
            # User indexes
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);",
            "CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);",
            "CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);",
            "CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);",
            
            # Match indexes
            "CREATE INDEX IF NOT EXISTS idx_matches_user_id ON user_matches(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON user_matches(matched_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_matches_matched ON user_matches(matched);",
            
            # Message indexes
            "CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);",
            "CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);",
            "CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);",
            
            # Conversation indexes
            "CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);",
            "CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);",
            "CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);",
        ]
        
        print("Creating database indexes:")
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                print(f"  Created: {index_sql}")
            except Exception as e:
                print(f"  Error creating index: {e}")
        
        # Commit changes
        connection.commit()
        
        # Close cursor and connection
        cursor.close()
        connection.close()
        
        print("\nDatabase indexes created successfully.")

def backup_database():
    """Create a backup of the SQLite database"""
    import os
    import shutil
    import datetime
    from app import config
    
    app = create_app()
    
    with app.app_context():
        # Get database file path
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        
        # Create backups directory if it doesn't exist
        backups_dir = os.path.join(os.path.dirname(db_path), 'backups')
        os.makedirs(backups_dir, exist_ok=True)
        
        # Generate backup filename with timestamp
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"app_db_backup_{timestamp}.db"
        backup_path = os.path.join(backups_dir, backup_filename)
        
        # Copy database file to backup location
        shutil.copy2(db_path, backup_path)
        
        print(f"Database backup created: {backup_path}")
        
        # Clean up old backups (keep only last 5)
        backups = sorted([
            os.path.join(backups_dir, f) 
            for f in os.listdir(backups_dir) 
            if f.startswith('app_db_backup_')
        ])
        
        if len(backups) > 5:
            for old_backup in backups[:-5]:
                os.remove(old_backup)
                print(f"Removed old backup: {old_backup}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python db_optimize.py [optimize|indexes|backup|all]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "optimize":
        optimize_sqlite()
    elif command == "indexes":
        create_indexes()
    elif command == "backup":
        backup_database()
    elif command == "all":
        optimize_sqlite()
        create_indexes()
        backup_database()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: optimize, indexes, backup, all")
        sys.exit(1)