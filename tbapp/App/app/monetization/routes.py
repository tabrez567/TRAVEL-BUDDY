from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from datetime import datetime, timedelta

# Blueprint configuration
monetization_bp = Blueprint('monetization', __name__, url_prefix='/monetization', template_folder='templates')

@monetization_bp.route('/plans')
@login_required
def plans():
    """Subscription plans page"""
    return render_template('monetization/plans.html')

@monetization_bp.route('/credits')
@login_required
def credits():
    """Credits page"""
    return render_template('monetization/credits.html')

@monetization_bp.route('/payment')
@login_required
def payment():
    """Payment page"""
    now = datetime.now()
    return render_template('monetization/payment.html', now=now, timedelta=timedelta)

@monetization_bp.route('/payment/success')
@login_required
def payment_success():
    """Payment success page"""
    now = datetime.now()
    return render_template('monetization/payment_success.html', now=now, timedelta=timedelta)

@monetization_bp.route('/api/plans')
def get_plans():
    """API endpoint to get subscription plans"""
    plans = [
        {
            'id': 'basic',
            'name': 'Basic',
            'price': 0,
            'period': 'month',
            'features': [
                'Basic matching',
                'Limited messages (50/day)',
                'Standard profile visibility',
                'Basic filters'
            ],
            'recommended': False
        },
        {
            'id': 'premium',
            'name': 'Premium',
            'price': 19.99,
            'period': 'month',
            'features': [
                'Unlimited matching',
                'Unlimited messages',
                'Priority profile visibility',
                'Advanced filters',
                'See who liked you',
                'Read receipts'
            ],
            'recommended': True
        },
        {
            'id': 'vip',
            'name': 'VIP',
            'price': 29.99,
            'period': 'month',
            'features': [
                'Everything in Premium',
                'Profile boosting',
                'Exclusive VIP badge',
                'Priority customer support',
                'Monthly profile review',
                'Advanced analytics'
            ],
            'recommended': False
        }
    ]
    
    return jsonify(plans)