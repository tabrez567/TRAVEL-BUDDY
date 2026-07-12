// Theme Manager
class ThemeManager {
    static init() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.setTheme(this.currentTheme);
        this.setupEventListeners();
        this.setupSystemThemeDetection();
    }

    static getStoredTheme() {
        return localStorage.getItem('theme');
    }

    static setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    static setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.setStoredTheme(theme);
        this.updateThemeIcon(theme);
        this.updateThemeButton(theme);
        
        // Dispatch theme change event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
    }

    static toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        console.log('Toggling theme from', this.currentTheme, 'to', newTheme);
        this.setTheme(newTheme);
        this.animateThemeTransition();
    }

    static setupEventListeners() {
        // Theme toggle button (navbar)
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            // Add both touch and click events for mobile compatibility
            const handleThemeToggle = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Theme toggle clicked, current theme:', this.currentTheme);
                this.toggleTheme();
                this.animateThemeToggle(themeBtn);
            };
            
            // Mobile touch events
            themeBtn.addEventListener('touchstart', handleThemeToggle, { passive: false });
            themeBtn.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
            
            // Desktop click event
            themeBtn.addEventListener('click', handleThemeToggle);
            
            // Add mobile-specific styles
            themeBtn.style.cursor = 'pointer';
            themeBtn.style.touchAction = 'manipulation';
            themeBtn.style.webkitTouchCallout = 'none';
            themeBtn.style.userSelect = 'none';
        } else {
            console.warn('Theme toggle button not found');
        }

        // Listen for theme changes from other components
        document.addEventListener('themeChange', (e) => {
            this.setTheme(e.detail.theme);
        });

        // Keyboard shortcut (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    static setupSystemThemeDetection() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!this.getStoredTheme()) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });

            // Set initial theme based on system preference if no stored preference
            if (!this.getStoredTheme()) {
                this.setTheme(mediaQuery.matches ? 'dark' : 'light');
            }
        }
    }

    static updateThemeIcon(theme) {
        // Icons are now handled by CSS, but we can add additional logic here if needed
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            const isDark = theme === 'dark';
            themeBtn.setAttribute('aria-pressed', isDark);
            themeBtn.setAttribute('aria-label', 
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
    }

    static updateThemeButton(theme) {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.setAttribute('aria-label', 
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
    }

    static animateThemeTransition() {
        // Add transition class to body
        document.body.classList.add('theme-transitioning');
        
        // Remove class after transition
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    }

    static animateThemeToggle(button) {
        // Add click animation
        button.style.transform = 'scale(0.95)';
        button.classList.add('clicked');
        
        setTimeout(() => {
            button.style.transform = '';
            button.classList.remove('clicked');
        }, 150);
    }

    static getCurrentTheme() {
        return this.currentTheme;
    }

    static isDark() {
        return this.currentTheme === 'dark';
    }

    static isLight() {
        return this.currentTheme === 'light';
    }

    // Theme-specific utilities
    static getThemeColor(colorName) {
        const root = document.documentElement;
        return getComputedStyle(root).getPropertyValue(`--${colorName}`).trim();
    }

    static setThemeColor(colorName, value) {
        const root = document.documentElement;
        root.style.setProperty(`--${colorName}`, value);
    }

    // Advanced theme customization
    static setCustomTheme(themeConfig) {
        const root = document.documentElement;
        
        Object.entries(themeConfig).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }

    static resetToDefaultTheme() {
        const root = document.documentElement;
        const defaultTheme = this.currentTheme === 'dark' ? 'dark' : 'light';
        
        // Remove custom properties
        const customProps = Array.from(root.style).filter(prop => prop.startsWith('--'));
        customProps.forEach(prop => {
            root.style.removeProperty(prop);
        });
        
        this.setTheme(defaultTheme);
    }

    // Theme persistence across tabs
    static setupCrossTabSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme' && e.newValue !== this.currentTheme) {
                this.setTheme(e.newValue);
            }
        });
    }

    // Theme-aware image switching
    static updateImages() {
        const images = document.querySelectorAll('[data-theme-src]');
        images.forEach(img => {
            const lightSrc = img.dataset.src || img.src;
            const darkSrc = img.dataset.themeSrc;
            
            if (this.isDark() && darkSrc) {
                img.src = darkSrc;
            } else if (this.isLight() && lightSrc) {
                img.src = lightSrc;
            }
        });
    }

    // Theme-aware icon switching
    static updateIcons() {
        const icons = document.querySelectorAll('[data-theme-icon]');
        icons.forEach(icon => {
            const lightIcon = icon.dataset.icon || icon.className;
            const darkIcon = icon.dataset.themeIcon;
            
            if (this.isDark() && darkIcon) {
                icon.className = darkIcon;
            } else if (this.isLight() && lightIcon) {
                icon.className = lightIcon;
            }
        });
    }

    // Accessibility features
    static setupAccessibility() {
        // High contrast mode detection
        if (window.matchMedia) {
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            
            highContrastQuery.addEventListener('change', (e) => {
                document.body.classList.toggle('high-contrast', e.matches);
            });
            
            // Set initial state
            document.body.classList.toggle('high-contrast', highContrastQuery.matches);
        }

        // Reduced motion detection
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            
            reducedMotionQuery.addEventListener('change', (e) => {
                document.body.classList.toggle('reduced-motion', e.matches);
            });
            
            // Set initial state
            document.body.classList.toggle('reduced-motion', reducedMotionQuery.matches);
        }
    }

    // Theme analytics
    static trackThemeUsage() {
        // Track theme changes for analytics
        const trackThemeChange = (theme) => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'theme_change', {
                    'theme': theme,
                    'timestamp': Date.now()
                });
            }
        };

        // Override setTheme to include tracking
        const originalSetTheme = this.setTheme;
        this.setTheme = (theme) => {
            originalSetTheme.call(this, theme);
            trackThemeChange(theme);
        };
    }
}

// CSS for theme transitions
const themeStyles = document.createElement('style');
themeStyles.textContent = `
    :root {
        --theme-transition-duration: 0.3s;
    }

    * {
        transition: background-color var(--theme-transition-duration) ease,
                    border-color var(--theme-transition-duration) ease,
                    color var(--theme-transition-duration) ease,
                    box-shadow var(--theme-transition-duration) ease;
    }

    .theme-transitioning * {
        transition: all var(--theme-transition-duration) ease !important;
    }

    /* High contrast mode */
    .high-contrast {
        --primary: #000000;
        --secondary: #000000;
        --text-primary: #000000;
        --text-secondary: #000000;
        --bg-primary: #ffffff;
        --bg-secondary: #ffffff;
        --border-color: #000000;
    }

    .high-contrast[data-theme="dark"] {
        --primary: #ffffff;
        --secondary: #ffffff;
        --text-primary: #ffffff;
        --text-secondary: #ffffff;
        --bg-primary: #000000;
        --bg-secondary: #000000;
        --border-color: #ffffff;
    }

    /* Reduced motion */
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }

    /* Theme toggle button animation */
    #theme-btn {
        transition: all 0.3s ease;
    }

    #theme-btn:hover {
        transform: scale(1.1) rotate(180deg);
    }

    /* Smooth theme switching */
    body {
        transition: background-color var(--theme-transition-duration) ease,
                    color var(--theme-transition-duration) ease;
    }

    /* Theme-aware images */
    img[data-theme-src] {
        transition: opacity var(--theme-transition-duration) ease;
    }

    /* Theme-aware icons */
    [data-theme-icon] {
        transition: all var(--theme-transition-duration) ease;
    }
`;
document.head.appendChild(themeStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing ThemeManager...');
    ThemeManager.init();
    ThemeManager.setupCrossTabSync();
    ThemeManager.setupAccessibility();
    ThemeManager.updateImages();
    ThemeManager.updateIcons();
    console.log('ThemeManager initialized, current theme:', ThemeManager.getCurrentTheme());
    
    // Additional fallback setup for theme button
    setTimeout(() => {
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn && !themeBtn.hasAttribute('data-theme-listener')) {
            console.log('Setting up fallback theme button listener');
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                ThemeManager.toggleTheme();
            });
            themeBtn.setAttribute('data-theme-listener', 'true');
        }
    }, 100);
});

// Export for global access
window.ThemeManager = ThemeManager;

// Make it available globally for easy access
window.toggleTheme = ThemeManager.toggleTheme.bind(ThemeManager);
window.setTheme = ThemeManager.setTheme.bind(ThemeManager);
