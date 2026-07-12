// Authentication functionality
class AuthManager {
    static init() {
        this.setupFormValidation();
        this.setupPasswordToggle();
        this.setupPasswordStrength();
        this.setupSocialLogin();
        this.setupAnimations();
    }

    static setupFormValidation() {
        const forms = document.querySelectorAll('.auth-form');
        
        forms.forEach(form => {
            // Real-time validation
            const inputs = form.querySelectorAll('input[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                });

                input.addEventListener('input', () => {
                    this.clearInputError(input);
                });
            });
        });
    }

    static validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        // Special validation for signup form
        if (form.action.includes('signup')) {
            const password = form.querySelector('input[name="password"]');
            const confirmPassword = form.querySelector('input[name="confirm_password"]');
            
            if (password && confirmPassword && password.value !== confirmPassword.value) {
                this.showInputError(confirmPassword, 'Passwords do not match');
                isValid = false;
            }
        }

        return isValid;
    }

    static validateInput(input) {
        const value = input.value.trim();
        const type = input.type;
        let isValid = true;
        let message = '';

        // Required validation
        if (input.hasAttribute('required') && !value) {
            message = 'This field is required';
            isValid = false;
        }

        // Email validation
        if (type === 'email' && value && !this.isValidEmail(value)) {
            message = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (type === 'password' && value && value.length < 6) {
            message = 'Password must be at least 6 characters';
            isValid = false;
        }

        // Name validation
        if (input.name === 'name' && value && value.length < 2) {
            message = 'Name must be at least 2 characters';
            isValid = false;
        }

        // Show/hide error
        if (isValid) {
            this.clearInputError(input);
        } else {
            this.showInputError(input, message);
        }

        return isValid;
    }

    static showInputError(input, message) {
        const formGroup = input.closest('.form-group');
        let errorElement = formGroup.querySelector('.invalid-feedback');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        input.classList.add('is-invalid');
        
        // Add shake animation
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }

    static clearInputError(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.invalid-feedback');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        input.classList.remove('is-invalid');
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static setupPasswordToggle() {
        // Handle both login and signup forms
        const passwordToggles = document.querySelectorAll('.password-toggle');
        const passwordToggleById = document.getElementById('password-toggle');
        const confirmPasswordToggle = document.getElementById('confirm-password-toggle');
        
        // Add all toggles to array
        const allToggles = [...passwordToggles];
        if (passwordToggleById) allToggles.push(passwordToggleById);
        if (confirmPasswordToggle) allToggles.push(confirmPasswordToggle);
        
        allToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                // Find the associated input field
                let input;
                if (toggle.id === 'password-toggle') {
                    input = document.getElementById('password');
                } else if (toggle.id === 'confirm-password-toggle') {
                    input = document.getElementById('confirm-password');
                } else {
                    // Fallback for generic password-toggle class
                    input = toggle.parentElement.querySelector('input[type="password"], input[name="password"], input[name="confirm_password"]');
                }
                
                if (!input) return;
                
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }

    static setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        if (passwordInput && strengthBar && strengthText) {
            passwordInput.addEventListener('input', () => {
                const strength = this.calculatePasswordStrength(passwordInput.value);
                this.updateStrengthMeter(strength, strengthBar, strengthText);
            });
        }
    }

    static calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        return Math.min(strength, 4);
    }

    static updateStrengthMeter(strength, strengthBar, strengthText) {
        const percentages = ['0%', '25%', '50%', '75%', '100%'];
        const colors = ['#dc3545', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'];
        const texts = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
        
        strengthBar.style.width = percentages[strength];
        strengthBar.style.background = colors[strength];
        strengthText.textContent = strength === 0 ? 'Password strength' : texts[strength];
        strengthText.style.color = strength === 0 ? 'var(--text-secondary)' : colors[strength];
    }

    static setupSocialLogin() {
        const socialButtons = document.querySelectorAll('.social-btn');
        
        socialButtons.forEach(button => {
            // Add loading state and visual feedback
            button.addEventListener('mouseenter', (e) => {
                button.style.transform = 'scale(1.1)';
            });
            
            button.addEventListener('mouseleave', (e) => {
                button.style.transform = 'scale(1)';
            });
            
            // OAuth links will naturally redirect to their href
            // No need to prevent default or handle manually
        });
    }

    static setupAnimations() {
        // Animate form elements on load
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                group.style.transition = 'all 0.5s ease-out';
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Animate buttons
        const buttons = document.querySelectorAll('.auth-btn, .social-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    static showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Insert at top of form
        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
            
            // Remove after 5 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }

    static getMessageIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        
        return icons[type] || 'info-circle';
    }

    static setupLoadingStates() {
        const forms = document.querySelectorAll('.auth-form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitButton = form.querySelector('.auth-btn[type="submit"]');
                if (submitButton) {
                    this.setButtonLoading(submitButton, true);
                }
            });
        });
    }

    static setButtonLoading(button, loading) {
        if (loading) {
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText;
            button.disabled = false;
        }
    }

    static setupRememberMe() {
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox) {
            // Load saved state
            const saved = localStorage.getItem('rememberMe');
            if (saved === 'true') {
                rememberCheckbox.checked = true;
            }

            // Save state on change
            rememberCheckbox.addEventListener('change', () => {
                localStorage.setItem('rememberMe', rememberCheckbox.checked);
            });
        }
    }

    static setupAutoComplete() {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            // Load saved email
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail) {
                emailInput.value = savedEmail;
            }

            // Save email on change
            emailInput.addEventListener('blur', () => {
                if (emailInput.value) {
                    localStorage.setItem('savedEmail', emailInput.value);
                }
            });
        }
    }
}

// CSS for animations
const authStyles = document.createElement('style');
authStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .alert {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 0.875rem;
        font-weight: 500;
        animation: slideInDown 0.3s ease-out;
    }

    .alert-success {
        background: rgba(46, 213, 115, 0.1);
        border: 1px solid rgba(46, 213, 115, 0.3);
        color: var(--success);
    }

    .alert-error {
        background: rgba(255, 107, 129, 0.1);
        border: 1px solid rgba(255, 107, 129, 0.3);
        color: var(--danger);
    }

    .alert-warning {
        background: rgba(255, 159, 67, 0.1);
        border: 1px solid rgba(255, 159, 67, 0.3);
        color: var(--warning);
    }

    .alert-info {
        background: rgba(30, 144, 255, 0.1);
        border: 1px solid rgba(30, 144, 255, 0.3);
        color: var(--info);
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

    .form-group {
        transition: all 0.3s ease;
    }

    .auth-btn, .social-btn {
        transition: all 0.3s ease;
    }

    .auth-btn:hover, .social-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }

    .password-toggle {
        transition: all 0.3s ease;
    }

    .password-toggle:hover {
        color: var(--primary);
        background: var(--bg-secondary);
    }
`;
document.head.appendChild(authStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AuthManager.init();
    AuthManager.setupLoadingStates();
    AuthManager.setupRememberMe();
    AuthManager.setupAutoComplete();
});

// Export for global access
window.AuthManager = AuthManager;