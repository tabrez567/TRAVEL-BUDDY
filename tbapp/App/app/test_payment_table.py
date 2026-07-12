#!/usr/bin/env python3
"""
Test the database viewer functionality with Payment table
"""

import sqlite3
import os

def test_payment_table():
    """Test that payment table exists and has data"""
    
    db_path = 'app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if payments table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payments';")
        if not cursor.fetchone():
            print("❌ Payments table not found")
            return
            
        print("✅ Payments table exists!")
        
        # Get table structure
        cursor.execute("PRAGMA table_info(payments);")
        columns = cursor.fetchall()
        print(f"\n📋 Payment table has {len(columns)} columns:")
        for col in columns[:10]:  # Show first 10
            col_id, name, data_type, not_null, default_val, pk = col
            pk_str = " (PK)" if pk else ""
            print(f"  • {name}: {data_type}{pk_str}")
        if len(columns) > 10:
            print(f"  ... and {len(columns) - 10} more columns")
        
        # Count records
        cursor.execute("SELECT COUNT(*) FROM payments;")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total payment records: {count}")
        
        if count > 0:
            # Show sample data (masked)
            cursor.execute("""
                SELECT transaction_id, plan_name, amount, payment_status, 
                       payment_method, card_last_four, card_holder_name
                FROM payments 
                LIMIT 3;
            """)
            
            print(f"\n💳 Sample payment records:")
            for i, row in enumerate(cursor.fetchall(), 1):
                txn_id, plan, amount, status, method, card_last, cardholder = row
                
                # Mask sensitive data
                masked_txn = f"{txn_id[:8]}***" if txn_id else "***"
                masked_card = f"****{card_last}" if card_last else "N/A"
                masked_holder = f"{cardholder[0]}***" if cardholder else "N/A"
                
                print(f"  {i}. {masked_txn} | {plan} | ${amount} | {status}")
                print(f"     Method: {method} | Card: {masked_card} | Holder: {masked_holder}")
        
        conn.close()
        
        print(f"\n✅ Database viewer test completed successfully!")
        print(f"🚀 You can now run 'python database_viewer.py' to explore the data")
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")

if __name__ == "__main__":
    print("🧪 Testing Payment table and database viewer...")
    test_payment_table()