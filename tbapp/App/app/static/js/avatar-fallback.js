// Avatar Fallback Handler - Creates beautiful gradient avatars with initials

class AvatarFallback {
    constructor() {
        this.colors = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#30cfd0', '#330867'],
            ['#a8edea', '#fed6e3'],
            ['#ff9a9e', '#fecfef'],
            ['#ffecd2', '#fcb69f'],
            ['#ff6e7f', '#bfe9ff']
        ];
        this.init();
    }

    init() {
        // Handle all existing images
        this.handleAllImages();
        
        // Watch for new images added dynamically
        const observer = new MutationObserver(() => {
            this.handleAllImages();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    handleAllImages() {
        const images = document.querySelectorAll('.conversation-avatar img, .message-avatar img, .user-avatar img, .match-avatar img');
        
        images.forEach(img => {
            if (!img.dataset.fallbackHandled) {
                img.dataset.fallbackHandled = 'true';
                
                // Handle error
                img.addEventListener('error', () => {
                    this.createFallbackAvatar(img);
                });
                
                // Check if image is already broken
                if (!img.complete || img.naturalWidth === 0) {
                    this.createFallbackAvatar(img);
                }
            }
        });
    }

    createFallbackAvatar(img) {
        const parent = img.parentElement;
        if (!parent || parent.querySelector('.avatar-fallback')) return;

        // Get name with priority: data-username attribute > h4 text > default
        // Skip img.alt as it's often hardcoded fallback and unreliable
        let name = img.getAttribute('data-username') || 
                   parent.closest('.conversation-item')?.getAttribute('data-username') ||
                   parent.closest('.conversation-item')?.querySelector('h4')?.getAttribute('data-username') ||
                   parent.closest('.conversation-item')?.querySelector('h4')?.textContent ||
                   parent.closest('.match-item')?.querySelector('h4')?.textContent ||
                   '';
        
        // Ensure name is a string and not empty
        name = String(name || '').trim();
        
        // Only render avatar fallback if we have a valid username
        if (!name) return;
        
        const initials = this.getInitials(name);
        const colorPair = this.getColorForName(name);
        
        // Hide the broken image
        img.style.display = 'none';
        
        // Create fallback element
        const fallback = document.createElement('div');
        fallback.className = 'avatar-fallback';
        fallback.textContent = initials;
        fallback.style.cssText = `
            width: ${img.width || 52}px;
            height: ${img.height || 52}px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: ${(img.width || 52) * 0.4}px;
            position: absolute;
            top: 0;
            left: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            z-index: 0;
        `;
        
        // Make parent relative if not already
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        parent.appendChild(fallback);
    }

    getInitials(name) {
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getColorForName(name) {
        // Generate consistent color based on name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % this.colors.length;
        return this.colors[index];
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AvatarFallback();
    });
} else {
    new AvatarFallback();
}
