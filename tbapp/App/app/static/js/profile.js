// Enhanced Profile Edit Functionality

class ProfileEdit {
    constructor() {
        this.selectedInterests = new Set();
        this.characterLimits = { bio: 500, name: 50 };
        this.init();
    }

    init() {
        this.setupPhotoUploads();
        this.setupCharacterCounters();
        this.setupInterestSelection();
        this.setupModalHandlers();
        this.setupRealTimePreview();
    }

    setupPhotoUploads() {
        const profileInput = document.getElementById('profile-picture');
        if (profileInput) {
            profileInput.addEventListener('change', (e) => {
                this.handlePhotoUpload(e.target.files[0], 'profile-preview');
            });
        }

        // Additional photos
        for (let i = 1; i <= 5; i++) {
            const photoInput = document.getElementById(`photo-${i}`);
            if (photoInput) {
                photoInput.addEventListener('change', (e) => {
                    this.handlePhotoUpload(e.target.files[0], `photo-${i}-preview`);
                });
            }
        }
    }

    async handlePhotoUpload(file, previewId) {
        if (!file || !file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image must be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewElement = document.getElementById(previewId);
            if (previewElement) {
                previewElement.src = e.target.result;
                const container = previewElement.closest('.photo-upload-item');
                if (container) container.classList.add('has-photo');
            }
            this.updatePreviewModal();
        };
        reader.readAsDataURL(file);
        this.showNotification('Photo uploaded successfully!', 'success');
    }

    setupCharacterCounters() {
        Object.keys(this.characterLimits).forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const counter = field?.parentNode.querySelector('.char-count');
            
            if (field && counter) {
                const updateCounter = () => {
                    const length = field.value.length;
                    const limit = this.characterLimits[fieldName];
                    counter.textContent = `${length}/${limit} characters`;
                    
                    counter.classList.toggle('warning', limit - length <= 50);
                    counter.classList.toggle('danger', length >= limit);
                };
                
                updateCounter();
                field.addEventListener('input', updateCounter);
            }
        });
    }

    setupInterestSelection() {
        const interestCheckboxes = document.querySelectorAll('.interest-checkbox input');
        
        interestCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedInterests.add(checkbox.value);
                } else {
                    this.selectedInterests.delete(checkbox.value);
                }
                this.updateInterestsPreview();
            });
        });
    }

    updateInterestsPreview() {
        const previewContainer = document.getElementById('preview-interests');
        if (previewContainer) {
            previewContainer.innerHTML = Array.from(this.selectedInterests)
                .map(interest => `<span class="interest-tag">${interest}</span>`)
                .join('');
        }
    }

    setupModalHandlers() {
        const previewModal = document.getElementById('preview-modal');
        if (previewModal) {
            const closeBtn = previewModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal('preview-modal'));
            }
            previewModal.addEventListener('click', (e) => {
                if (e.target === previewModal) this.closeModal('preview-modal');
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
            document.body.style.overflow = 'auto';
        }
    }

    setupRealTimePreview() {
        ['name', 'age', 'location', 'bio'].forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('input', () => this.updatePreviewModal());
            }
        });
    }

    updatePreviewModal() {
        const updates = {
            'preview-name': document.getElementById('name')?.value || 'Your Name',
            'preview-age-location': this.getAgeLocationText(),
            'preview-bio': document.getElementById('bio')?.value || 'No bio yet'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        this.updateInterestsPreview();
    }

    getAgeLocationText() {
        const age = document.getElementById('age')?.value;
        const location = document.getElementById('location')?.value;
        return [age && `${age} years`, location].filter(Boolean).join(' • ') || 'Age and location';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = { success: '#2ed573', error: '#ff6b81', warning: '#ffa726', info: '#5352ed' };
        
        notification.innerHTML = `<i class="fas fa-${type === 'error' ? 'times' : 'check'}"></i> ${message}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: ${colors[type]};
            color: white; padding: 16px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1001;
            transform: translateX(400px); transition: transform 0.3s ease;
            display: flex; align-items: center; gap: 8px;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.style.transform = 'translateX(0)', 10);
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global functions
window.previewProfile = function() {
    if (window.profileEdit) {
        window.profileEdit.updatePreviewModal();
        window.profileEdit.openModal('preview-modal');
    }
};

window.removePhoto = function(type) {
    if (confirm('Remove this photo?')) {
        const preview = document.getElementById(`${type}-preview`) || document.getElementById('profile-preview');
        if (preview) {
            preview.src = '/static/img/avatars/default.jpg';
            preview.closest('.photo-upload-item')?.classList.remove('has-photo');
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profile-form')) {
        window.profileEdit = new ProfileEdit();
    }
    if (document.getElementById('profile-avatar-img')) {
        window.profileApp = new Profile();
    }
});

// Original Profile class follows...
    constructor() {
        this.profileData = null;
        this.init();
    }

    async init() {
        await this.loadProfileData();
        this.setupEventListeners();
        this.updateProfileCompleteness();
    }

    async loadProfileData() {
        try {
            this.profileData = await API.get('/profile/api/details');
            this.updateProfileUI();
        } catch (error) {
            console.error('Failed to load profile data:', error);
            NotificationSystem.show('Failed to load profile data', 'error');
        }
    }

    updateProfileUI() {
        if (!this.profileData) return;

        // Update profile picture
        const avatarImg = document.getElementById('profile-avatar-img');
        if (avatarImg && this.profileData.profile_picture) {
            avatarImg.src = this.profileData.profile_picture;
        }

        // Update profile completeness
        this.updateProfileCompleteness();
    }

    updateProfileCompleteness() {
        const completeness = this.profileData ? this.profileData.profile_complete : 75;
        const progressCircle = document.querySelector('.progress-circle');
        
        if (progressCircle) {
            progressCircle.style.background = `conic-gradient(#ff4757 ${completeness}%, #e9ecef ${completeness}% 100%)`;
            progressCircle.querySelector('span').textContent = `${completeness}%`;
        }
    }

    setupEventListeners() {
        // Change avatar button
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                this.openAvatarModal();
            });
        }

        // Avatar modal
        const avatarModal = document.getElementById('avatar-modal');
        if (avatarModal) {
            // Close modal
            avatarModal.querySelector('.modal-close').addEventListener('click', () => {
                this.closeAvatarModal();
            });

            // Save avatar button
            const saveAvatarBtn = document.getElementById('save-avatar-btn');
            if (saveAvatarBtn) {
                saveAvatarBtn.addEventListener('click', () => {
                    this.saveAvatar();
                });
            }

            // Preset avatar selection
            avatarModal.querySelectorAll('.preset-avatar').forEach(avatar => {
                avatar.addEventListener('click', (e) => {
                    this.selectPresetAvatar(e.target);
                });
            });

            // File upload
            const fileInput = document.getElementById('avatar-upload');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleFileUpload(e.target.files[0]);
                });
            }
        }

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('avatar-modal');
            if (modal && e.target === modal) {
                this.closeAvatarModal();
            }
        });
    }

    openAvatarModal() {
        const modal = document.getElementById('avatar-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeAvatarModal() {
        const modal = document.getElementById('avatar-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    selectPresetAvatar(avatarElement) {
        // Remove selection from all avatars
        document.querySelectorAll('.preset-avatar').forEach(avatar => {
            avatar.classList.remove('selected');
        });

        // Add selection to clicked avatar
        avatarElement.classList.add('selected');

        // Update preview (in a real app, this would update the actual avatar)
        const preview = document.getElementById('profile-avatar-img');
        if (preview) {
            preview.src = avatarElement.src;
        }
    }

    async handleFileUpload(file) {
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            NotificationSystem.show('Please select an image file', 'error');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            NotificationSystem.show('Image must be less than 5MB', 'error');
            return;
        }

        // Show loading state
        NotificationSystem.show('Uploading image...', 'info');

        try {
            // In a real app, this would upload the file to the server
            // For demo purposes, we'll simulate the upload
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create a preview URL
            const previewUrl = URL.createObjectURL(file);
            
            // Update preview
            const preview = document.getElementById('profile-avatar-img');
            if (preview) {
                preview.src = previewUrl;
            }

            NotificationSystem.show('Avatar updated successfully', 'success');
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            NotificationSystem.show('Failed to upload avatar', 'error');
        }
    }

    async saveAvatar() {
        // In a real app, this would save the avatar to the server
        NotificationSystem.show('Avatar saved successfully', 'success');
        this.closeAvatarModal();
        
        // Reload profile data to get the updated avatar URL
        await this.loadProfileData();
    }

    async updateProfile(data) {
        try {
            const response = await API.post('/profile/api/update', data);
            
            if (response.success) {
                NotificationSystem.show('Profile updated successfully', 'success');
                await this.loadProfileData(); // Reload data
                return true;
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            NotificationSystem.show('Failed to update profile', 'error');
            return false;
        }
    }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profile-avatar-img')) {
        window.profileApp = new Profile();
    }
});