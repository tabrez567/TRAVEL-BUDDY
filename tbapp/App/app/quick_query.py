#!/usr/bin/env python3
"""
Quick Database Query Tool for Connectify
Simple tool to run common database queries
"""

import sqlite3
import sys

def run_query(query):
    """Run a single query and display results"""
    try:
        conn = sqlite3.connect('app.db')
        cursor = conn.cursor()
        cursor.execute(query)
        
        if query.strip().upper().startswith('SELECT'):
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            
            if rows:
                print(f"📊 Results ({len(rows)} rows):")
                print("-" * 60)
                
                # Print headers
                print(" | ".join(f"{col:<15}" for col in columns))
                print("-" * (len(columns) * 17))
                
                # Print data
                for row in rows:
                    formatted_row = []
                    for value in row:
                        str_val = str(value) if value is not None else "NULL"
                        if len(str_val) > 15:
                            str_val = str_val[:12] + "..."
                        formatted_row.append(f"{str_val:<15}")
                    print(" | ".join(formatted_row))
            else:
                print("📭 No results found.")
        else:
            print("✅ Query executed successfully.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

# Common queries
QUICK_QUERIES = {
    "1": ("Show all users", "SELECT id, name, email, age, location FROM users;"),
    "2": ("Show chatbot conversations", "SELECT id, user_id, title, created_at FROM chatbot_conversations;"),
    "3": ("Show recent chatbot messages", "SELECT id, content, role, created_at FROM chatbot_messages ORDER BY created_at DESC LIMIT 10;"),
    "4": ("Count records in all tables", """
        SELECT 'users' as table_name, COUNT(*) as count FROM users
        UNION ALL
        SELECT 'chatbot_conversations', COUNT(*) FROM chatbot_conversations
        UNION ALL  
        SELECT 'chatbot_messages', COUNT(*) FROM chatbot_messages
        UNION ALL
        SELECT 'user_matches', COUNT(*) FROM user_matches;"""),
    "5": ("Show table structures", "SELECT name FROM sqlite_master WHERE type='table';")
}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Command line mode
        query = " ".join(sys.argv[1:])
        run_query(query)
    else:
        # Interactive mode
        print("🔍 Quick Database Query Tool")
        print("=" * 40)
        
        print("\n📋 Quick Queries:")
        for key, (desc, query) in QUICK_QUERIES.items():
            print(f"  {key}. {desc}")
        print("  c. Custom query")
        print("  x. Exit")
        
        while True:
            choice = input("\n➤ Select option: ").strip()
            
            if choice == 'x':
                break
            elif choice in QUICK_QUERIES:
                desc, query = QUICK_QUERIES[choice]
                print(f"\n🔍 {desc}")
                run_query(query)
                input("\n⏎ Press Enter to continue...")
            elif choice == 'c':
                custom_query = input("\n➤ Enter SQL query: ")
                if custom_query.strip():
                    run_query(custom_query)
                    input("\n⏎ Press Enter to continue...")
            else:
                print("❌ Invalid choice.")