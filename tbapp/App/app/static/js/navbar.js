// Navbar functionality
class NavbarManager {
    static init() {
        this.setupMobileMenu();
        this.setupUserMenu();
        this.setupNotifications();
        this.setupScrollEffects();
    }

    static setupMobileMenu() {
        const toggle = document.getElementById('navbar-toggle');
        const menu = document.getElementById('navbar-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                }
            });

            // Close menu when clicking on a link
            const navLinks = menu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                });
            });
        }
    }

    static setupUserMenu() {
        const userAvatar = document.getElementById('user-avatar');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userAvatar && userDropdown) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }
    }

    static setupNotifications() {
        const notificationBtn = document.getElementById('notification-btn');
        const notificationDropdown = document.getElementById('notification-dropdown');
        const markAllRead = document.getElementById('mark-all-read');
        const messageBadge = document.getElementById('message-badge');
        
        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                    notificationDropdown.classList.remove('active');
      }
    });
  }
  
        if (markAllRead) {
            markAllRead.addEventListener('click', () => {
                this.markAllNotificationsAsRead();
            });
        }

        // Initialize message badge visibility
        if (messageBadge) {
            const count = parseInt(messageBadge.textContent) || 0;
            messageBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }



    static setupScrollEffects() {
        const navbar = document.getElementById('navbar');
        
        if (navbar) {
            let lastScrollY = window.scrollY;
            
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }

                // Hide/show navbar on scroll
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    navbar.classList.add('hidden');
                } else {
                    navbar.classList.remove('hidden');
                }

                lastScrollY = currentScrollY;
            });
        }
    }



    static markAllNotificationsAsRead() {
        const notificationItems = document.querySelectorAll('.notification-item.unread');
        const notificationBadge = document.getElementById('notification-badge');
        
        notificationItems.forEach(item => {
            item.classList.remove('unread');
        });

        if (notificationBadge) {
            notificationBadge.textContent = '0';
            notificationBadge.style.display = 'none';
        }
    }

    static addNotification(message, type = 'info') {
        const notificationList = document.getElementById('notification-list');
        const notificationBadge = document.getElementById('notification-badge');
        
        if (notificationList) {
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item unread';
            
            const iconClass = this.getNotificationIcon(type);
            
            notificationItem.innerHTML = `
                <div class="notification-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <p>${message}</p>
                    <span class="notification-time">Just now</span>
                </div>
            `;
            
            notificationList.insertBefore(notificationItem, notificationList.firstChild);
        }

        if (notificationBadge) {
            const currentCount = parseInt(notificationBadge.textContent) || 0;
            notificationBadge.textContent = currentCount + 1;
            notificationBadge.style.display = 'block';
            this.pulse(notificationBadge);
        }
    }

    static getNotificationIcon(type) {
        const icons = {
            'like': 'fas fa-heart',
            'message': 'fas fa-comment',
            'match': 'fas fa-star',
            'info': 'fas fa-info-circle',
            'warning': 'fas fa-exclamation-triangle',
            'success': 'fas fa-check-circle'
        };
        
        return icons[type] || icons['info'];
    }

    // Message badge helpers
    static incrementMessageBadge(incrementBy = 1) {
        const badge = document.getElementById('message-badge');
        if (!badge) return;
        const current = parseInt(badge.textContent) || 0;
        const next = current + incrementBy;
        badge.textContent = next > 99 ? '99+' : next;
        badge.style.display = 'flex';
        this.pulse(badge);
    }

    static setMessageBadge(value) {
        const badge = document.getElementById('message-badge');
        if (!badge) return;
        const val = Math.max(0, parseInt(value) || 0);
        badge.textContent = val > 99 ? '99+' : val;
        badge.style.display = val > 0 ? 'flex' : 'none';
        if (val > 0) this.pulse(badge);
    }

    static pulse(element) {
        if (!element) return;
        element.classList.remove('pulse');
        // force reflow to restart animation
        // eslint-disable-next-line no-unused-expressions
        element.offsetWidth;
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 600);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    NavbarManager.init();
});

// Export for global access
window.NavbarManager = NavbarManager;