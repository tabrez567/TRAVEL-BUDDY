/**
 * Discover Page - Enhanced Dating App Discovery Experience
 * Handles profile loading, filtering, and interactions
 */

class DiscoverManager {
    constructor() {
        this.profiles = [];
        this.currentOffset = 0;
        this.limit = 12;
        this.hasMore = true;
        this.isLoading = false;
        this.filters = this.getDefaultFilters();
        
        this.init();
    }
    
    init() {
        console.log('Initializing Discover Manager...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial profiles
        this.loadProfiles();
        
        // Initialize filter modal
        this.initializeFilters();
        
        console.log('Discover Manager initialized successfully');
    }
    
    cacheElements() {
        this.discoveryContainer = document.getElementById('discovery-container');
        this.filterModal = document.getElementById('filterModal');
        this.applyFiltersBtn = document.getElementById('apply-filters');
        this.filterPills = document.querySelector('.filter-pills');
        
        // Range sliders
        this.ageMinSlider = document.getElementById('age-range-min');
        this.ageMaxSlider = document.getElementById('age-range-max');
        this.distanceSlider = document.getElementById('distance-range');
        
        // Value displays
        this.ageMinDisplay = document.getElementById('age-min');
        this.ageMaxDisplay = document.getElementById('age-max');
        this.distanceDisplay = document.getElementById('distance-value');
    }
    
    setupEventListeners() {
        // Filter application
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        // Infinite scroll
        window.addEventListener('scroll', () => {
            if (this.shouldLoadMore()) {
                this.loadMoreProfiles();
            }
        });
        
        // Range slider updates
        if (this.ageMinSlider && this.ageMaxSlider) {
            this.ageMinSlider.addEventListener('input', () => this.updateAgeRange());
            this.ageMaxSlider.addEventListener('input', () => this.updateAgeRange());
        }
        
        if (this.distanceSlider) {
            this.distanceSlider.addEventListener('input', () => this.updateDistance());
        }
        
        // Interest tag interactions
        this.setupInterestTags();
        
        // Filter pill removal
        this.setupFilterPillRemoval();
    }
    
    getDefaultFilters() {
        return {
            genderPreference: 'all',
            ageRange: [18, 40],
            distance: 50,
            relationshipType: 'any',
            interests: []
        };
    }
    
    async loadProfiles() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                offset: this.currentOffset,
                limit: this.limit,
                ...this.buildFilterParams()
            });
            
            console.log('Loading profiles with params:', params.toString());
            
            const response = await fetch(`/discover/api/recommendations?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Loaded profiles:', data);
            
            if (this.currentOffset === 0) {
                this.profiles = data.profiles;
            } else {
                this.profiles = [...this.profiles, ...data.profiles];
            }
            
            this.hasMore = data.hasMore;
            this.currentOffset += data.profiles.length;
            
            this.renderProfiles();
            
        } catch (error) {
            console.error('Error loading profiles:', error);
            this.showError('Failed to load profiles. Please refresh the page and try again.');
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadMoreProfiles() {
        if (!this.hasMore || this.isLoading) return;
        
        await this.loadProfiles();
    }
    
    buildFilterParams() {
        return {
            gender: this.filters.genderPreference,
            min_age: this.filters.ageRange[0],
            max_age: this.filters.ageRange[1],
            distance: this.filters.distance,
            relationship_type: this.filters.relationshipType,
            interests: this.filters.interests.join(',')
        };
    }
    
    renderProfiles() {
        if (!this.discoveryContainer) return;
        
        // Clear loading state
        this.clearLoadingState();
        
        if (this.profiles.length === 0) {
            this.showNoProfiles();
            return;
        }
        
        // Create profiles grid if it doesn't exist
        let profilesGrid = this.discoveryContainer.querySelector('.profiles-grid');
        if (!profilesGrid) {
            profilesGrid = document.createElement('div');
            profilesGrid.className = 'profiles-grid';
            this.discoveryContainer.appendChild(profilesGrid);
        }
        
        // Render only new profiles
        const startIndex = profilesGrid.children.length;
        for (let i = startIndex; i < this.profiles.length; i++) {
            const profileCard = this.createProfileCard(this.profiles[i]);
            profilesGrid.appendChild(profileCard);
        }
        
        // Initialize animations for new cards
        this.animateNewCards(profilesGrid, startIndex);
    }
    
    createProfileCard(profile) {
        const card = document.createElement('div');
        card.className = 'profile-card animate-fade-in';
        card.dataset.profileId = profile.id;
        
        // Calculate match percentage display
        const matchPercentage = profile.compatibilityScore 
            ? Math.round(profile.compatibilityScore * 100) 
            : Math.floor(Math.random() * 30) + 70; // Fallback random percentage
        
        // Format interests
        const interestTags = profile.interests.slice(0, 3).map(interest => 
            `<span class="interest-tag">${interest}</span>`
        ).join('');
        
        // Create verification badge
        const verifiedBadge = profile.verified 
            ? '<div class="verified-badge"><i class="fas fa-check-circle"></i></div>' 
            : '';
        
        card.innerHTML = `
            <div class="profile-card__container">
                <div class="profile-card__image-container">
                    ${verifiedBadge}
                    <div class="profile-card__match-percentage">${matchPercentage}%</div>
                    <img src="${profile.profilePicture}" alt="${profile.name}" class="profile-card__image">
                    <div class="profile-card__gradient-overlay"></div>
                </div>
                <div class="profile-card__content">
                    <div class="profile-card__header">
                        <h3 class="profile-card__name">${profile.name}, ${profile.age}</h3>
                        <div class="profile-card__distance">
                            <i class="fas fa-map-marker-alt"></i>
                            ${profile.distance}km away
                        </div>
                    </div>
                    <div class="profile-card__occupation">${profile.occupation}</div>
                    <div class="profile-card__bio">${this.truncateBio(profile.bio, 100)}</div>
                    <div class="profile-card__interests">
                        ${interestTags}
                        ${profile.interests.length > 3 ? `<span class="interest-tag more">+${profile.interests.length - 3}</span>` : ''}
                    </div>
                    <div class="profile-card__stats">
                        <div class="stat-item">
                            <i class="fas fa-chart-line"></i>
                            <span>Active</span>
                        </div>
                        ${profile.activityScore > 0.8 ? '<div class="stat-item active-now"><i class="fas fa-circle"></i><span>Online</span></div>' : ''}
                    </div>
                </div>
                <div class="profile-card__actions">
                    <button class="action-btn action-btn--pass" data-action="pass" title="Pass">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="action-btn action-btn--superlike" data-action="superlike" title="Super Like">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="action-btn action-btn--like" data-action="like" title="Like">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners for actions
        this.addCardEventListeners(card, profile);
        
        return card;
    }
    
    addCardEventListeners(card, profile) {
        const actionButtons = card.querySelectorAll('.action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                this.handleProfileAction(profile, action, card);
            });
        });
        
        // Card click to view profile
        card.addEventListener('click', () => {
            this.showProfileDetail(profile);
        });
        
        // Add touch/swipe gesture support
        this.addSwipeGestures(card, profile);
    }
    
    addSwipeGestures(card, profile) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;
        let initialTransform = '';
        
        // Mouse/Touch start
        const handleStart = (e) => {
            const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            
            startX = clientX;
            startY = clientY;
            currentX = clientX;
            currentY = clientY;
            isDragging = true;
            
            initialTransform = card.style.transform;
            card.style.transition = 'none';
            card.style.cursor = 'grabbing';
            
            e.preventDefault();
        };
        
        // Mouse/Touch move
        const handleMove = (e) => {
            if (!isDragging) return;
            
            const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            currentX = clientX;
            currentY = clientY;
            
            // Calculate rotation based on horizontal movement
            const rotation = deltaX * 0.1;
            const opacity = Math.max(0.5, 1 - Math.abs(deltaX) / 300);
            
            // Apply transform
            card.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg)`;
            card.style.opacity = opacity;
            
            // Show action hints
            this.showSwipeHints(card, deltaX, deltaY);
            
            e.preventDefault();
        };
        
        // Mouse/Touch end
        const handleEnd = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            card.style.transition = 'all 0.3s ease-out';
            card.style.cursor = 'pointer';
            
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // Determine action based on swipe distance and direction
            const threshold = 100;
            const superLikeThreshold = 80;
            
            if (Math.abs(deltaX) > threshold) {
                // Horizontal swipe
                const action = deltaX > 0 ? 'like' : 'pass';
                this.handleProfileAction(profile, action, card);
                return;
            } else if (deltaY < -superLikeThreshold) {
                // Upward swipe for super like
                this.handleProfileAction(profile, 'superlike', card);
                return;
            }
            
            // Snap back to original position
            card.style.transform = initialTransform;
            card.style.opacity = '1';
            this.hideSwipeHints(card);
        };
        
        // Add event listeners
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('touchstart', handleStart, { passive: false });
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (card.matches(':hover') || card === document.activeElement) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.handleProfileAction(profile, 'pass', card);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.handleProfileAction(profile, 'like', card);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.handleProfileAction(profile, 'superlike', card);
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        this.showProfileDetail(profile);
                        break;
                }
            }
        });
    }
    
    showSwipeHints(card, deltaX, deltaY) {
        // Remove existing hints
        this.hideSwipeHints(card);
        
        let hintClass = '';
        let hintText = '';
        let hintIcon = '';
        
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                hintClass = 'swipe-hint-like';
                hintText = 'LIKE';
                hintIcon = 'fas fa-heart';
            } else {
                hintClass = 'swipe-hint-pass';
                hintText = 'PASS';
                hintIcon = 'fas fa-times';
            }
        } else if (deltaY < -50) {
            hintClass = 'swipe-hint-superlike';
            hintText = 'SUPER LIKE';
            hintIcon = 'fas fa-star';
        }
        
        if (hintClass) {
            const hint = document.createElement('div');
            hint.className = `swipe-hint ${hintClass}`;
            hint.innerHTML = `
                <i class="${hintIcon}"></i>
                <span>${hintText}</span>
            `;
            card.appendChild(hint);
        }
    }
    
    hideSwipeHints(card) {
        const hints = card.querySelectorAll('.swipe-hint');
        hints.forEach(hint => hint.remove());
    }
    
    async handleProfileAction(profile, action, card) {
        // Disable buttons to prevent double clicks
        const buttons = card.querySelectorAll('.action-btn');
        buttons.forEach(btn => btn.disabled = true);
        
        // Add animation class
        card.classList.add(`swipe-${action}`);
        
        try {
            const response = await fetch('/discover/api/matching/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profileId: profile.id,
                    action: action
                })
            });
            
            const result = await response.json();
            
            if (result.match && action !== 'pass') {
                this.showMatchModal(profile, result);
            } else {
                // Remove card after animation
                setTimeout(() => {
                    card.remove();
                    this.removeProfileFromList(profile.id);
                    
                    // Load more if needed
                    if (this.shouldLoadMore()) {
                        this.loadMoreProfiles();
                    }
                }, 300);
            }
            
        } catch (error) {
            console.error('Error handling profile action:', error);
            // Re-enable buttons on error
            buttons.forEach(btn => btn.disabled = false);
            card.classList.remove(`swipe-${action}`);
            
            // Show error notification
            this.showNotification('Failed to process action. Please try again.', 'error');
        }
    }
    
    showMatchModal(profile, matchData) {
        const modalHTML = `
            <div class="match-modal-overlay">
                <div class="match-modal">
                    <div class="match-modal__header">
                        <h2>It's a Match! 🎉</h2>
                        <p>You and ${profile.name} have liked each other</p>
                    </div>
                    <div class="match-modal__profiles">
                        <div class="match-profile">
                            <div class="match-profile__image">
                                <img src="/static/img/avatars/default.jpg" alt="You">
                            </div>
                            <div class="match-profile__name">You</div>
                        </div>
                        <div class="match-heart">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="match-profile">
                            <div class="match-profile__image">
                                <img src="${profile.profilePicture}" alt="${profile.name}">
                            </div>
                            <div class="match-profile__name">${profile.name}</div>
                        </div>
                    </div>
                    <div class="match-modal__actions">
                        <button class="btn btn-outline" id="keep-swiping">Keep Discovering</button>
                        <button class="btn btn-primary" id="send-message">Send Message</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.match-modal-overlay');
        
        // Add event listeners
        modal.querySelector('#keep-swiping').addEventListener('click', () => {
            modal.remove();
            // Remove the matched profile card
            const card = document.querySelector(`[data-profile-id="${profile.id}"]`);
            if (card) card.remove();
            this.removeProfileFromList(profile.id);
        });
        
        modal.querySelector('#send-message').addEventListener('click', () => {
            window.location.href = `/chat/${matchData.conversationId || profile.id}`;
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    truncateBio(bio, maxLength) {
        if (!bio) return 'No bio available';
        return bio.length > maxLength ? bio.substring(0, maxLength) + '...' : bio;
    }
    
    removeProfileFromList(profileId) {
        this.profiles = this.profiles.filter(p => p.id !== profileId);
    }
    
    showLoading() {
        if (!this.discoveryContainer) return;
        
        this.discoveryContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Finding perfect matches for you...</p>
            </div>
        `;
    }
    
    clearLoadingState() {
        const loadingContainer = this.discoveryContainer?.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }
    
    showNoProfiles() {
        this.discoveryContainer.innerHTML = `
            <div class="no-profiles">
                <div class="no-profiles__icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No more profiles found</h3>
                <p>Try adjusting your filters or check back later for new members!</p>
                <button class="btn btn-primary" onclick="discoverManager.resetAndReload()">
                    Adjust Filters
                </button>
            </div>
        `;
    }
    
    showError(message) {
        this.discoveryContainer.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="discoverManager.resetAndReload()">
                    Try Again
                </button>
            </div>
        `;
    }
    
    shouldLoadMore() {
        if (!this.hasMore || this.isLoading) return false;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        
        return scrollPosition >= documentHeight - 1000; // Load when 1000px from bottom
    }
    
    animateNewCards(container, startIndex) {
        const newCards = Array.from(container.children).slice(startIndex);
        
        newCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    initializeFilters() {
        // Load saved filters from localStorage
        const savedFilters = localStorage.getItem('discoverFilters');
        if (savedFilters) {
            this.filters = { ...this.filters, ...JSON.parse(savedFilters) };
        }
        
        this.updateFilterUI();
    }
    
    updateFilterUI() {
        // Update range sliders
        if (this.ageMinSlider) this.ageMinSlider.value = this.filters.ageRange[0];
        if (this.ageMaxSlider) this.ageMaxSlider.value = this.filters.ageRange[1];
        if (this.distanceSlider) this.distanceSlider.value = this.filters.distance;
        
        // Update displays
        if (this.ageMinDisplay) this.ageMinDisplay.textContent = this.filters.ageRange[0];
        if (this.ageMaxDisplay) this.ageMaxDisplay.textContent = this.filters.ageRange[1];
        if (this.distanceDisplay) this.distanceDisplay.textContent = this.filters.distance;
        
        // Update filter pills
        this.updateFilterPills();
    }
    
    updateAgeRange() {
        const minVal = parseInt(this.ageMinSlider.value);
        const maxVal = parseInt(this.ageMaxSlider.value);
        
        // Ensure min is not greater than max
        if (minVal > maxVal - 1) {
            this.ageMinSlider.value = maxVal - 1;
            return;
        }
        
        if (maxVal < minVal + 1) {
            this.ageMaxSlider.value = minVal + 1;
            return;
        }
        
        this.ageMinDisplay.textContent = this.ageMinSlider.value;
        this.ageMaxDisplay.textContent = this.ageMaxSlider.value;
    }
    
    updateDistance() {
        this.distanceDisplay.textContent = this.distanceSlider.value;
    }
    
    setupInterestTags() {
        const interestTags = document.querySelectorAll('.interest-tag');
        interestTags.forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('selected');
            });
        });
    }
    
    setupFilterPillRemoval() {
        if (!this.filterPills) return;
        
        this.filterPills.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-times')) {
                const pill = e.target.closest('.filter-pill');
                if (pill) {
                    pill.remove();
                    // Here you could also reset the corresponding filter
                }
            }
        });
    }
    
    applyFilters() {
        // Collect filter values
        const genderPreference = document.querySelector('input[name="genderPreference"]:checked')?.value || 'all';
        const ageMin = parseInt(this.ageMinSlider?.value || 18);
        const ageMax = parseInt(this.ageMaxSlider?.value || 40);
        const distance = parseInt(this.distanceSlider?.value || 50);
        const relationshipType = document.querySelector('input[name="relationshipType"]:checked')?.value || 'any';
        const selectedInterests = Array.from(document.querySelectorAll('.interest-tag.selected')).map(tag => tag.textContent);
        
        // Update filters
        this.filters = {
            genderPreference,
            ageRange: [ageMin, ageMax],
            distance,
            relationshipType,
            interests: selectedInterests
        };
        
        // Save to localStorage
        localStorage.setItem('discoverFilters', JSON.stringify(this.filters));
        
        // Update UI
        this.updateFilterPills();
        
        // Close modal
        if (this.filterModal) {
            this.filterModal.style.display = 'none';
        }
        
        // Reload profiles with new filters
        this.resetAndReload();
    }
    
    updateFilterPills() {
        if (!this.filterPills) return;
        
        this.filterPills.innerHTML = `
            <span class="filter-pill">
                Age: ${this.filters.ageRange[0]}-${this.filters.ageRange[1]} 
                <i class="fas fa-times"></i>
            </span>
            <span class="filter-pill">
                Distance: ${this.filters.distance}km 
                <i class="fas fa-times"></i>
            </span>
        `;
    }
    
    resetAndReload() {
        this.currentOffset = 0;
        this.profiles = [];
        this.hasMore = true;
        this.loadProfiles();
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showProfileDetail(profile) {
        // Create profile detail modal
        const modalHTML = `
            <div class="profile-detail-overlay">
                <div class="profile-detail-modal">
                    <button class="profile-detail__close">&times;</button>
                    <div class="profile-detail__content">
                        <div class="profile-detail__image">
                            <img src="${profile.profilePicture}" alt="${profile.name}">
                        </div>
                        <div class="profile-detail__info">
                            <h2>${profile.name}, ${profile.age}</h2>
                            <p class="occupation">${profile.occupation}</p>
                            <p class="distance"><i class="fas fa-map-marker-alt"></i> ${profile.distance}km away</p>
                            <div class="bio">
                                <h3>About</h3>
                                <p>${profile.bio}</p>
                            </div>
                            <div class="interests">
                                <h3>Interests</h3>
                                <div class="interest-tags">
                                    ${profile.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="profile-detail__actions">
                        <button class="action-btn action-btn--pass" data-action="pass">
                            <i class="fas fa-times"></i> Pass
                        </button>
                        <button class="action-btn action-btn--like" data-action="like">
                            <i class="fas fa-heart"></i> Like
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.profile-detail-overlay');
        
        // Add event listeners
        modal.querySelector('.profile-detail__close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Handle actions
        modal.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.dataset.action;
                const originalCard = document.querySelector(`[data-profile-id="${profile.id}"]`);
                this.handleProfileAction(profile, action, originalCard);
                modal.remove();
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on discover page
    if (window.location.pathname.includes('/discover') && !window.location.pathname.includes('/search')) {
        console.log('Initializing Discover page...');
        try {
            window.discoverManager = new DiscoverManager();
        } catch (error) {
            console.error('Failed to initialize Discover Manager:', error);
            // Show error message to user instead of crashing
            const container = document.getElementById('discovery-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <h3>Failed to load discover page</h3>
                        <p>There was an error initializing the page. Please refresh and try again.</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
                    </div>
                `;
            }
        }
    }
});

// Export for global access
window.DiscoverManager = DiscoverManager;