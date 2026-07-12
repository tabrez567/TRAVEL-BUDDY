// Footer functionality
class FooterManager {
    static init() {
        this.setupNewsletterForm();
        this.setupBackToTop();
        this.setupSocialLinks();
        this.setupAnimations();
        this.setupStatsCounter();
    }

    static setupNewsletterForm() {
        const form = document.getElementById('newsletter-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('.newsletter-input').value;
            const messageDiv = document.getElementById('newsletter-message');
            const submitBtn = form.querySelector('.newsletter-btn');
            
            if (!this.isValidEmail(email)) {
                this.showNewsletterMessage(messageDiv, 'Please enter a valid email address', 'error');
                return;
            }

            // Show loading state
            this.setButtonLoading(submitBtn, true);
            
            try {
                // Simulate API call
                await this.subscribeToNewsletter(email);
                this.showNewsletterMessage(messageDiv, 'Successfully subscribed! Thank you for joining us.', 'success');
                form.reset();
            } catch (error) {
                this.showNewsletterMessage(messageDiv, 'Something went wrong. Please try again later.', 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        });

        // Real-time email validation
        const emailInput = form.querySelector('.newsletter-input');
        emailInput.addEventListener('input', () => {
            const messageDiv = document.getElementById('newsletter-message');
            if (messageDiv.classList.contains('error')) {
                messageDiv.style.display = 'none';
            }
        });
    }

    static async subscribeToNewsletter(email) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, you would make an actual API call here
        // const response = await fetch('/api/newsletter/subscribe', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email })
        // });
        
        // For demo purposes, simulate success
        return { success: true };
    }

    static showNewsletterMessage(messageDiv, message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `newsletter-message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    static setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static setupBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;

        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        // Smooth scroll to top
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    static setupSocialLinks() {
        const socialLinks = document.querySelectorAll('.social-link');
        
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Add click animation
                link.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    link.style.transform = '';
                }, 150);
            });

            // Add hover effects
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-3px) scale(1.1)';
            });

            link.addEventListener('mouseleave', () => {
                link.style.transform = '';
            });
        });
    }

    static setupAnimations() {
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

        // Observe footer elements
        const animatedElements = document.querySelectorAll('.footer-column, .stat-item, .badge');
        animatedElements.forEach(el => {
            observer.observe(el);
        });

        // Stagger animation for footer columns
        const footerColumns = document.querySelectorAll('.footer-column');
        footerColumns.forEach((column, index) => {
            column.style.animationDelay = `${index * 0.1}s`;
        });

        // Stagger animation for stats
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.2}s`;
        });
    }

    static setupStatsCounter() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const animateNumber = (element, targetValue) => {
            const startValue = 0;
            const duration = 2000;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOutCubic = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutCubic);
                
                element.textContent = this.formatNumber(currentValue);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        };

        // Intersection Observer for stats
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumber = entry.target.querySelector('.stat-number');
                    const value = this.parseStatValue(statNumber.textContent);
                    animateNumber(statNumber, value);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            statsObserver.observe(item);
        });
    }

    static parseStatValue(text) {
        // Parse values like "2M+", "50K+", "190+", "4.8★"
        const match = text.match(/(\d+(?:\.\d+)?)([MK]?)\+?/);
        if (!match) return 0;
        
        const number = parseFloat(match[1]);
        const suffix = match[2];
        
        switch (suffix) {
            case 'M': return number * 1000000;
            case 'K': return number * 1000;
            default: return number;
        }
    }

    static formatNumber(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M+';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'K+';
        } else {
            return value + '+';
        }
    }

    static setupDownloadButtons() {
        const downloadBtns = document.querySelectorAll('.download-btn');
        
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add click animation
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
                
                // Show coming soon message
                this.showToast('Mobile app coming soon! Stay tuned for updates.', 'info');
            });
        });
    }

    static showToast(message, type = 'info') {
        // Use the notification system if available
        if (window.toast) {
            window.toast[type](message);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    static setupFooterLinks() {
        const footerLinks = document.querySelectorAll('.footer-link');
        
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Add click animation
                link.style.transform = 'translateX(5px)';
                setTimeout(() => {
                    link.style.transform = '';
                }, 200);
            });
        });
    }

    static setupResponsiveHandling() {
        // Handle mobile menu toggle if needed
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            
            // Adjust footer layout for mobile
            if (isMobile) {
                document.body.classList.add('mobile-footer');
            } else {
                document.body.classList.remove('mobile-footer');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }

    static setupAccessibility() {
        // Keyboard navigation for social links
        const socialLinks = document.querySelectorAll('.social-link');
        
        socialLinks.forEach(link => {
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });
        });

        // Focus management for newsletter form
        const newsletterInput = document.querySelector('.newsletter-input');
        if (newsletterInput) {
            newsletterInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('newsletter-form').dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    static setupAnalytics() {
        // Track footer interactions
        const trackEvent = (eventName, properties = {}) => {
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, properties);
            }
        };

        // Track newsletter signups
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', () => {
                trackEvent('newsletter_signup', {
                    'event_category': 'footer',
                    'event_label': 'newsletter'
                });
            });
        }

        // Track social link clicks
        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', () => {
                const platform = link.getAttribute('aria-label').toLowerCase();
                trackEvent('social_click', {
                    'event_category': 'footer',
                    'event_label': platform
                });
            });
        });

        // Track download button clicks
        const downloadBtns = document.querySelectorAll('.download-btn');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.classList.contains('app-store') ? 'app_store' : 'google_play';
                trackEvent('download_click', {
                    'event_category': 'footer',
                    'event_label': platform
                });
            });
        });
    }
}

// CSS for animations
const footerStyles = document.createElement('style');
footerStyles.textContent = `
    .footer-column,
    .stat-item,
    .badge {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease-out;
    }

    .footer-column.animate-in,
    .stat-item.animate-in,
    .badge.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .mobile-footer .footer-content {
        grid-template-columns: 1fr;
    }

    .mobile-footer .footer-links {
        grid-template-columns: repeat(2, 1fr);
    }

    .mobile-footer .footer-bottom-content {
        flex-direction: column;
        text-align: center;
    }

    .mobile-footer .footer-bottom-right {
        align-items: center;
    }

    .mobile-footer .download-buttons {
        flex-direction: column;
        align-items: center;
    }

    .mobile-footer .download-btn {
        width: 100%;
        max-width: 200px;
    }

    .mobile-footer .footer-badges {
        justify-content: center;
    }

    .mobile-footer .social-links {
        justify-content: center;
    }

    .mobile-footer .newsletter-input-group {
        flex-direction: column;
    }

    .mobile-footer .newsletter-btn {
        justify-content: center;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .footer-column,
        .stat-item,
        .badge {
            opacity: 1;
            transform: none;
            transition: none;
        }
    }
`;
document.head.appendChild(footerStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    FooterManager.init();
    FooterManager.setupDownloadButtons();
    FooterManager.setupFooterLinks();
    FooterManager.setupResponsiveHandling();
    FooterManager.setupAccessibility();
    FooterManager.setupAnalytics();
});

// Export for global access
window.FooterManager = FooterManager;
