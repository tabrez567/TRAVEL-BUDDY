#!/usr/bin/env python3
"""
Add sample payment data to test the Payment model and database viewer
"""

import sys
import os
from datetime import datetime, timedelta

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extensions import db
from models import User, Payment
from __init__ import create_app

def add_sample_payment_data():
    """Add sample payment records for testing"""
    
    app = create_app()
    
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
        # Check if we have any users
        users = User.query.all()
        if not users:
            print("❌ No users found in database. Please add users first.")
            return
        
        # Check if payment data already exists
        existing_payments = Payment.query.count()
        if existing_payments > 0:
            print(f"ℹ️  {existing_payments} payment records already exist.")
            response = input("Do you want to add more sample data? (y/n): ")
            if response.lower() != 'y':
                return
        
        sample_payments = []
        
        # Sample payment 1 - Premium subscription
        if len(users) >= 1:
            payment1 = Payment(
                user_id=users[0].id,
                plan_type='premium',
                plan_name='Premium Membership',
                billing_cycle='monthly',
                amount=19.99,
                currency='USD',
                payment_method='card',
                card_last_four='1234',
                card_type='visa',
                card_holder_name='John Doe',
                transaction_id='TXN_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '_001',
                payment_status='completed',
                payment_gateway='stripe',
                gateway_transaction_id='pi_1234567890abcdef',
                billing_address_line1='123 Main Street',
                billing_city='New York',
                billing_state='NY',
                billing_postal_code='10001',
                billing_country='US',
                subscription_start_date=datetime.utcnow(),
                subscription_end_date=datetime.utcnow() + timedelta(days=30),
                next_billing_date=datetime.utcnow() + timedelta(days=30),
                auto_renew=True,
                created_at=datetime.utcnow(),
                processed_at=datetime.utcnow(),
                ip_address='192.168.1.100',
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                notes='First premium subscription'
            )
            sample_payments.append(payment1)
        
        # Sample payment 2 - VIP subscription
        if len(users) >= 2:
            payment2 = Payment(
                user_id=users[1].id if len(users) > 1 else users[0].id,
                plan_type='vip',
                plan_name='VIP Membership',
                billing_cycle='annual',
                amount=299.99,
                currency='USD',
                payment_method='paypal',
                transaction_id='TXN_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '_002',
                payment_status='completed',
                payment_gateway='paypal',
                gateway_transaction_id='PAYID-123456789',
                billing_address_line1='456 Oak Avenue',
                billing_city='Los Angeles',
                billing_state='CA',
                billing_postal_code='90210',
                billing_country='US',
                subscription_start_date=datetime.utcnow(),
                subscription_end_date=datetime.utcnow() + timedelta(days=365),
                next_billing_date=datetime.utcnow() + timedelta(days=365),
                auto_renew=True,
                created_at=datetime.utcnow() - timedelta(days=5),
                processed_at=datetime.utcnow() - timedelta(days=5),
                ip_address='10.0.0.50',
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
                notes='Annual VIP subscription with discount'
            )
            sample_payments.append(payment2)
        
        # Sample payment 3 - Failed payment
        if len(users) >= 1:
            payment3 = Payment(
                user_id=users[0].id,
                plan_type='premium',
                plan_name='Premium Membership',
                billing_cycle='monthly',
                amount=19.99,
                currency='USD',
                payment_method='card',
                card_last_four='9999',
                card_type='mastercard',
                card_holder_name='Jane Smith',
                transaction_id='TXN_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '_003',
                payment_status='failed',
                payment_gateway='stripe',
                billing_address_line1='789 Pine Street',
                billing_city='Chicago',
                billing_state='IL',
                billing_postal_code='60601',
                billing_country='US',
                created_at=datetime.utcnow() - timedelta(days=2),
                ip_address='172.16.0.25',
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                notes='Payment failed - insufficient funds'
            )
            sample_payments.append(payment3)
        
        # Sample payment 4 - Apple Pay
        if len(users) >= 3:
            payment4 = Payment(
                user_id=users[2].id if len(users) > 2 else users[0].id,
                plan_type='premium',
                plan_name='Premium Membership',
                billing_cycle='monthly',
                amount=19.99,
                currency='USD',
                payment_method='applepay',
                transaction_id='TXN_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '_004',
                payment_status='completed',
                payment_gateway='stripe',
                gateway_transaction_id='pi_applepay_1234567890',
                billing_city='San Francisco',
                billing_state='CA',
                billing_postal_code='94105',
                billing_country='US',
                subscription_start_date=datetime.utcnow() - timedelta(days=10),
                subscription_end_date=datetime.utcnow() + timedelta(days=20),
                next_billing_date=datetime.utcnow() + timedelta(days=20),
                auto_renew=True,
                created_at=datetime.utcnow() - timedelta(days=10),
                processed_at=datetime.utcnow() - timedelta(days=10),
                ip_address='203.0.113.45',
                user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
                notes='Mobile payment via Apple Pay'
            )
            sample_payments.append(payment4)
        
        # Add all payments to database
        try:
            for payment in sample_payments:
                db.session.add(payment)
            
            db.session.commit()
            
            print(f"✅ Successfully added {len(sample_payments)} sample payment records!")
            print("\nSample payments created:")
            for payment in sample_payments:
                print(f"  • {payment.transaction_id}: {payment.plan_name} - ${payment.amount} ({payment.payment_status})")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error adding sample payments: {e}")

if __name__ == "__main__":
    print("🚀 Adding sample payment data...")
    add_sample_payment_data()