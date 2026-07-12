// Settings page functionality

const SettingsManager = {
    init() {
        this.initToggleSwitches();
        this.initFormSubmissions();
        this.initPasswordStrengthMeter();
        this.createModals();
    },

    initToggleSwitches() {
        // Get all toggle switches
        const toggles = document.querySelectorAll('.switch input[type="checkbox"]');
        
        // Add event listeners to each toggle
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const settingName = e.target.getAttribute('data-setting');
                const isEnabled = e.target.checked;
                
                // Show notification
                const message = isEnabled ? 
                    `${settingName} has been enabled` : 
                    `${settingName} has been disabled`;
                
                NotificationSystem.show(message, 'success');
                
                // Here you would typically send an API request to update the setting
                this.updateSetting(settingName, isEnabled);
            });
        });
    },

    initFormSubmissions() {
        // Email change form
        const emailChangeBtn = document.querySelector('button[data-action="change-email"]');
        if (emailChangeBtn) {
            emailChangeBtn.addEventListener('click', () => {
                ModalSystem.show('email-change-modal');
            });
        }

        // Password change form
        const passwordChangeBtn = document.querySelector('button[data-action="change-password"]');
        if (passwordChangeBtn) {
            passwordChangeBtn.addEventListener('click', () => {
                ModalSystem.show('password-change-modal');
            });
        }

        // Deactivate account button
        const deactivateAccountBtn = document.querySelector('button[data-action="deactivate-account"]');
        if (deactivateAccountBtn) {
            deactivateAccountBtn.addEventListener('click', () => {
                ModalSystem.showConfirmation(
                    'Deactivate Account', 
                    'Are you sure you want to deactivate your account? You can reactivate it later by logging in.', 
                    () => this.deactivateAccount()
                );
            });
        }

        // Delete account button
        const deleteAccountBtn = document.querySelector('button[data-action="delete-account"]');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                ModalSystem.showConfirmation(
                    'Delete Account', 
                    'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.', 
                    () => this.deleteAccount()
                );
            });
        }
    },

    initPasswordStrengthMeter() {
        const passwordInput = document.querySelector('input[name="new_password"]');
        const strengthMeter = document.querySelector('.password-strength-meter');
        
        if (passwordInput && strengthMeter) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                
                // Update strength meter
                strengthMeter.className = `password-strength-meter strength-${strength.level}`;
                strengthMeter.querySelector('.strength-text').textContent = strength.text;
                strengthMeter.querySelector('.strength-bar').style.width = `${strength.percentage}%`;
            });
        }
    },

    createModals() {
        // Email change modal
        const emailModalContent = `
            <div class="modal-form-group">
                <label for="current_email">Current Email</label>
                <input type="email" id="current_email" name="current_email" disabled>
            </div>
            <div class="modal-form-group">
                <label for="new_email">New Email</label>
                <input type="email" id="new_email" name="new_email" required>
            </div>
            <div class="modal-form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" data-modal-close="email-change-modal">Cancel</button>
                <button class="btn btn-primary" id="confirm-email-change">Update Email</button>
            </div>
        `;
        
        // Password change modal
        const passwordModalContent = `
            <div class="modal-form-group">
                <label for="current_password">Current Password</label>
                <input type="password" id="current_password" name="current_password" required>
            </div>
            <div class="modal-form-group">
                <label for="new_password">New Password</label>
                <input type="password" id="new_password" name="new_password" required>
                <div class="password-strength-meter">
                    <div class="strength-bar">
                        <div class="strength-bar-fill"></div>
                    </div>
                    <div class="strength-text">Password strength</div>
                </div>
            </div>
            <div class="modal-form-group">
                <label for="confirm_password">Confirm New Password</label>
                <input type="password" id="confirm_password" name="confirm_password" required>
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" data-modal-close="password-change-modal">Cancel</button>
                <button class="btn btn-primary" id="confirm-password-change">Update Password</button>
            </div>
        `;
        
        // Create modals
        ModalSystem.create('email-change-modal', {
            title: 'Change Email Address',
            content: emailModalContent,
            size: 'medium',
            closable: true
        });
        
        ModalSystem.create('password-change-modal', {
            title: 'Change Password',
            content: passwordModalContent,
            size: 'medium',
            closable: true
        });
        
        // Add event listeners for modal forms
        document.addEventListener('DOMContentLoaded', () => {
            // Email change form submission
            const confirmEmailBtn = document.getElementById('confirm-email-change');
            if (confirmEmailBtn) {
                confirmEmailBtn.addEventListener('click', () => this.updateEmail());
            }
            
            // Password change form submission
            const confirmPasswordBtn = document.getElementById('confirm-password-change');
            if (confirmPasswordBtn) {
                confirmPasswordBtn.addEventListener('click', () => this.updatePassword());
            }
            
            // Initialize password strength meter in modal
            const newPasswordInput = document.getElementById('new_password');
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', (e) => {
                    const password = e.target.value;
                    const strength = this.calculatePasswordStrength(password);
                    
                    const strengthMeter = document.querySelector('.password-strength-meter');
                    if (strengthMeter) {
                        const strengthBarFill = strengthMeter.querySelector('.strength-bar-fill');
                        const strengthText = strengthMeter.querySelector('.strength-text');
                        
                        if (strengthBarFill && strengthText) {
                            strengthBarFill.style.width = `${strength.percentage}%`;
                            strengthBarFill.style.backgroundColor = strength.color;
                            strengthText.textContent = strength.text;
                        }
                    }
                });
            }
        });
    },
    
    calculatePasswordStrength(password) {
        // Simple password strength calculation
        let score = 0;
        
        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Complexity checks
        if (/[A-Z]/.test(password)) score += 1; // Has uppercase
        if (/[a-z]/.test(password)) score += 1; // Has lowercase
        if (/[0-9]/.test(password)) score += 1; // Has number
        if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char
        
        // Determine level and text based on score
        let level, text, percentage, color;
        
        switch (score) {
            case 0:
            case 1:
                level = 'weak';
                text = 'Weak';
                percentage = 25;
                color = 'var(--danger)';
                break;
            case 2:
            case 3:
                level = 'medium';
                text = 'Medium';
                percentage = 50;
                color = 'var(--warning)';
                break;
            case 4:
            case 5:
                level = 'strong';
                text = 'Strong';
                percentage = 75;
                color = 'var(--info)';
                break;
            case 6:
                level = 'very-strong';
                text = 'Very Strong';
                percentage = 100;
                color = 'var(--success)';
                break;
            default:
                level = 'weak';
                text = 'Weak';
                percentage = 25;
                color = 'var(--danger)';
        }
        
        return { level, text, percentage, color };
    },
    
    updateSetting(settingName, value) {
        // Send API request to update setting
        API.post('/api/settings/update', {
            setting: settingName,
            value: value
        })
        .then(response => {
            NotificationSystem.show(`${settingName} setting updated successfully`, 'success');
        })
        .catch(error => {
            NotificationSystem.show(`Failed to update ${settingName}: ${error.message}`, 'error');
            // Revert toggle state if API call fails
            const toggle = document.querySelector(`input[data-setting="${settingName}"]`);
            if (toggle) toggle.checked = !value;
        });
    },
    
    updateEmail() {
        const newEmail = document.getElementById('new_email').value;
        const password = document.getElementById('password').value;
        
        if (!newEmail || !password) {
            NotificationSystem.show('Please fill in all fields', 'error');
            return;
        }
        
        // Send API request to update email
        API.post('/api/settings/update-email', {
            new_email: newEmail,
            password: password
        })
        .then(response => {
            NotificationSystem.show('Email updated successfully', 'success');
            ModalSystem.close('email-change-modal');
            // Update displayed email if needed
            const emailDisplay = document.querySelector('.current-email');
            if (emailDisplay) emailDisplay.textContent = newEmail;
        })
        .catch(error => {
            NotificationSystem.show(`Failed to update email: ${error.message}`, 'error');
        });
    },
    
    updatePassword() {
        const currentPassword = document.getElementById('current_password').value;
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            NotificationSystem.show('Please fill in all fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            NotificationSystem.show('New passwords do not match', 'error');
            return;
        }
        
        const strength = this.calculatePasswordStrength(newPassword);
        if (strength.level === 'weak') {
            NotificationSystem.show('Password is too weak. Please choose a stronger password.', 'warning');
            return;
        }
        
        // Send API request to update password
        API.post('/api/settings/update-password', {
            current_password: currentPassword,
            new_password: newPassword
        })
        .then(response => {
            NotificationSystem.show('Password updated successfully', 'success');
            ModalSystem.close('password-change-modal');
        })
        .catch(error => {
            NotificationSystem.show(`Failed to update password: ${error.message}`, 'error');
        });
    },
    
    deactivateAccount() {
        // Send API request to deactivate account
        API.post('/api/settings/deactivate-account')
        .then(response => {
            NotificationSystem.show('Your account has been deactivated', 'success');
            // Redirect to logout page after a short delay
            setTimeout(() => {
                window.location.href = '/auth/logout';
            }, 2000);
        })
        .catch(error => {
            NotificationSystem.show(`Failed to deactivate account: ${error.message}`, 'error');
        });
    },
    
    deleteAccount() {
        // Send API request to delete account
        API.post('/api/settings/delete-account')
        .then(response => {
            NotificationSystem.show('Your account has been deleted', 'success');
            // Redirect to logout page after a short delay
            setTimeout(() => {
                window.location.href = '/auth/logout';
            }, 2000);
        })
        .catch(error => {
            NotificationSystem.show(`Failed to delete account: ${error.message}`, 'error');
        });
    }
};

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();
});