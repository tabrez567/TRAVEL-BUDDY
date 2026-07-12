// Notification System
class NotificationManager {
    static init() {
        this.container = this.createContainer();
        this.toastContainer = this.createToastContainer();
        this.setupEventListeners();
    }

    static createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    static createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    static setupEventListeners() {
        // Listen for custom notification events
        document.addEventListener('showNotification', (e) => {
            this.show(e.detail);
        });

        document.addEventListener('showToast', (e) => {
            this.showToast(e.detail);
        });
    }

    static show(options) {
        const notification = this.createNotification(options);
        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove
        if (options.duration !== false) {
            const duration = options.duration || 5000;
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        return notification;
    }

    static showToast(options) {
        const toast = this.createToast(options);
        this.toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove
        if (options.duration !== false) {
            const duration = options.duration || 3000;
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        }

        return toast;
    }

    static createNotification(options) {
        const notification = document.createElement('div');
        notification.className = `notification ${options.type || 'info'}`;

        const icon = this.getIcon(options.type, options.icon);
        const actions = options.actions || [];

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <h4 class="notification-title">${options.title || ''}</h4>
                <p class="notification-message">${options.message || ''}</p>
                ${actions.length > 0 ? `
                    <div class="notification-actions">
                        ${actions.map(action => `
                            <button class="notification-btn ${action.primary ? 'primary' : ''}" 
                                    data-action="${action.action}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <button class="notification-close">&times;</button>
            ${options.duration !== false ? '<div class="notification-progress"></div>' : ''}
        `;

        // Add event listeners
        this.setupNotificationListeners(notification, options);

        return notification;
    }

    static createToast(options) {
        const toast = document.createElement('div');
        toast.className = `toast ${options.type || 'info'}`;

        const icon = this.getIcon(options.type, options.icon);

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-message">${options.message || ''}</div>
            <button class="toast-close">&times;</button>
        `;

        // Add event listeners
        this.setupToastListeners(toast, options);

        return toast;
    }

    static setupNotificationListeners(notification, options) {
        const closeBtn = notification.querySelector('.notification-close');
        const actionBtns = notification.querySelectorAll('.notification-btn');

        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });

        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (options.onAction) {
                    options.onAction(action);
                }
                this.hide(notification);
            });
        });

        // Progress bar animation
        const progress = notification.querySelector('.notification-progress');
        if (progress && options.duration !== false) {
            const duration = options.duration || 5000;
            progress.style.transition = `width ${duration}ms linear`;
            progress.style.width = '100%';
        }
    }

    static setupToastListeners(toast, options) {
        const closeBtn = toast.querySelector('.toast-close');

        closeBtn.addEventListener('click', () => {
            this.hideToast(toast);
        });
    }

    static hide(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    static hideToast(toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    static getIcon(type, customIcon) {
        if (customIcon) return customIcon;

        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle',
            'match': 'fas fa-heart',
            'message': 'fas fa-comment',
            'like': 'fas fa-heart',
            'superlike': 'fas fa-star',
            'profile': 'fas fa-user',
            'settings': 'fas fa-cog'
        };

        return icons[type] || icons['info'];
    }

    // Convenience methods
    static success(title, message, options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    static error(title, message, options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            ...options
        });
    }

    static warning(title, message, options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    static info(title, message, options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    static match(userName, message, options = {}) {
        return this.show({
            type: 'match',
            title: `It's a Match!`,
            message: `You and ${userName} liked each other! ${message || 'Start chatting now.'}`,
            duration: 8000,
            actions: [
                {
                    label: 'Send Message',
                    action: 'message',
                    primary: true
                },
                {
                    label: 'Keep Swiping',
                    action: 'continue'
                }
            ],
            ...options
        });
    }

    static newMessage(senderName, preview, options = {}) {
        return this.show({
            type: 'message',
            title: `New message from ${senderName}`,
            message: preview,
            duration: 5000,
            actions: [
                {
                    label: 'Reply',
                    action: 'reply',
                    primary: true
                },
                {
                    label: 'View Chat',
                    action: 'view'
                }
            ],
            ...options
        });
    }

    static profileLiked(likerName, options = {}) {
        return this.show({
            type: 'like',
            title: 'Someone liked you!',
            message: `${likerName} liked your profile`,
            duration: 5000,
            actions: [
                {
                    label: 'View Profile',
                    action: 'view',
                    primary: true
                },
                {
                    label: 'Like Back',
                    action: 'like'
                }
            ],
            ...options
        });
    }

    static superLiked(superLikerName, options = {}) {
        return this.show({
            type: 'superlike',
            title: 'Super Liked!',
            message: `${superLikerName} super liked you!`,
            duration: 6000,
            actions: [
                {
                    label: 'View Profile',
                    action: 'view',
                    primary: true
                },
                {
                    label: 'Super Like Back',
                    action: 'superlike'
                }
            ],
            ...options
        });
    }

    // Toast convenience methods
    static toastSuccess(message, options = {}) {
        return this.showToast({
            type: 'success',
            message,
            ...options
        });
    }

    static toastError(message, options = {}) {
        return this.showToast({
            type: 'error',
            message,
            ...options
        });
    }

    static toastWarning(message, options = {}) {
        return this.showToast({
            type: 'warning',
            message,
            ...options
        });
    }

    static toastInfo(message, options = {}) {
        return this.showToast({
            type: 'info',
            message,
            ...options
        });
    }

    // Clear all notifications
    static clearAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.hide(notification);
        });

        const toasts = this.toastContainer.querySelectorAll('.toast');
        toasts.forEach(toast => {
            this.hideToast(toast);
        });
    }

    // Get notification count
    static getCount() {
        return this.container.querySelectorAll('.notification').length;
    }

    // Check if notifications are enabled
    static isEnabled() {
        return localStorage.getItem('notificationsEnabled') !== 'false';
    }

    // Enable/disable notifications
    static setEnabled(enabled) {
        localStorage.setItem('notificationsEnabled', enabled);
    }

    // Request notification permission
    static async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    // Show browser notification
    static showBrowserNotification(title, options = {}) {
        if (!this.isEnabled() || !('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/static/img/logo.png',
                badge: '/static/img/logo.png',
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    NotificationManager.init();
});

// Export for global access
window.NotificationManager = NotificationManager;

// Make it available globally for easy access
window.notify = NotificationManager;
window.toast = {
    success: NotificationManager.toastSuccess.bind(NotificationManager),
    error: NotificationManager.toastError.bind(NotificationManager),
    warning: NotificationManager.toastWarning.bind(NotificationManager),
    info: NotificationManager.toastInfo.bind(NotificationManager)
};
