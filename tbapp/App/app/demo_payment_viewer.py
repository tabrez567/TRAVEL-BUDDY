#!/usr/bin/env python3
"""
Demo script showing the enhanced database viewer functionality
"""

import sqlite3
import sys
import os

class PaymentTableDemo:
    def __init__(self):
        self.db_path = 'app.db'
        self.conn = None
        
    def connect(self):
        """Connect to database"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def demo_payment_features(self):
        """Demonstrate payment table features"""
        print("🚀 Database Viewer Payment Features Demo")
        print("=" * 50)
        
        if not self.connect():
            return
            
        cursor = self.conn.cursor()
        
        # 1. Show payment summary
        print("\n1️⃣ Payment Summary Dashboard:")
        print("-" * 30)
        
        cursor.execute("SELECT COUNT(*) FROM payments;")
        total = cursor.fetchone()[0]
        print(f"📊 Total Payments: {total}")
        
        cursor.execute("""
            SELECT payment_status, COUNT(*) as count 
            FROM payments 
            GROUP BY payment_status;
        """)
        print("📈 Status Breakdown:")
        for row in cursor.fetchall():
            print(f"  {row[0].title()}: {row[1]}")
        
        # 2. Show masked sensitive data
        print("\n2️⃣ Sensitive Data Masking:")
        print("-" * 30)
        
        cursor.execute("""
            SELECT transaction_id, card_last_four, card_holder_name, 
                   billing_address_line1, ip_address
            FROM payments 
            WHERE card_last_four IS NOT NULL
            LIMIT 2;
        """)
        
        print("🔒 Original vs Masked Data:")
        for row in cursor.fetchall():
            txn_id, card_last, holder, address, ip = row
            
            print(f"\nTransaction ID:")
            print(f"  Original: {txn_id}")
            print(f"  Masked:   {txn_id[:8]}***")
            
            print(f"Card:")
            print(f"  Original: ****{card_last}")
            print(f"  Masked:   ****{card_last}")
            
            print(f"Cardholder:")
            print(f"  Original: {holder}")
            print(f"  Masked:   {holder[0]}***")
            
            if address:
                print(f"Address:")
                print(f"  Original: {address}")
                print(f"  Masked:   {address[:10]}***")
            
            if ip:
                print(f"IP Address:")
                print(f"  Original: {ip}")
                parts = ip.split('.')
                if len(parts) == 4:
                    print(f"  Masked:   {parts[0]}.{parts[1]}.***.***.***")
        
        # 3. Show payment method statistics
        print("\n3️⃣ Payment Analytics:")
        print("-" * 30)
        
        cursor.execute("""
            SELECT payment_method, COUNT(*) as count, AVG(amount) as avg_amount
            FROM payments 
            GROUP BY payment_method;
        """)
        
        print("💸 Payment Method Analysis:")
        for row in cursor.fetchall():
            method, count, avg_amount = row
            print(f"  {method.title()}: {count} payments, avg ${avg_amount:.2f}")
        
        # 4. Show plan popularity
        cursor.execute("""
            SELECT plan_type, COUNT(*) as count, SUM(amount) as revenue
            FROM payments 
            WHERE payment_status = 'completed'
            GROUP BY plan_type;
        """)
        
        print("\n💰 Revenue by Plan:")
        total_revenue = 0
        for row in cursor.fetchall():
            plan, count, revenue = row
            print(f"  {plan.title()}: {count} subscriptions, ${revenue:.2f} revenue")
            total_revenue += revenue
        print(f"  Total Revenue: ${total_revenue:.2f}")
        
        self.conn.close()
        
        print("\n✅ Demo completed! Key features shown:")
        print("  🔒 Automatic sensitive data masking")
        print("  📊 Payment analytics and summaries")
        print("  💳 Card and billing information protection")
        print("  📈 Revenue and subscription tracking")
        print("\n🚀 Run 'python database_viewer.py' to use the interactive viewer!")

def main():
    demo = PaymentTableDemo()
    demo.demo_payment_features()

if __name__ == "__main__":
    main()