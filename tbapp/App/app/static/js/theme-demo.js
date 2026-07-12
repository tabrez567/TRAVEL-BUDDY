// Theme Demo JavaScript
class ThemeDemo {
    static init() {
        this.setupColorSwatches();
        this.setupKeyboardShortcuts();
        this.setupThemePreview();
        this.setupAnimations();
        this.setupAccessibility();
    }

    static setupColorSwatches() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.copyColorValue(swatch);
                this.showColorCopied(swatch);
            });
        });
    }

    static copyColorValue(swatch) {
        const colorValue = swatch.querySelector('.color-value').textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(colorValue).then(() => {
                console.log('Color value copied to clipboard:', colorValue);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = colorValue;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    static showColorCopied(swatch) {
        const originalContent = swatch.innerHTML;
        swatch.innerHTML = `
            <i class="fas fa-check"></i>
            <span>Copied!</span>
        `;
        
        setTimeout(() => {
            swatch.innerHTML = originalContent;
        }, 1500);
    }

    static setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 1 = Light mode
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                ThemeManager.setTheme('light');
                this.showShortcutFeedback('Light mode activated');
            }
            
            // Ctrl/Cmd + 2 = Dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === '2') {
                e.preventDefault();
                ThemeManager.setTheme('dark');
                this.showShortcutFeedback('Dark mode activated');
            }
            
            // Ctrl/Cmd + 3 = Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === '3') {
                e.preventDefault();
                ThemeManager.toggleTheme();
                this.showShortcutFeedback('Theme toggled');
            }
        });
    }

    static showShortcutFeedback(message) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: var(--spacing-sm) var(--spacing-md);
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 2000);
    }

    static setupThemePreview() {
        // Create theme preview overlay
        const preview = document.createElement('div');
        preview.id = 'theme-preview';
        preview.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        
        preview.innerHTML = `
            <div class="preview-content" style="
                background: var(--bg-primary);
                color: var(--text-primary);
                padding: var(--spacing-xl);
                border-radius: var(--radius-lg);
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: var(--shadow-xl);
            ">
                <h3 style="margin-bottom: var(--spacing-md);">Theme Preview</h3>
                <p style="margin-bottom: var(--spacing-lg); color: var(--text-secondary);">
                    This is how your app will look in the selected theme.
                </p>
                <div style="display: flex; gap: var(--spacing-md); justify-content: center;">
                    <button class="btn primary" onclick="ThemeDemo.hidePreview()">
                        Close Preview
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(preview);
    }

    static showPreview() {
        const preview = document.getElementById('theme-preview');
        if (preview) {
            preview.style.opacity = '1';
            preview.style.visibility = 'visible';
        }
    }

    static hidePreview() {
        const preview = document.getElementById('theme-preview');
        if (preview) {
            preview.style.opacity = '0';
            preview.style.visibility = 'hidden';
        }
    }

    static setupAnimations() {
        // Animate elements on scroll
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

        // Observe demo sections
        const sections = document.querySelectorAll('.demo-section');
        sections.forEach(section => {
            observer.observe(section);
        });

        // Stagger animation for feature items
        const featureItems = document.querySelectorAll('.feature-item');
        featureItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });

        // Stagger animation for color swatches
        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach((swatch, index) => {
            swatch.style.animationDelay = `${index * 0.05}s`;
        });
    }

    static setupAccessibility() {
        // Add ARIA labels to interactive elements
        const demoBtns = document.querySelectorAll('.demo-btn');
        demoBtns.forEach(btn => {
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
        });

        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.setAttribute('role', 'button');
            swatch.setAttribute('tabindex', '0');
            swatch.setAttribute('aria-label', 'Click to copy color value');
        });

        // Keyboard navigation for color swatches
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    swatch.click();
                }
            });
        });

        // Keyboard navigation for demo buttons
        demoBtns.forEach(btn => {
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }

    static setupThemeComparison() {
        // Create side-by-side theme comparison
        const comparison = document.createElement('div');
        comparison.className = 'theme-comparison';
        comparison.innerHTML = `
            <div class="comparison-container">
                <div class="comparison-light">
                    <h4>Light Mode</h4>
                    <div class="comparison-preview light-preview">
                        <!-- Light mode preview content -->
                    </div>
                </div>
                <div class="comparison-dark">
                    <h4>Dark Mode</h4>
                    <div class="comparison-preview dark-preview">
                        <!-- Dark mode preview content -->
                    </div>
                </div>
            </div>
        `;
    }

    static showThemeInfo() {
        const currentTheme = ThemeManager.getCurrentTheme();
        const isSystemTheme = !ThemeManager.getStoredTheme();
        
        const info = `
            Current Theme: ${currentTheme}
            System Theme: ${isSystemTheme ? 'Auto-detected' : 'Manual'}
            Stored Preference: ${ThemeManager.getStoredTheme() || 'None'}
        `;
        
        alert(info);
    }

    static resetTheme() {
        localStorage.removeItem('theme');
        ThemeManager.setTheme('light');
        this.showShortcutFeedback('Theme reset to default');
    }

    static exportTheme() {
        const theme = {
            current: ThemeManager.getCurrentTheme(),
            stored: ThemeManager.getStoredTheme(),
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(theme, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'theme-settings.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// CSS for animations
const demoStyles = document.createElement('style');
demoStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }

    .demo-section {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }

    .demo-section.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .feature-item,
    .color-swatch {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease-out;
    }

    .feature-item.animate-in,
    .color-swatch.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .shortcut-feedback {
        animation: slideInRight 0.3s ease-out;
    }

    .shortcut-feedback.slide-out {
        animation: slideOutRight 0.3s ease-in;
    }

    /* Focus styles for accessibility */
    .demo-btn:focus,
    .color-swatch:focus {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .demo-section,
        .feature-item,
        .color-swatch {
            opacity: 1;
            transform: none;
            transition: none;
        }
    }
`;
document.head.appendChild(demoStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ThemeDemo.init();
});

// Export for global access
window.ThemeDemo = ThemeDemo;
