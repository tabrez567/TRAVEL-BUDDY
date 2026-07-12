/**
 * Match.js - Handles all match-related functionality
 * Including swipe cards, search filters, and recommendations
 */

class SwipeCards {
    constructor() {
        this.container = document.getElementById('swipe-cards');
        this.cards = Array.from(document.querySelectorAll('.swipe-card'));
        this.currentCardIndex = 0;
        this.hammertime = null;
        this.btnPass = document.getElementById('btn-pass');
        this.btnSuperLike = document.getElementById('btn-superlike');
        this.btnLike = document.getElementById('btn-like');
        
        this.init();
    }
    
    init() {
        if (!this.container || this.cards.length === 0) return;
        
        // Initialize cards positioning
        this.cards.forEach((card, index) => {
            card.style.zIndex = this.cards.length - index;
            if (index > 0) {
                card.style.transform = `scale(${0.95 - (index * 0.05)}) translateY(-${index * 10}px)`;
                card.style.opacity = `${1 - (index * 0.2)}`;
            }
        });
        
        // Setup Hammer.js for touch gestures if available
        if (typeof Hammer !== 'undefined') {
            this.setupHammer();
        } else {
            console.warn('Hammer.js not loaded. Touch gestures will not work.');
        }
        
        // Setup button controls
        this.setupControls();
    }
    
    setupHammer() {
        const currentCard = this.cards[this.currentCardIndex];
        if (!currentCard) return;
        
        this.hammertime = new Hammer(currentCard);
        this.hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        
        this.hammertime.on('pan', (event) => {
            currentCard.classList.add('moving');
            
            // Calculate rotation based on horizontal movement
            const xMulti = event.deltaX / 80;
            const yMulti = event.deltaY / 80;
            const rotate = xMulti * 10; // Rotation degree
            
            // Apply transform
            currentCard.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px) rotate(${rotate}deg)`;
            
            // Change opacity/color based on direction
            const opacity = event.deltaX > 0 ? event.deltaX / 100 : -event.deltaX / 100;
            
            if (event.deltaX > 0) {
                // Swiping right - like
                currentCard.classList.add('swiping-right');
                currentCard.classList.remove('swiping-left', 'swiping-up');
            } else if (event.deltaX < 0) {
                // Swiping left - pass
                currentCard.classList.add('swiping-left');
                currentCard.classList.remove('swiping-right', 'swiping-up');
            } else if (event.deltaY < -30) {
                // Swiping up - super like
                currentCard.classList.add('swiping-up');
                currentCard.classList.remove('swiping-left', 'swiping-right');
            }
        });
        
        this.hammertime.on('panend', (event) => {
            currentCard.classList.remove('moving', 'swiping-right', 'swiping-left', 'swiping-up');
            
            const moveOutWidth = document.body.clientWidth;
            const keep = Math.abs(event.deltaX) < 80 && Math.abs(event.deltaY) < 80;
            
            if (keep) {
                // Reset card position
                currentCard.style.transform = '';
            } else {
                // Swipe card away
                const endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
                const toX = event.deltaX > 0 ? endX : -endX;
                const endY = Math.abs(event.velocityY) * moveOutWidth;
                const toY = event.deltaY < 0 ? -endY : endY;
                const xMulti = event.deltaX / 80;
                const yMulti = event.deltaY / 80;
                const rotate = xMulti * 10;
                
                // Move card out of screen
                currentCard.style.transform = `translate(${toX}px, ${toY}px) rotate(${rotate}deg)`;
                currentCard.style.opacity = '0';
                
                // Handle swipe action
                if (event.deltaX > 0) {
                    this.handleLike();
                } else if (event.deltaX < 0) {
                    this.handlePass();
                } else if (event.deltaY < -30) {
                    this.handleSuperLike();
                }
                
                // Move to next card
                setTimeout(() => this.nextCard(), 300);
            }
        });
    }
    
    setupControls() {
        if (this.btnPass) {
            this.btnPass.addEventListener('click', () => {
                this.addButtonFeedback(this.btnPass);
                this.handlePass();
                this.animateSwipe('left');
            });
        }
        
        if (this.btnSuperLike) {
            this.btnSuperLike.addEventListener('click', () => {
                this.addButtonFeedback(this.btnSuperLike);
                this.handleSuperLike();
                this.animateSwipe('up');
            });
        }
        
        if (this.btnLike) {
            this.btnLike.addEventListener('click', () => {
                this.addButtonFeedback(this.btnLike);
                this.handleLike();
                this.animateSwipe('right');
            });
        }
    }
    
    addButtonFeedback(button) {
        // Add visual feedback when button is clicked
        button.classList.add('button-clicked');
        
        // Play haptic feedback if supported
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        
        // Remove the class after animation completes
        setTimeout(() => {
            button.classList.remove('button-clicked');
        }, 300);
    }
    
    animateSwipe(direction) {
        const currentCard = this.cards[this.currentCardIndex];
        if (!currentCard) return;
        
        switch (direction) {
            case 'left':
                currentCard.classList.add('swiped-left');
                break;
            case 'right':
                currentCard.classList.add('swiped-right');
                break;
            case 'up':
                currentCard.classList.add('swiped-up');
                break;
        }
        
        setTimeout(() => this.nextCard(), 300);
    }
    
    nextCard() {
        // Remove current card
        const currentCard = this.cards[this.currentCardIndex];
        currentCard.remove();
        
        // Move to next card
        this.currentCardIndex++;
        
        // Update remaining cards
        if (this.currentCardIndex < this.cards.length) {
            this.cards.slice(this.currentCardIndex).forEach((card, index) => {
                card.style.transform = index === 0 ? '' : `scale(${0.95 - (index * 0.05)}) translateY(-${index * 10}px)`;
                card.style.opacity = index === 0 ? '1' : `${1 - (index * 0.2)}`;
                card.style.zIndex = this.cards.length - this.currentCardIndex - index;
            });
            
            // Setup new hammer instance for the new current card
            if (typeof Hammer !== 'undefined' && this.hammertime) {
                this.hammertime.destroy();
                this.setupHammer();
            }
        } else {
            // No more cards
            this.showEmptyState();
        }
    }
    
    handleLike() {
        const currentCard = this.cards[this.currentCardIndex];
        const userId = currentCard.dataset.userId;
        console.log(`Liked user ${userId}`);
        
        // Here you would typically send an API request to record the like
        // For now, we'll just simulate it
        this.sendAction('like', userId);
    }
    
    handleSuperLike() {
        const currentCard = this.cards[this.currentCardIndex];
        const userId = currentCard.dataset.userId;
        console.log(`Super liked user ${userId}`);
        
        // Update super like count
        const superLikeCount = document.querySelector('.superlike-count');
        if (superLikeCount) {
            const countText = superLikeCount.textContent;
            const count = parseInt(countText.match(/\d+/)[0]);
            if (count > 0) {
                superLikeCount.innerHTML = `<i class="fas fa-star"></i> ${count - 1} Super Likes remaining`;
            }
        }
        
        this.sendAction('superlike', userId);
    }
    
    handlePass() {
        const currentCard = this.cards[this.currentCardIndex];
        const userId = currentCard.dataset.userId;
        console.log(`Passed user ${userId}`);
        
        this.sendAction('pass', userId);
    }
    
    sendAction(action, userId) {
        // Simulate API call
        setTimeout(() => {
            console.log(`API: Sent ${action} action for user ${userId}`);
            
            // If it's a match, show match modal
            if (action === 'like' && Math.random() > 0.7) {
                this.showMatchModal(userId);
            }
        }, 300);
    }
    
    showMatchModal(userId) {
        // Get user name from card
        const currentCard = this.cards[this.currentCardIndex];
        const userName = currentCard.querySelector('h2').textContent.split(',')[0];
        
        // Update modal with user name
        const matchUserName = document.getElementById('match-user-name');
        if (matchUserName) {
            matchUserName.textContent = userName;
        }
        
        // Show modal
        const matchModal = document.getElementById('match-modal');
        if (matchModal) {
            matchModal.classList.add('active');
            
            // Add event listener to close button
            const closeBtn = matchModal.querySelector('[data-dismiss="modal"]');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    matchModal.classList.remove('active');
                });
            }
        }
    }
    
    showEmptyState() {
        const emptyState = document.getElementById('empty-cards');
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize swipe cards if on swipe page
    if (document.getElementById('swipe-cards')) {
        new SwipeCards();
    }
    
    // Initialize other match-related functionality
    initializeMatchFunctionality();
});

function initializeMatchFunctionality() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Handle profile info buttons
    const infoButtons = document.querySelectorAll('.btn-info');
    infoButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent card swipe
            const card = this.closest('.swipe-card');
            const userId = card.dataset.userId;
            
            // Toggle card details visibility
            const cardDetails = card.querySelector('.card-details');
            if (cardDetails) {
                cardDetails.classList.toggle('expanded');
            }
        });
    });
}