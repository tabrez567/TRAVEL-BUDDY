from flask import Blueprint, render_template, jsonify
from flask_login import login_required

# Blueprint configuration
notifications_bp = Blueprint('notifications', __name__, url_prefix='/notifications', template_folder='templates')

@notifications_bp.route('/')
@login_required
def notifications():
    """Notifications page"""
    return render_template('notifications/notifications.html')

@notifications_bp.route('/api/list')
@login_required
def get_notifications():
    """API endpoint to get notifications"""
    # Enhanced dummy notifications data with more variety
    notifications = [
        {
            'id': 1,
            'type': 'like',
            'message': 'Sarah liked your profile',
            'timestamp': '2024-01-15T10:30:00',
            'is_read': False,
            'user': {
                'name': 'Sarah',
                'avatar': '/static/img/avatars/2.jpg'
            }
        },
        {
            'id': 2,
            'type': 'message',
            'message': 'Mike sent you a message',
            'timestamp': '2024-01-15T09:15:00',
            'is_read': False,
            'user': {
                'name': 'Mike',
                'avatar': '/static/img/avatars/3.jpg'
            }
        },
        {
            'id': 3,
            'type': 'match',
            'message': 'You matched with Emma',
            'timestamp': '2024-01-14T16:45:00',
            'is_read': True,
            'user': {
                'name': 'Emma',
                'avatar': '/static/img/avatars/1.jpg'
            }
        },
        {
            'id': 4,
            'type': 'superlike',
            'message': 'Alex super liked you',
            'timestamp': '2024-01-14T14:20:00',
            'is_read': True,
            'user': {
                'name': 'Alex',
                'avatar': '/static/img/avatars/4.jpg'
            }
        },
        {
            'id': 5,
            'type': 'trip',
            'message': 'New trip to Paris is available',
            'timestamp': '2024-01-14T12:00:00',
            'is_read': False,
            'user': {
                'name': 'Travel Buddy',
                'avatar': '/static/img/logo.png'
            }
        }
    ]
    
    return jsonify(notifications)

@notifications_bp.route('/api/mark-read/<int:notification_id>', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    # In a real app, you would update the database here
    return jsonify({'success': True, 'message': 'Notification marked as read'})

@notifications_bp.route('/api/mark-all-read', methods=['POST'])
@login_required
def mark_all_notifications_read():
    """Mark all notifications as read"""
    # In a real app, you would update the database here
    return jsonify({'success': True, 'message': 'All notifications marked as read'})

@notifications_bp.route('/api/count')
@login_required
def get_notification_count():
    """Get unread notification count"""
    # In a real app, you would query the database here
    return jsonify({'unread_count': 3})