/**
 * Advanced Search Functionality
 * Handles filter interactions, API calls, and dynamic content loading
 */

class AdvancedSearch {
    constructor() {
        this.filters = {};
        this.interests = [];
        this.availableInterests = [];
        this.results = [];
        this.offset = 0;
        this.limit = 12;
        this.hasMore = true;
        this.isLoading = false;
        this.sortBy = 'match';
        
        this.init();
    }
    
    init() {
        // Initialize DOM elements
        this.initDomElements();
        
        // Load saved filters
        this.loadSavedFilters();
        
        // Load available interests
        this.loadAvailableInterests();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Initialize range sliders
        this.initRangeSliders();
    }
    
    initDomElements() {
        // Filter elements
        this.genderOptions = document.querySelectorAll('input[name="gender"]');
        this.ageMinSlider = document.getElementById('age-min');
        this.ageMaxSlider = document.getElementById('age-max');
        this.ageMinValue = document.getElementById('age-min-value');
        this.ageMaxValue = document.getElementById('age-max-value');
        this.distanceSlider = document.getElementById('distance');
        this.distanceValue = document.getElementById('distance-value');
        this.relationshipOptions = document.querySelectorAll('input[name="relationshipType"]');
        this.verifiedOnly = document.getElementById('verified-only');
        
        // Interest elements
        this.interestSearch = document.getElementById('interest-search');
        this.addInterestBtn = document.getElementById('add-interest');
        this.selectedInterestsContainer = document.getElementById('selected-interests');
        this.interestsDropdown = document.getElementById('interests-dropdown');
        
        // Action buttons
        this.resetFiltersBtn = document.getElementById('reset-filters');
        this.applyFiltersBtn = document.getElementById('apply-filters');
        
        // Results elements
        this.resultsGrid = document.getElementById('results-grid');
        this.resultsCount = document.getElementById('results-count');
        this.sortBySelect = document.getElementById('sort-by');
        this.loadMoreBtn = document.getElementById('load-more');
    }
    
    loadSavedFilters() {
        // Show loading state
        this.showLoading();
        
        // Fetch saved filters from API
        fetch('/search/api/filters')
            .then(response => response.json())
            .then(data => {
                this.filters = data;
                this.updateFilterUI();
                
                // Load initial results
                this.loadResults();
            })
            .catch(error => {
                console.error('Error loading filters:', error);
                
                // Set default filters
                this.setDefaultFilters();
                
                // Load initial results
                this.loadResults();
            });
    }
    
    setDefaultFilters() {
        this.filters = {
            gender: {
                men: false,
                women: true,
                nonbinary: false
            },
            age: {
                min: 18,
                max: 45
            },
            distance: 50,
            relationshipType: {
                relationship: true,
                casual: false,
                friendship: false
            },
            verifiedOnly: false,
            interests: []
        };
        
        this.updateFilterUI();
    }
    
    updateFilterUI() {
        // Update gender checkboxes
        this.genderOptions.forEach(option => {
            option.checked = this.filters.gender[option.value];
        });
        
        // Update age sliders
        this.ageMinSlider.value = this.filters.age.min;
        this.ageMaxSlider.value = this.filters.age.max;
        this.ageMinValue.textContent = this.filters.age.min;
        this.ageMaxValue.textContent = this.filters.age.max;
        this.updateRangeSliderProgress(this.ageMinSlider, this.ageMaxSlider);
        
        // Update distance slider
        this.distanceSlider.value = this.filters.distance;
        this.distanceValue.textContent = this.filters.distance;
        
        // Update relationship checkboxes
        this.relationshipOptions.forEach(option => {
            option.checked = this.filters.relationshipType[option.value];
        });
        
        // Update verified only toggle
        this.verifiedOnly.checked = this.filters.verifiedOnly;
        
        // Update selected interests
        this.selectedInterestsContainer.innerHTML = '';
        this.interests = this.filters.interests || [];
        this.interests.forEach(interest => {
            this.addInterestTag(interest);
        });
    }
    
    loadAvailableInterests() {
        fetch('/search/api/interests')
            .then(response => response.json())
            .then(data => {
                this.availableInterests = data.interests;
                this.updateInterestsDropdown();
            })
            .catch(error => {
                console.error('Error loading interests:', error);
            });
    }
    
    updateInterestsDropdown(filter = '') {
        this.interestsDropdown.innerHTML = '';
        
        const filteredInterests = this.availableInterests.filter(interest => 
            interest.toLowerCase().includes(filter.toLowerCase()) && 
            !this.interests.includes(interest)
        );
        
        filteredInterests.forEach(interest => {
            const option = document.createElement('div');
            option.className = 'interest-option';
            option.textContent = interest;
            option.addEventListener('click', () => {
                this.addInterest(interest);
                this.interestsDropdown.classList.remove('show');
                this.interestSearch.value = '';
            });
            
            this.interestsDropdown.appendChild(option);
        });
    }
    
    addInterest(interest) {
        if (!this.interests.includes(interest)) {
            this.interests.push(interest);
            this.addInterestTag(interest);
        }
    }
    
    addInterestTag(interest) {
        const tag = document.createElement('div');
        tag.className = 'interest-tag';
        tag.innerHTML = `
            ${interest}
            <span class="remove-interest"><i class="fas fa-times"></i></span>
        `;
        
        tag.querySelector('.remove-interest').addEventListener('click', () => {
            this.removeInterest(interest);
        });
        
        this.selectedInterestsContainer.appendChild(tag);
    }
    
    removeInterest(interest) {
        this.interests = this.interests.filter(i => i !== interest);
        this.updateInterestsDropdown();
        this.updateSelectedInterests();
    }
    
    updateSelectedInterests() {
        this.selectedInterestsContainer.innerHTML = '';
        this.interests.forEach(interest => {
            this.addInterestTag(interest);
        });
    }
    
    initEventListeners() {
        // Gender options
        this.genderOptions.forEach(option => {
            option.addEventListener('change', () => {
                this.filters.gender[option.value] = option.checked;
            });
        });
        
        // Age sliders
        this.ageMinSlider.addEventListener('input', () => {
            const minVal = parseInt(this.ageMinSlider.value);
            const maxVal = parseInt(this.ageMaxSlider.value);
            
            if (minVal > maxVal) {
                this.ageMinSlider.value = maxVal;
                this.filters.age.min = maxVal;
            } else {
                this.filters.age.min = minVal;
            }
            
            this.ageMinValue.textContent = this.ageMinSlider.value;
            this.updateRangeSliderProgress(this.ageMinSlider, this.ageMaxSlider);
        });
        
        this.ageMaxSlider.addEventListener('input', () => {
            const minVal = parseInt(this.ageMinSlider.value);
            const maxVal = parseInt(this.ageMaxSlider.value);
            
            if (maxVal < minVal) {
                this.ageMaxSlider.value = minVal;
                this.filters.age.max = minVal;
            } else {
                this.filters.age.max = maxVal;
            }
            
            this.ageMaxValue.textContent = this.ageMaxSlider.value;
            this.updateRangeSliderProgress(this.ageMinSlider, this.ageMaxSlider);
        });
        
        // Distance slider
        this.distanceSlider.addEventListener('input', () => {
            this.filters.distance = parseInt(this.distanceSlider.value);
            this.distanceValue.textContent = this.distanceSlider.value;
        });
        
        // Relationship options
        this.relationshipOptions.forEach(option => {
            option.addEventListener('change', () => {
                this.filters.relationshipType[option.value] = option.checked;
            });
        });
        
        // Verified only toggle
        this.verifiedOnly.addEventListener('change', () => {
            this.filters.verifiedOnly = this.verifiedOnly.checked;
        });
        
        // Interest search
        this.interestSearch.addEventListener('focus', () => {
            this.interestsDropdown.classList.add('show');
            this.updateInterestsDropdown(this.interestSearch.value);
        });
        
        this.interestSearch.addEventListener('input', () => {
            this.updateInterestsDropdown(this.interestSearch.value);
            this.interestsDropdown.classList.add('show');
        });
        
        this.interestSearch.addEventListener('blur', (e) => {
            // Delay hiding dropdown to allow for click events
            setTimeout(() => {
                this.interestsDropdown.classList.remove('show');
            }, 200);
        });
        
        // Add interest button
        this.addInterestBtn.addEventListener('click', () => {
            const interest = this.interestSearch.value.trim();
            if (interest && !this.interests.includes(interest)) {
                this.addInterest(interest);
                this.interestSearch.value = '';
                this.updateInterestsDropdown();
            }
        });
        
        // Reset filters button
        this.resetFiltersBtn.addEventListener('click', () => {
            this.setDefaultFilters();
        });
        
        // Apply filters button
        this.applyFiltersBtn.addEventListener('click', () => {
            this.filters.interests = this.interests;
            this.saveFilters();
            this.offset = 0;
            this.results = [];
            this.loadResults(true);
        });
        
        // Sort by select
        this.sortBySelect.addEventListener('change', () => {
            this.sortBy = this.sortBySelect.value;
            this.sortResults();
            this.renderResults();
        });
        
        // Load more button
        this.loadMoreBtn.addEventListener('click', () => {
            this.loadMoreResults();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.interests-container')) {
                this.interestsDropdown.classList.remove('show');
            }
        });
    }
    
    initRangeSliders() {
        // Initialize age range slider progress
        this.updateRangeSliderProgress(this.ageMinSlider, this.ageMaxSlider);
        
        // Initialize single range sliders
        const singleSliders = document.querySelectorAll('input[type="range"]:not(#age-min):not(#age-max)');
        singleSliders.forEach(slider => {
            const track = slider.nextElementSibling;
            this.updateSingleRangeSliderProgress(slider, track);
            
            slider.addEventListener('input', () => {
                this.updateSingleRangeSliderProgress(slider, track);
            });
        });
    }
    
    updateRangeSliderProgress(minSlider, maxSlider) {
        const parent = minSlider.parentElement;
        const progress = parent.querySelector('.range-slider-progress');
        
        const minVal = parseInt(minSlider.value);
        const maxVal = parseInt(maxSlider.value);
        const minPos = ((minVal - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
        const maxPos = ((maxVal - maxSlider.min) / (maxSlider.max - maxSlider.min)) * 100;
        
        progress.style.left = `${minPos}%`;
        progress.style.width = `${maxPos - minPos}%`;
    }
    
    updateSingleRangeSliderProgress(slider, track) {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        track.style.width = `${value}%`;
    }
    
    saveFilters() {
        fetch('/search/api/filters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.filters)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Filters saved successfully');
        })
        .catch(error => {
            console.error('Error saving filters:', error);
        });
    }
    
    loadResults(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        if (reset) {
            this.showLoading();
        }
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('offset', this.offset);
        params.append('limit', this.limit);
        params.append('men', this.filters.gender.men);
        params.append('women', this.filters.gender.women);
        params.append('nonbinary', this.filters.gender.nonbinary);
        params.append('minAge', this.filters.age.min);
        params.append('maxAge', this.filters.age.max);
        params.append('distance', this.filters.distance);
        params.append('relationship', this.filters.relationshipType.relationship);
        params.append('casual', this.filters.relationshipType.casual);
        params.append('friendship', this.filters.relationshipType.friendship);
        params.append('verified', this.filters.verifiedOnly);
        
        this.interests.forEach(interest => {
            params.append('interests', interest);
        });
        
        // Fetch results from API
        fetch(`/search/api/results?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (reset) {
                    this.results = data.profiles;
                } else {
                    this.results = [...this.results, ...data.profiles];
                }
                
                this.hasMore = data.hasMore;
                this.offset += data.profiles.length;
                
                // Sort results
                this.sortResults();
                
                // Render results
                this.renderResults();
                
                // Update results count
                this.resultsCount.textContent = this.results.length;
                
                // Show/hide load more button
                this.loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
                
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading results:', error);
                this.isLoading = false;
                
                // Show error message
                this.showError('Failed to load results. Please try again.');
            });
    }
    
    loadMoreResults() {
        this.loadResults();
    }
    
    sortResults() {
        switch (this.sortBy) {
            case 'match':
                this.results.sort((a, b) => b.matchPercentage - a.matchPercentage);
                break;
            case 'distance':
                this.results.sort((a, b) => a.distance - b.distance);
                break;
            case 'activity':
                this.results.sort((a, b) => b.activityScore - a.activityScore);
                break;
            case 'newest':
                // In a real app, would sort by join date or last active
                this.results.sort((a, b) => b.id - a.id);
                break;
        }
    }
    
    renderResults() {
        // Clear loading state
        this.resultsGrid.innerHTML = '';
        
        if (this.results.length === 0) {
            this.showNoResults();
            return;
        }
        
        // Render each profile card
        this.results.forEach(profile => {
            const card = this.createProfileCard(profile);
            this.resultsGrid.appendChild(card);
        });
        
        // Initialize animations
        if (window.AnimationManager) {
            AnimationManager.initProfileCards();
        }
    }
    
    createProfileCard(profile) {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.profileId = profile.id;
        
        // Format interests as tags
        const interestTags = profile.interests.map(interest => 
            `<span class="profile-tag">${interest}</span>`
        ).join('');
        
        card.innerHTML = `
            <div class="profile-card-inner">
                <div class="profile-match">${profile.matchPercentage}% Match</div>
                ${profile.verified ? '<div class="profile-verified"><i class="fas fa-check-circle"></i></div>' : ''}
                <div class="profile-image-container">
                    <img src="${profile.profilePicture}" alt="${profile.name}" class="profile-image">
                </div>
                <div class="profile-content">
                    <div class="profile-name-info">
                        <h3 class="profile-name">${profile.name}, ${profile.age}</h3>
                        <div class="profile-distance">${profile.distance} km away</div>
                    </div>
                    <div class="profile-occupation">${profile.occupation}</div>
                    <div class="profile-bio">${profile.bio}</div>
                    <div class="profile-tags">
                        ${interestTags}
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="btn-circle btn-pass" data-action="pass">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn-circle btn-like" data-action="like">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners for like/pass buttons
        const likeBtn = card.querySelector('.btn-like');
        const passBtn = card.querySelector('.btn-pass');
        
        likeBtn.addEventListener('click', () => {
            this.handleProfileAction(profile.id, 'like', card);
        });
        
        passBtn.addEventListener('click', () => {
            this.handleProfileAction(profile.id, 'pass', card);
        });
        
        return card;
    }
    
    handleProfileAction(profileId, action, card) {
        // Send action to API
        fetch('/api/matching/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profile_id: profileId,
                action: action
            })
        })
        .then(response => response.json())
        .then(data => {
            // Handle match
            if (data.match && action === 'like') {
                this.showMatchAnimation(profileId);
            } else {
                // Remove card with animation
                card.classList.add(action === 'like' ? 'swipe-right' : 'swipe-left');
                
                setTimeout(() => {
                    card.remove();
                    
                    // Remove from results
                    this.results = this.results.filter(profile => profile.id !== profileId);
                    
                    // Update results count
                    this.resultsCount.textContent = this.results.length;
                    
                    // Check if we need to load more
                    if (this.results.length < 5 && this.hasMore) {
                        this.loadMoreResults();
                    }
                    
                    // Show no results if empty
                    if (this.results.length === 0) {
                        this.showNoResults();
                    }
                }, 300);
            }
        })
        .catch(error => {
            console.error('Error sending action:', error);
        });
    }
    
    showMatchAnimation(profileId) {
        // Find the profile
        const profile = this.results.find(p => p.id === profileId);
        if (!profile) return;
        
        // Create match overlay
        const overlay = document.createElement('div');
        overlay.className = 'match-overlay';
        overlay.innerHTML = `
            <div class="match-content">
                <div class="match-header">
                    <h2>It's a Match!</h2>
                    <p>You and ${profile.name} have liked each other</p>
                </div>
                <div class="match-profiles">
                    <div class="match-profile">
                        <div class="match-profile-image">
                            <img src="/static/images/default-avatar.jpg" alt="You">
                        </div>
                        <div class="match-profile-name">You</div>
                    </div>
                    <div class="match-heart">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="match-profile">
                        <div class="match-profile-image">
                            <img src="${profile.profilePicture}" alt="${profile.name}">
                        </div>
                        <div class="match-profile-name">${profile.name}</div>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn-primary" id="send-message">Send Message</button>
                    <button class="btn-outline" id="keep-searching">Keep Searching</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add animation class after a small delay
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        // Add event listeners
        overlay.querySelector('#send-message').addEventListener('click', () => {
            window.location.href = `/chat/${profileId}`;
        });
        
        overlay.querySelector('#keep-searching').addEventListener('click', () => {
            overlay.classList.remove('show');
            
            setTimeout(() => {
                overlay.remove();
                
                // Remove from results
                this.results = this.results.filter(profile => profile.id !== profileId);
                
                // Update results count
                this.resultsCount.textContent = this.results.length;
                
                // Remove card
                const card = document.querySelector(`.profile-card[data-profile-id="${profileId}"]`);
                if (card) card.remove();
                
                // Check if we need to load more
                if (this.results.length < 5 && this.hasMore) {
                    this.loadMoreResults();
                }
                
                // Show no results if empty
                if (this.results.length === 0) {
                    this.showNoResults();
                }
            }, 300);
        });
    }
    
    showLoading() {
        this.resultsGrid.innerHTML = `
            <div class="loading-results">
                <div class="loading-spinner"></div>
                <p>Finding your matches...</p>
            </div>
        `;
    }
    
    showNoResults() {
        this.resultsGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No matches found</h3>
                <p>Try adjusting your filters to see more people</p>
            </div>
        `;
    }
    
    showError(message) {
        this.resultsGrid.innerHTML = `
            <div class="error-results">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn-primary retry-btn">Try Again</button>
            </div>
        `;
        
        this.resultsGrid.querySelector('.retry-btn').addEventListener('click', () => {
            this.offset = 0;
            this.loadResults(true);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const search = new AdvancedSearch();
    
    // Make available globally
    window.AdvancedSearch = search;
});