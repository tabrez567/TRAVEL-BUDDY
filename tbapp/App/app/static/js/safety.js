// Safety functionality

class Safety {
    constructor() {
        this.blockedUsers = [];
        this.init();
    }

    async init() {
        await this.loadBlockedUsers();
        this.setupEventListeners();
    }

    async loadBlockedUsers() {
        try {
            this.blockedUsers = await API.get('/safety/api/blocked-users');
            this.renderBlockedUsers();
        } catch (error) {
            console.error('Failed to load blocked users:', error);
        }
    }

    setupEventListeners() {
        // Switch toggles
        document.querySelectorAll('.switch input').forEach(switchEl => {
            switchEl.addEventListener('change', (e) => {
                this.handleSettingChange(e.target);
            });
        });

        // Delete account button
        const deleteAccountBtn = document.querySelector('.btn-danger');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.handleDeleteAccount();
            });
        }

        // Download data button
        const downloadDataBtn = document.querySelector('.btn-outline');
        if (downloadDataBtn) {
            downloadDataBtn.addEventListener('click', () => {
                this.handleDownloadData();
            });
        }
    }

    handleSettingChange(setting) {
        const settingName = setting.closest('.setting-item').querySelector('h4').textContent;
        const isEnabled = setting.checked;
        
        NotificationSystem.show(`${settingName} ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
        
        // In a real app, this would save the setting to the server
        console.log(`Setting changed: ${settingName} = ${isEnabled}`);
    }

    renderBlockedUsers() {
        // This would render the blocked users list in the block.html page
        // Implementation depends on the specific block.html structure
    }

    async handleBlockUser(userId, reason) {
        try {
            const response = await API.post('/safety/api/block-user', {
                user_id: userId,
                reason: reason
            });
            
            if (response.success) {
                NotificationSystem.show('User blocked successfully', 'success');
                this.loadBlockedUsers(); // Refresh the list
            }
        } catch (error) {
            console.error('Failed to block user:', error);
            NotificationSystem.show('Failed to block user', 'error');
        }
    }

    async handleUnblockUser(userId) {
        try {
            const response = await API.post('/safety/api/unblock-user', {
                user_id: userId
            });
            
            if (response.success) {
                NotificationSystem.show('User unblocked successfully', 'success');
                this.loadBlockedUsers(); // Refresh the list
            }
        } catch (error) {
            console.error('Failed to unblock user:', error);
            NotificationSystem.show('Failed to unblock user', 'error');
        }
    }

    handleDeleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all your data, including matches, messages, and profile information. Are you absolutely sure?')) {
            return;
        }

        // In a real app, this would call an API endpoint to delete the account
        NotificationSystem.show('Account deletion request received. Please check your email to confirm.', 'info');
    }

    async handleDownloadData() {
        try {
            // In a real app, this would call an API endpoint to generate a data export
            NotificationSystem.show('Data export request received. You will receive an email when your data is ready to download.', 'info');
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // For demo purposes, create a mock download
            const data = {
                user: {
                    name: "John Doe",
                    email: "john.doe@example.com",
                    join_date: "2023-01-15"
                },
                profile: {
                    bio: "Sample bio information",
                    interests: ["Travel", "Music", "Sports"]
                },
                matches: [
                    { id: 1, name: "Jane Smith", matched_date: "2023-06-20" },
                    { id: 2, name: "Bob Johnson", matched_date: "2023-07-05" }
                ],
                messages: {
                    total: 127,
                    last_30_days: 23
                }
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'connectify-data-export.json';
            link.click();
            
            NotificationSystem.show('Data download started', 'success');
        } catch (error) {
            console.error('Failed to download data:', error);
            NotificationSystem.show('Failed to download data', 'error');
        }
    }
}

// Initialize safety when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.safety-container')) {
        window.safetyApp = new Safety();
    }
});