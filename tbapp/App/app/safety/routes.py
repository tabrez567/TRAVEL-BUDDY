from flask import Blueprint, render_template, jsonify, request, flash, redirect, url_for
from flask_login import login_required, current_user
from datetime import datetime
from extensions import db
from models import SafetyReport, UserBlock, LocationCheck, User

# Blueprint configuration
safety_bp = Blueprint('safety', __name__, url_prefix='/safety', template_folder='templates')

@safety_bp.route('/privacy')
@login_required
def privacy():
    """Privacy settings page"""
    return render_template('safety/privacy.html')

@safety_bp.route('/block')
@login_required
def block():
    """Block users page"""
    return render_template('safety/block.html')

@safety_bp.route('/safemode')
@login_required
def safemode():
    """Safe mode settings page"""
    return render_template('safety/safemode.html')

@safety_bp.route('/location-check')
@login_required
def location_check():
    """Location check-in page for safety"""
    return render_template('safety/location_check.html')

@safety_bp.route('/emergency')
@login_required
def emergency():
    """Emergency contact and safety information"""
    return render_template('safety/emergency.html')

@safety_bp.route('/report', methods=['GET', 'POST'])
@login_required
def report():
    """Report safety concerns or inappropriate behavior"""
    if request.method == 'POST':
        try:
            report = SafetyReport(
                reporter_id=current_user.id,
                reported_user_id=request.form.get('reported_user_id', type=int) if request.form.get('reported_user_id') else None,
                report_type=request.form['report_type'],
                description=request.form['description'],
                severity=request.form.get('severity', 'medium')
            )
            
            db.session.add(report)
            db.session.commit()
            
            flash('Safety report submitted successfully. We will review it within 24 hours.', 'success')
            return redirect(url_for('safety.privacy'))
            
        except Exception as e:
            flash(f'Error submitting report: {str(e)}', 'error')
            db.session.rollback()
    
    return render_template('safety/report.html')

@safety_bp.route('/check-in', methods=['POST'])
@login_required
def check_in():
    """Location check-in for safety tracking"""
    try:
        data = request.get_json()
        check_in = LocationCheck(
            user_id=current_user.id,
            latitude=data['latitude'],
            longitude=data['longitude'],
            location_name=data.get('location_name', ''),
            check_type=data.get('check_type', 'manual'),
            is_safe=data.get('is_safe', True),
            notes=data.get('notes', '')
        )
        
        db.session.add(check_in)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Check-in recorded'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@safety_bp.route('/block-user', methods=['POST'])
@login_required
def block_user():
    """Block a user for safety reasons"""
    try:
        data = request.get_json()
        user_to_block_id = data['user_id']
        reason = data.get('reason', '')
        
        # Check if already blocked
        existing_block = UserBlock.query.filter_by(
            blocker_id=current_user.id,
            blocked_user_id=user_to_block_id
        ).first()
        
        if existing_block:
            return jsonify({'status': 'error', 'message': 'User already blocked'}), 400
        
        block = UserBlock(
            blocker_id=current_user.id,
            blocked_user_id=user_to_block_id,
            reason=reason
        )
        
        db.session.add(block)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'User blocked successfully'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@safety_bp.route('/unblock-user', methods=['POST'])
@login_required
def unblock_user():
    """Unblock a user"""
    try:
        data = request.get_json()
        user_to_unblock_id = data['user_id']
        
        block = UserBlock.query.filter_by(
            blocker_id=current_user.id,
            blocked_user_id=user_to_unblock_id
        ).first()
        
        if not block:
            return jsonify({'status': 'error', 'message': 'User not blocked'}), 400
        
        db.session.delete(block)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'User unblocked'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@safety_bp.route('/api/blocked-users')
@login_required
def get_blocked_users():
    """API endpoint to get blocked users"""
    blocked_users = [
        {
            'id': 101,
            'name': 'John Doe',
            'avatar': '/static/img/avatars/5.jpg',
            'blocked_date': '2023-06-15',
            'reason': 'Inappropriate behavior'
        },
        {
            'id': 102,
            'name': 'Jane Smith',
            'avatar': '/static/img/avatars/6.jpg',
            'blocked_date': '2023-07-01',
            'reason': 'Spam messages'
        }
    ]
    
    return jsonify(blocked_users)

# Removed duplicate functions - using the enhanced versions above