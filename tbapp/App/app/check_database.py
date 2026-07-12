#!/usr/bin/env python3
"""
Database inspection script for Connectify Dating App
Shows all tables, their structure, and sample data
"""

import sqlite3
import os
from datetime import datetime

def check_database():
    """Check database tables and their contents"""
    
    # Database path (SQLite file)
    db_path = 'app.db'  # Default SQLite database
    
    if not os.path.exists(db_path):
        print("❌ Database file not found at:", db_path)
        print("🔍 Looking for alternative database files...")
        
        # Check for other possible database names
        possible_dbs = ['dummy_app.db', 'instance/app.db', 'database.db']
        for db_file in possible_dbs:
            if os.path.exists(db_file):
                print(f"✅ Found database: {db_file}")
                db_path = db_file
                break
        else:
            print("❌ No database files found. Make sure the app has been run at least once.")
            return
    
    print(f"🗄️  Checking database: {db_path}")
    print("=" * 60)
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("❌ No tables found in the database")
            return
        
        print(f"📊 Found {len(tables)} tables:")
        print("-" * 40)
        
        for table_tuple in tables:
            table_name = table_tuple[0]
            print(f"\n🔹 Table: {table_name}")
            
            # Get table structure
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print("   Columns:")
            for col in columns:
                col_id, col_name, col_type, not_null, default_val, primary_key = col
                pk_marker = " (PRIMARY KEY)" if primary_key else ""
                null_marker = " NOT NULL" if not_null else ""
                default_marker = f" DEFAULT {default_val}" if default_val else ""
                print(f"     • {col_name}: {col_type}{pk_marker}{null_marker}{default_marker}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            row_count = cursor.fetchone()[0]
            print(f"   📈 Rows: {row_count}")
            
            # Show sample data (first 3 rows)
            if row_count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
                sample_rows = cursor.fetchall()
                
                if sample_rows:
                    print("   📋 Sample data:")
                    column_names = [desc[1] for desc in columns]
                    
                    for i, row in enumerate(sample_rows, 1):
                        print(f"     Row {i}:")
                        for col_name, value in zip(column_names, row):
                            # Truncate long values
                            str_value = str(value)
                            if len(str_value) > 50:
                                str_value = str_value[:47] + "..."
                            print(f"       {col_name}: {str_value}")
                        print()
        
        print("=" * 60)
        print("✅ Database inspection complete!")
        
        # Additional statistics
        print("\n📊 Database Statistics:")
        total_rows = 0
        for table_tuple in tables:
            table_name = table_tuple[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            total_rows += count
            if count > 0:
                print(f"   • {table_name}: {count} records")
        
        print(f"\n🎯 Total records across all tables: {total_rows}")
        
        # Check for specific Connectify tables
        expected_tables = ['users', 'user_matches', 'messages', 'conversations', 
                          'chatbot_conversations', 'chatbot_messages', 'user_preferences']
        
        print(f"\n🔍 Expected Connectify Tables Check:")
        existing_table_names = [t[0] for t in tables]
        
        for expected in expected_tables:
            if expected in existing_table_names:
                cursor.execute(f"SELECT COUNT(*) FROM {expected};")
                count = cursor.fetchone()[0]
                print(f"   ✅ {expected}: {count} records")
            else:
                print(f"   ❌ {expected}: Missing")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🔍 Connectify Database Inspector")
    print(f"⏰ Running at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    check_database()