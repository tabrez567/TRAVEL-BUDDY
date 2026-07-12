// Matching and swiping functionality
class MatchingManager {
    static init() {
        this.currentProfileIndex = 0;
        this.profiles = [];
        this.isLoading = false;
        this.setupEventListeners();
        this.loadProfiles();
    }

    static setupEventListeners() {
        const likeBtn = document.getElementById('like-btn');
        const dislikeBtn = document.getElementById('dislike-btn');
        const superLikeBtn = document.getElementById('super-like-btn');

        if (likeBtn) likeBtn.addEventListener('click', () => this.handleLike());
        if (dislikeBtn) dislikeBtn.addEventListener('click', () => this.handleDislike());
        if (superLikeBtn) superLikeBtn.addEventListener('click', () => this.handleSuperLike());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.handleDislike();
            else if (e.key === 'ArrowRight') this.handleLike();
            else if (e.key === 'ArrowUp') this.handleSuperLike();
        });
    }

    static async loadProfiles() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch('/match/api/profiles');
            
            // Check if response is redirecting to login page
            if (response.url.includes('/auth/login')) {
                console.error('User not authenticated. Please log in first.');
                // Redirect to login page
                window.location.href = '/auth/login';
                return;
            }
            
            this.profiles = await response.json();
            this.currentProfileIndex = 0;
            this.displayCurrentProfile();
        } catch (error) {
            console.error('Error loading profiles:', error);
            // Check if the error is due to parsing HTML as JSON (user not logged in)
            if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
                // Redirect to login page
                window.location.href = '/auth/login';
            }
        } finally {
            this.isLoading = false;
        }
    }

    static displayCurrentProfile() {
        if (this.currentProfileIndex >= this.profiles.length) {
            this.showNoMoreProfiles();
            return;
        }

        const profile = this.profiles[this.currentProfileIndex];
        const profileCard = document.getElementById('profile-card');
        
        if (profileCard) {
            profileCard.innerHTML = `
                <div class="profile-image">
                    <img src="${profile.profile_picture || '/static/img/avatars/default.jpg'}" alt="${profile.name}">
                </div>
                <div class="profile-info">
                    <h2>${profile.name}, ${profile.age}</h2>
                    <p class="location">${profile.location}</p>
                    <p class="bio">${profile.bio || 'No bio available'}</p>
                </div>
            `;
        }
    }

    static async handleLike() {
        const profile = this.profiles[this.currentProfileIndex];
        await this.performAction('like', profile.id);
        this.nextProfile();
    }

    static async handleDislike() {
        const profile = this.profiles[this.currentProfileIndex];
        await this.performAction('dislike', profile.id);
        this.nextProfile();
    }

    static async handleSuperLike() {
        const profile = this.profiles[this.currentProfileIndex];
        await this.performAction('super_like', profile.id);
        this.nextProfile();
    }

    static async performAction(action, profileId) {
        try {
            const response = await fetch(`/match/api/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_id: profileId })
            });
            const result = await response.json();
            if (result.success) this.showActionFeedback(action, result);
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
        }
    }

    static showActionFeedback(action, result) {
        const feedback = document.getElementById('action-feedback');
        if (feedback) {
            feedback.textContent = action === 'like' ? 'Liked!' : action === 'dislike' ? 'Disliked' : 'Super Liked!';
            feedback.style.display = 'block';
            setTimeout(() => feedback.style.display = 'none', 2000);
        }
    }

    static nextProfile() {
        this.currentProfileIndex++;
        this.displayCurrentProfile();
    }

    static showNoMoreProfiles() {
        const profileCard = document.getElementById('profile-card');
        if (profileCard) {
            profileCard.innerHTML = `
                <div class="no-more-profiles">
                    <h3>No more profiles</h3>
                    <p>Check back later for new matches!</p>
                    <button class="btn btn-primary" onclick="MatchingManager.loadProfiles()">Refresh</button>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on matching/swipe page
    if (window.location.pathname.includes('/match/swipe')) {
        MatchingManager.init();
    }
});

window.MatchingManager = MatchingManager;