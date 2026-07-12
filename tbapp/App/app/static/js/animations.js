// Animation utilities and effects
class AnimationManager {
    static init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
    }

    static setupScrollAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    static setupHoverEffects() {
        // Add hover effects to cards and buttons
        document.querySelectorAll('.card, .btn, .stat-card').forEach(element => {
            element.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.transition = 'transform 0.3s ease';
            });

            element.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    static setupLoadingAnimations() {
        // Loading spinner animation
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.animation = 'spin 1s linear infinite';
        }
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = performance.now();
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        let start = performance.now();
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = 1 - progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }

    static slideIn(element, direction = 'up', duration = 300) {
        const directions = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        };

        element.style.transform = directions[direction];
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = performance.now();
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = Math.min(elapsed / duration, 1);
            
            element.style.transform = `translate(0, 0)`;
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    static pulse(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    static shake(element, intensity = 5) {
        const originalTransform = element.style.transform;
        let start = performance.now();
        const duration = 500;
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                const shakeX = (Math.random() - 0.5) * intensity * (1 - progress);
                const shakeY = (Math.random() - 0.5) * intensity * (1 - progress);
                element.style.transform = `${originalTransform} translate(${shakeX}px, ${shakeY}px)`;
                requestAnimationFrame(animate);
            } else {
                element.style.transform = originalTransform;
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideInUp {
        from { 
            opacity: 0;
            transform: translateY(20px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInDown {
        from { 
            opacity: 0;
            transform: translateY(-20px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInLeft {
        from { 
            opacity: 0;
            transform: translateX(-20px);
        }
        to { 
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideInRight {
        from { 
            opacity: 0;
            transform: translateX(20px);
        }
        to { 
            opacity: 1;
            transform: translateX(0);
        }
    }

    .animate-in {
        animation: fadeIn 0.6s ease-out;
    }

    .animate-slide-up {
        animation: slideInUp 0.6s ease-out;
    }

    .animate-slide-down {
        animation: slideInDown 0.6s ease-out;
    }

    .animate-slide-left {
        animation: slideInLeft 0.6s ease-out;
    }

    .animate-slide-right {
        animation: slideInRight 0.6s ease-out;
    }

    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AnimationManager.init();
});

// Export for use in other modules
window.AnimationManager = AnimationManager;
