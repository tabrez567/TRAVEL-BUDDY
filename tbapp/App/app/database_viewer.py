#!/usr/bin/env python3
"""
Interactive Database Viewer for Connectify Dating App
Provides an interactive menu to explore database tables
"""

import sqlite3
import os
from datetime import datetime

class DatabaseViewer:
    def __init__(self):
        self.db_path = 'app.db'
        self.conn = None
        
    def connect(self):
        """Connect to the database"""
        try:
            if not os.path.exists(self.db_path):
                print(f"❌ Database file not found: {self.db_path}")
                return False
                
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row  # Enable column access by name
            print(f"✅ Connected to database: {self.db_path}")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def get_tables(self):
        """Get all table names"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        return [row[0] for row in cursor.fetchall()]
    
    def show_table_structure(self, table_name):
        """Show table structure and info"""
        print(f"\n🔍 Table Structure: {table_name}")
        print("=" * 50)
        
        cursor = self.conn.cursor()
        
        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        
        print("Columns:")
        for col in columns:
            col_id, name, data_type, not_null, default_val, pk = col
            pk_str = " 🔑 PRIMARY KEY" if pk else ""
            null_str = " ❌ NOT NULL" if not_null else " ✅ NULLABLE"
            default_str = f" (Default: {default_val})" if default_val else ""
            print(f"  • {name}: {data_type}{pk_str}{null_str}{default_str}")
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total Records: {count}")
        
        return count
    
    def show_table_data(self, table_name, limit=10, offset=0):
        """Show table data with pagination"""
        cursor = self.conn.cursor()
        
        # Get data with limit and offset
        query = f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset};"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if not rows:
            print("📭 No data found in this table.")
            return False
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        print(f"\n📋 Data from {table_name} (Rows {offset+1}-{offset+len(rows)}):")
        print("-" * 80)
        
        for i, row in enumerate(rows, offset+1):
            print(f"\n📄 Record #{i}:")
            for col_name, value in zip(column_names, row):
                # Special handling for payment table sensitive data
                if table_name == 'payments' and self._is_sensitive_field(col_name):
                    value = self._mask_sensitive_data(col_name, value)
                
                # Format long text
                if isinstance(value, str) and len(value) > 100:
                    value = value[:97] + "..."
                print(f"  {col_name}: {value}")
        
        return True
    
    def search_table(self, table_name, column, search_term):
        """Search in a specific column"""
        cursor = self.conn.cursor()
        
        try:
            query = f"SELECT * FROM {table_name} WHERE {column} LIKE ? COLLATE NOCASE;"
            cursor.execute(query, (f"%{search_term}%",))
            rows = cursor.fetchall()
            
            if not rows:
                print(f"🔍 No results found for '{search_term}' in column '{column}'")
                return
            
            column_names = [description[0] for description in cursor.description]
            
            print(f"\n🎯 Search Results ({len(rows)} found):")
            print("-" * 60)
            
            for i, row in enumerate(rows, 1):
                print(f"\n📄 Result #{i}:")
                for col_name, value in zip(column_names, row):
                    # Special handling for payment table sensitive data
                    if table_name == 'payments' and self._is_sensitive_field(col_name):
                        value = self._mask_sensitive_data(col_name, value)
                    
                    if isinstance(value, str) and len(value) > 100:
                        value = value[:97] + "..."
                    print(f"  {col_name}: {value}")
                    
        except Exception as e:
            print(f"❌ Search failed: {e}")
    
    def run_custom_query(self, query):
        """Execute custom SQL query"""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute(query)
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                rows = cursor.fetchall()
                if rows:
                    column_names = [description[0] for description in cursor.description]
                    
                    print(f"\n📊 Query Results ({len(rows)} rows):")
                    print("-" * 60)
                    
                    for i, row in enumerate(rows, 1):
                        print(f"\nRow {i}:")
                        for col_name, value in zip(column_names, row):
                            # Check if this might be from payments table and mask sensitive data
                            if col_name in ['card_last_four', 'card_holder_name', 'gateway_transaction_id', 
                                          'billing_address_line1', 'billing_address_line2', 'ip_address', 'user_agent']:
                                value = self._mask_sensitive_data(col_name, value)
                            print(f"  {col_name}: {value}")
                else:
                    print("📭 No results returned.")
            else:
                print("✅ Query executed successfully.")
                
        except Exception as e:
            print(f"❌ Query failed: {e}")
    
    def interactive_menu(self):
        """Main interactive menu"""
        while True:
            print("\n" + "="*60)
            print("🗄️  CONNECTIFY DATABASE VIEWER")
            print("="*60)
            
            tables = self.get_tables()
            
            print("\n📋 Available Tables:")
            for i, table in enumerate(tables, 1):
                cursor = self.conn.cursor()
                cursor.execute(f"SELECT COUNT(*) FROM {table};")
                count = cursor.fetchone()[0]
                print(f"  {i}. {table} ({count} records)")
            
            print(f"\n🛠️  Options:")
            print("  s. Search in table")
            print("  q. Custom SQL query")
            print("  p. Payment summary (if payments table exists)")
            print("  r. Refresh view")
            print("  x. Exit")
            
            choice = input("\n➤ Select table number or option: ").strip().lower()
            
            if choice == 'x':
                print("👋 Goodbye!")
                break
            elif choice == 'r':
                continue
            elif choice == 's':
                self.search_menu(tables)
            elif choice == 'q':
                self.query_menu()
            elif choice == 'p':
                if 'payments' in tables:
                    self.show_payment_summary()
                    input("\n⏎ Press Enter to continue...")
                else:
                    print("❌ No payments table found in database.")
            elif choice.isdigit() and 1 <= int(choice) <= len(tables):
                table_name = tables[int(choice) - 1]
                self.table_menu(table_name)
            else:
                print("❌ Invalid choice. Please try again.")
    
    def table_menu(self, table_name):
        """Menu for specific table operations"""
        while True:
            print(f"\n📊 Table: {table_name}")
            print("-" * 40)
            
            count = self.show_table_structure(table_name)
            
            if count == 0:
                input("\n⏎ Press Enter to return to main menu...")
                return
            
            print(f"\n🛠️  Options:")
            print("  1. Show all data")
            print("  2. Show first 5 records")
            print("  3. Show last 5 records") 
            print("  4. Browse with pagination")
            if table_name == 'payments':
                print("  5. Payment summary dashboard")
            print("  b. Back to main menu")
            
            choice = input("\n➤ Choose option: ").strip()
            
            if choice == 'b':
                return
            elif choice == '1':
                self.show_table_data(table_name, limit=1000)
                input("\n⏎ Press Enter to continue...")
            elif choice == '2':
                self.show_table_data(table_name, limit=5)
                input("\n⏎ Press Enter to continue...")
            elif choice == '3':
                offset = max(0, count - 5)
                self.show_table_data(table_name, limit=5, offset=offset)
                input("\n⏎ Press Enter to continue...")
            elif choice == '4':
                self.pagination_menu(table_name, count)
            elif choice == '5' and table_name == 'payments':
                self.show_payment_summary()
                input("\n⏎ Press Enter to continue...")
            else:
                print("❌ Invalid choice.")
    
    def pagination_menu(self, table_name, total_count):
        """Pagination menu for browsing data"""
        page_size = 5
        current_page = 1
        total_pages = (total_count + page_size - 1) // page_size
        
        while True:
            offset = (current_page - 1) * page_size
            print(f"\n📄 Page {current_page} of {total_pages}")
            
            self.show_table_data(table_name, limit=page_size, offset=offset)
            
            print(f"\n🔄 Navigation:")
            if current_page > 1:
                print("  p. Previous page")
            if current_page < total_pages:
                print("  n. Next page")
            print("  g. Go to page")
            print("  b. Back")
            
            choice = input("\n➤ Choose: ").strip().lower()
            
            if choice == 'b':
                return
            elif choice == 'p' and current_page > 1:
                current_page -= 1
            elif choice == 'n' and current_page < total_pages:
                current_page += 1
            elif choice == 'g':
                try:
                    page = int(input("Enter page number: "))
                    if 1 <= page <= total_pages:
                        current_page = page
                    else:
                        print(f"❌ Page must be between 1 and {total_pages}")
                except ValueError:
                    print("❌ Invalid page number")
    
    def search_menu(self, tables):
        """Search menu"""
        print(f"\n🔍 Search in Tables")
        print("-" * 30)
        
        for i, table in enumerate(tables, 1):
            print(f"  {i}. {table}")
        
        try:
            choice = int(input("\n➤ Select table to search: "))
            if 1 <= choice <= len(tables):
                table_name = tables[choice - 1]
                
                # Show columns
                cursor = self.conn.cursor()
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = [col[1] for col in cursor.fetchall()]
                
                print(f"\nColumns in {table_name}:")
                for i, col in enumerate(columns, 1):
                    print(f"  {i}. {col}")
                
                col_choice = int(input("\n➤ Select column to search: "))
                if 1 <= col_choice <= len(columns):
                    column = columns[col_choice - 1]
                    search_term = input(f"➤ Enter search term for '{column}': ")
                    self.search_table(table_name, column, search_term)
                    input("\n⏎ Press Enter to continue...")
                
        except (ValueError, IndexError):
            print("❌ Invalid selection")
    
    def query_menu(self):
        """Custom query menu"""
        print(f"\n💻 Custom SQL Query")
        print("-" * 25)
        print("Examples:")
        print("  SELECT * FROM users WHERE age > 18;")
        print("  SELECT COUNT(*) FROM chatbot_messages;")
        print("  SELECT user_id, COUNT(*) FROM chatbot_conversations GROUP BY user_id;")
        print("\nPayment-related queries:")
        print("  SELECT plan_type, COUNT(*) FROM payments GROUP BY plan_type;")
        print("  SELECT * FROM payments WHERE payment_status = 'completed';")
        print("  SELECT u.name, p.plan_name, p.amount FROM users u JOIN payments p ON u.id = p.user_id;")
        print("  SELECT payment_method, AVG(amount) FROM payments GROUP BY payment_method;")
        
        query = input("\n➤ Enter SQL query: ")
        if query.strip():
            self.run_custom_query(query)
            input("\n⏎ Press Enter to continue...")
    
    def _is_sensitive_field(self, field_name):
        """Check if field contains sensitive payment information"""
        sensitive_fields = {
            'card_last_four', 'card_holder_name', 'gateway_transaction_id',
            'billing_address_line1', 'billing_address_line2', 'ip_address',
            'user_agent'
        }
        return field_name in sensitive_fields
    
    def _mask_sensitive_data(self, field_name, value):
        """Mask sensitive payment data for display"""
        if value is None:
            return None
            
        if field_name == 'card_last_four':
            return f"****{value}" if value else None
        elif field_name == 'card_holder_name':
            if value:
                parts = str(value).split()
                if len(parts) > 1:
                    return f"{parts[0][0]}*** {parts[-1][0]}***"
                else:
                    return f"{value[0]}***" if value else None
            return None
        elif field_name in ['billing_address_line1', 'billing_address_line2']:
            if value and len(str(value)) > 10:
                return str(value)[:10] + "***"
            return "***" if value else None
        elif field_name == 'ip_address':
            if value:
                parts = str(value).split('.')
                if len(parts) == 4:  # IPv4
                    return f"{parts[0]}.{parts[1]}.***.***.***"
                else:  # IPv6 or other
                    return "***:***:***"
            return None
        elif field_name in ['gateway_transaction_id', 'user_agent']:
            return "[HIDDEN]" if value else None
        
        return value
    
    def show_payment_summary(self):
        """Show payment statistics and summary"""
        cursor = self.conn.cursor()
        
        try:
            print("\n💳 Payment Summary Dashboard")
            print("=" * 50)
            
            # Total payments count
            cursor.execute("SELECT COUNT(*) FROM payments;")
            total_payments = cursor.fetchone()[0]
            print(f"📊 Total Payments: {total_payments}")
            
            if total_payments == 0:
                print("📭 No payment records found.")
                return
            
            # Payment status breakdown
            cursor.execute("""
                SELECT payment_status, COUNT(*) as count 
                FROM payments 
                GROUP BY payment_status 
                ORDER BY count DESC;
            """)
            print("\n📈 Payment Status Breakdown:")
            for status, count in cursor.fetchall():
                print(f"  {status.title()}: {count}")
            
            # Plan type breakdown
            cursor.execute("""
                SELECT plan_type, COUNT(*) as count 
                FROM payments 
                GROUP BY plan_type 
                ORDER BY count DESC;
            """)
            print("\n📋 Plan Type Distribution:")
            for plan, count in cursor.fetchall():
                print(f"  {plan.title()}: {count}")
            
            # Payment method breakdown
            cursor.execute("""
                SELECT payment_method, COUNT(*) as count 
                FROM payments 
                GROUP BY payment_method 
                ORDER BY count DESC;
            """)
            print("\n💸 Payment Method Usage:")
            for method, count in cursor.fetchall():
                print(f"  {method.title()}: {count}")
            
            # Revenue by plan (only completed payments)
            cursor.execute("""
                SELECT plan_type, SUM(amount) as revenue 
                FROM payments 
                WHERE payment_status = 'completed'
                GROUP BY plan_type 
                ORDER BY revenue DESC;
            """)
            revenue_data = cursor.fetchall()
            if revenue_data:
                print("\n💰 Revenue by Plan (Completed Payments):")
                total_revenue = 0
                for plan, revenue in revenue_data:
                    print(f"  {plan.title()}: ${revenue:.2f}")
                    total_revenue += revenue
                print(f"  Total Revenue: ${total_revenue:.2f}")
            
            # Recent payments (last 5)
            cursor.execute("""
                SELECT transaction_id, plan_name, amount, payment_status, created_at 
                FROM payments 
                ORDER BY created_at DESC 
                LIMIT 5;
            """)
            recent_payments = cursor.fetchall()
            if recent_payments:
                print("\n🕒 Recent Payments:")
                for txn_id, plan, amount, status, created in recent_payments:
                    # Mask transaction ID
                    masked_txn = f"{txn_id[:8]}***" if txn_id else "***"
                    print(f"  {masked_txn} | {plan} | ${amount:.2f} | {status} | {created}")
                    
        except Exception as e:
            print(f"❌ Error generating payment summary: {e}")
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

def main():
    print("🚀 Starting Interactive Database Viewer...")
    
    viewer = DatabaseViewer()
    
    if viewer.connect():
        try:
            viewer.interactive_menu()
        except KeyboardInterrupt:
            print("\n\n👋 Exiting...")
        finally:
            viewer.close()
    else:
        print("❌ Failed to connect to database.")

if __name__ == "__main__":
    main()