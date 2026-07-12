// Enhanced Notification System
class NotificationSystem {
    constructor() {
        this.notificationBtn = document.getElementById('notification-btn');
        this.notificationDropdown = document.getElementById('notification-dropdown');
        this.notificationBadge = document.getElementById('notification-badge');
        this.notificationList = document.getElementById('notification-list');
        this.markAllReadBtn = document.getElementById('mark-all-read');
        this.bellIcon = document.querySelector('.bell-icon');
        
        this.notifications = [];
        this.unreadCount = 0;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNotifications();
        this.startPolling();
    }

    setupEventListeners() {
        // Toggle dropdown
        this.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Mark all as read
        if (this.markAllReadBtn) {
            this.markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.notificationBtn.contains(e.target) && 
                !this.notificationDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Handle notification clicks
        this.notificationList.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                this.handleNotificationClick(notificationItem);
            }
        });
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.notificationDropdown.classList.add('active');
        this.isOpen = true;
        this.loadNotifications();
    }

    closeDropdown() {
        this.notificationDropdown.classList.remove('active');
        this.isOpen = false;
    }

    async loadNotifications() {
        try {
            const response = await fetch('/notifications/api/list');
            const notifications = await response.json();
            this.notifications = notifications;
            this.updateNotificationList();
            this.updateBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateNotificationList() {
        if (!this.notificationList) return;

        this.notificationList.innerHTML = '';

        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        this.notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            this.notificationList.appendChild(notificationElement);
        });
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${!notification.is_read ? 'unread' : ''}`;
        div.dataset.notificationId = notification.id;

        const iconClass = this.getNotificationIcon(notification.type);
        const timeAgo = this.getTimeAgo(notification.timestamp);

        div.innerHTML = `
            <div class="notification-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
                <span class="notification-time">${timeAgo}</span>
            </div>
        `;

        return div;
    }

    getNotificationIcon(type) {
        const icons = {
            'like': 'fas fa-heart',
            'message': 'fas fa-comment',
            'match': 'fas fa-star',
            'superlike': 'fas fa-star',
            'profile': 'fas fa-user',
            'trip': 'fas fa-plane',
            'safety': 'fas fa-shield-alt'
        };
        return icons[type] || 'fas fa-bell';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    updateBadge() {
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        
        if (this.unreadCount > 0) {
            this.notificationBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.notificationBadge.style.display = 'flex';
            this.addBadgePulse();
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }

    addBadgePulse() {
        this.notificationBadge.classList.add('pulse');
        setTimeout(() => {
            this.notificationBadge.classList.remove('pulse');
        }, 600);
    }

    addBellShake() {
        this.bellIcon.classList.add('shake');
        setTimeout(() => {
            this.bellIcon.classList.remove('shake');
        }, 500);
    }

    handleNotificationClick(notificationElement) {
        const notificationId = notificationElement.dataset.notificationId;
        const notification = this.notifications.find(n => n.id == notificationId);
        
        if (notification && !notification.is_read) {
            this.markAsRead(notificationId);
        }

        // Handle navigation based on notification type
        this.navigateToNotification(notification);
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/notifications/api/mark-read/${notificationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const notification = this.notifications.find(n => n.id == notificationId);
                if (notification) {
                    notification.is_read = true;
                    this.updateNotificationList();
                    this.updateBadge();
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/notifications/api/mark-all-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.notifications.forEach(notification => {
                    notification.is_read = true;
                });
                this.updateNotificationList();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    navigateToNotification(notification) {
        const routes = {
            'like': '/profile',
            'message': '/chat',
            'match': '/match',
            'superlike': '/match',
            'trip': '/trips',
            'safety': '/safety'
        };

        const route = routes[notification.type] || '/dashboard';
        window.location.href = route;
    }

    // Simulate new notification (for demo purposes)
    addNewNotification(type, message) {
        const newNotification = {
            id: Date.now(),
            type: type,
            message: message,
            timestamp: new Date().toISOString(),
            is_read: false
        };

        this.notifications.unshift(newNotification);
        this.updateNotificationList();
        this.updateBadge();
        this.addBellShake();
        this.addBadgePulse();
    }

    startPolling() {
        // Poll for new notifications every 30 seconds
        setInterval(() => {
            if (!this.isOpen) {
                this.loadNotifications();
            }
        }, 30000);
    }

    // Public methods for external use
    showNotification(type, message) {
        this.addNewNotification(type, message);
    }

    getUnreadCount() {
        return this.unreadCount;
    }
}

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.notificationSystem = new NotificationSystem();
});

// Demo notifications (remove in production)
document.addEventListener('DOMContentLoaded', function() {
    // Add demo notifications after 3 seconds
    setTimeout(() => {
        if (window.notificationSystem) {
            window.notificationSystem.addNewNotification('like', 'Sarah liked your profile');
        }
    }, 3000);

    setTimeout(() => {
        if (window.notificationSystem) {
            window.notificationSystem.addNewNotification('message', 'Mike sent you a message');
        }
    }, 6000);
});

// Export for global access
window.NotificationSystem = NotificationSystem;