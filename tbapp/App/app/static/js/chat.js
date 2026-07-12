// WhatsApp-style Chat Application

class WhatsAppChatApp {
    constructor() {
        this.socket = null;
        this.currentConversation = null;
        this.conversations = [];
        this.isTyping = false;
        this.typingTimeout = null;
        this.currentUser = null;
        this.messageQueue = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // DOM Elements
        this.chatWelcome = document.getElementById('chat-welcome');
        this.activeChat = document.getElementById('active-chat');
        this.conversationsList = document.getElementById('conversations-list');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.connectionStatus = document.getElementById('connection-status');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectSocket();
        this.loadConversations();
    }

    setupEventListeners() {
        // Message input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('chat-sidebar');

        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // New chat modal
        const newChatBtn = document.getElementById('new-chat-btn');
        const newChatModal = document.getElementById('new-chat-modal');

        newChatBtn.addEventListener('click', () => {
            newChatModal.style.display = 'block';
        });

        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });

        // Search conversations
        const searchInput = document.getElementById('conversation-search');
        searchInput.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });
    }

    connectSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            console.log('Connected to chat server');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            console.log('Disconnected from chat server');
        });

        this.socket.on('message', (data) => {
            this.receiveMessage(data);
        });

        this.socket.on('typing', (data) => {
            this.showTypingIndicator(data.user);
        });

        this.socket.on('stop_typing', (data) => {
            this.hideTypingIndicator();
        });
    }

    updateConnectionStatus(connected) {
        const statusIcon = this.connectionStatus.querySelector('i');
        const statusText = this.connectionStatus.querySelector('span');

        if (connected) {
            statusIcon.style.color = '#25d366';
            statusText.textContent = 'Connected';
            this.sendButton.disabled = false;
        } else {
            statusIcon.style.color = '#ccc';
            statusText.textContent = 'Disconnected';
            this.sendButton.disabled = true;
        }
    }

    sendMessage() {
        if (!this.messageInput.value.trim() || !this.currentConversation) return;

        const messageText = this.messageInput.value.trim();
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        const messageData = {
            text: messageText,
            conversationId: this.currentConversation,
            timestamp: new Date().toISOString(),
            sender: window.currentUserID
        };

        // Add to UI immediately
        this.addMessageToUI(messageData, true);

        // Send via socket
        this.socket.emit('message', messageData);

        // Stop typing
        this.stopTyping();
    }

    receiveMessage(data) {
        if (data.conversationId === this.currentConversation) {
            this.addMessageToUI(data, false);
            this.scrollToBottom();
        }

        // Update conversation list
        this.updateConversationPreview(data.conversationId, data.text, data.timestamp);
    }

    addMessageToUI(message, isSent) {
        const messageGroup = document.createElement('div');
        messageGroup.className = `message-group ${isSent ? 'sent-group' : ''}`;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'message-sent' : 'message-received'}`;

        if (!isSent) {
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = `<img src="${this.getUserAvatar(message.sender)}" alt="">`;
            messageDiv.appendChild(avatar);
        }

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${this.escapeHtml(message.text)}</p>`;

        const meta = document.createElement('div');
        meta.className = 'message-meta';

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.formatTime(new Date(message.timestamp));
        meta.appendChild(time);

        if (isSent) {
            const status = document.createElement('span');
            status.className = 'message-status read';
            status.innerHTML = '<i class="fas fa-check-double"></i>';
            meta.appendChild(status);
        }

        bubble.appendChild(content);
        bubble.appendChild(meta);
        messageDiv.appendChild(bubble);

        if (isSent) {
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = `<img src="${window.currentUserProfilePicture || '/static/img/avatars/default.jpg'}" alt="You">`;
            messageDiv.appendChild(avatar);
        }

        messageGroup.appendChild(messageDiv);
        this.messagesContainer.appendChild(messageGroup);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTypingIndicator(user) {
        if (user !== this.currentConversation) return;
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    startTyping() {
        if (this.isTyping) return;

        this.isTyping = true;
        this.socket.emit('typing', { conversationId: this.currentConversation });
    }

    stopTyping() {
        if (!this.isTyping) return;

        this.isTyping = false;
        this.socket.emit('stop_typing', { conversationId: this.currentConversation });
    }

    loadConversations() {
        // Load conversations from backend
        fetch('/chat/conversations')
            .then(response => response.json())
            .then(data => {
                this.conversations = data;
                this.renderConversations();
            })
            .catch(error => {
                console.error('Error loading conversations:', error);
                // Show empty state
                this.showEmptyConversations();
            });
    }

    renderConversations() {
        this.conversationsList.innerHTML = '';

        if (this.conversations.length === 0) {
            this.showEmptyConversations();
            return;
        }

        this.conversations.forEach(conversation => {
            const item = this.createConversationItem(conversation);
            this.conversationsList.appendChild(item);
        });
    }

    createConversationItem(conversation) {
        const item = document.createElement('div');
        item.className = `conversation-item ${conversation.id === this.currentConversation ? 'active' : ''}`;
        item.dataset.conversationId = conversation.id;

        item.innerHTML = `
            <div class="conversation-avatar">
                <img src="${conversation.avatar || '/static/img/avatars/default.jpg'}" alt="${conversation.name}">
                <span class="status-indicator ${conversation.online ? 'online' : 'offline'}"></span>
            </div>
            <div class="conversation-info">
                <div class="conversation-header">
                    <h4>${conversation.name}</h4>
                    <span class="conversation-time">${this.formatConversationTime(conversation.lastMessageTime)}</span>
                </div>
                <div class="conversation-preview-wrapper">
                    <p class="conversation-preview">${conversation.lastMessage || 'No messages yet'}</p>
                    ${conversation.unreadCount > 0 ? `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
                </div>
            </div>
        `;

        item.addEventListener('click', () => this.openConversation(conversation.id));
        return item;
    }

    showEmptyConversations() {
        const empty = document.getElementById('conversations-empty');
        if (empty) empty.style.display = 'flex';
    }

    formatConversationTime(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });

        return date.toLocaleDateString();
    }

    openConversation(conversationId) {
        this.currentConversation = conversationId;

        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Show chat area
        this.chatWelcome.style.display = 'none';
        this.activeChat.style.display = 'flex';

        // Load conversation details
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            document.getElementById('chat-user-name').textContent = conversation.name;
            document.getElementById('chat-user-avatar').src = conversation.avatar || '/static/img/avatars/default.jpg';
            document.getElementById('user-status-text').textContent = conversation.online ? 'Online' : 'Offline';
        }

        // Load messages
        this.loadMessages(conversationId);

        // Close sidebar on mobile
        const sidebar = document.getElementById('chat-sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }

    loadMessages(conversationId) {
        this.messagesContainer.innerHTML = '';

        fetch(`/chat/messages/${conversationId}`)
            .then(response => response.json())
            .then(messages => {
                messages.forEach(message => {
                    this.addMessageToUI(message, message.sender === window.currentUserID);
                });
                this.scrollToBottom();
            })
            .catch(error => {
                console.error('Error loading messages:', error);
            });
    }

    updateConversationPreview(conversationId, message, timestamp) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.lastMessage = message;
            conversation.lastMessageTime = timestamp;
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;

            // Re-render conversations list
            this.renderConversations();
        }
    }

    filterConversations(query) {
        const items = this.conversationsList.querySelectorAll('.conversation-item');

        items.forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();

            if (name.includes(query.toLowerCase()) || preview.includes(query.toLowerCase())) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    getUserAvatar(userId) {
        // Return avatar URL for user
        return '/static/img/avatars/default.jpg';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new WhatsAppChatApp();
});
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    showTypingIndicator() {
        if (!this.chatMessages) return;
        
        const typingHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        this.chatMessages.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    simulateResponse() {
        const responses = [
            "That sounds great! When are you planning to travel?",
            "I've been to that destination before. The local cuisine is amazing!",
            "Have you checked the weather forecast for your trip?",
            "Don't forget to pack your travel adapter and comfortable shoes!",
            "I can share my travel itinerary with you if that helps."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        this.addMessageToUI({
            text: randomResponse,
            sender: 'other',
            timestamp: new Date().toISOString()
        });
    }
    
    showReactionPicker(button) {
        // Create and show reaction picker
        const picker = document.createElement('div');
        picker.className = 'reaction-picker';
        
        this.messageReactions.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.textContent = emoji;
            emojiBtn.addEventListener('click', () => {
                // Add reaction to message
                const messageContainer = button.closest('.message-container');
                if (messageContainer) {
                    let reactionContainer = messageContainer.querySelector('.message-reactions');
                    if (!reactionContainer) {
                        reactionContainer = document.createElement('div');
                        reactionContainer.className = 'message-reactions';
                        messageContainer.appendChild(reactionContainer);
                    }
                    
                    const reaction = document.createElement('span');
                    reaction.className = 'reaction';
                    reaction.textContent = emoji;
                    reactionContainer.appendChild(reaction);
                }
                
                // Remove picker
                picker.remove();
            });
            picker.appendChild(emojiBtn);
        });
        
        // Position and show picker
        const rect = button.getBoundingClientRect();
        picker.style.position = 'absolute';
        picker.style.top = `${rect.top - 40}px`;
        picker.style.left = `${rect.left}px`;
        
        document.body.appendChild(picker);
        
        // Close picker when clicking outside
        document.addEventListener('click', function closeReactions(e) {
            if (!picker.contains(e.target) && e.target !== button) {
                picker.remove();
                document.removeEventListener('click', closeReactions);
            }
        });
    }
    
    init() {
        this.initializeSocket();
        this.loadCurrentUser();
        this.setupEventListeners();
        this.loadConversations();
        this.setupEnhancedFeatures();
        this.setupThemeWatcher();
        this.loadUserPreferences();
        this.setupMobileMenu();
    }
    
    initializeSocket() {
        // Initialize Socket.IO connection
        this.socket = io({
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        this.setupSocketEvents();
    }
    
    loadCurrentUser() {
        // Get current user info from the page or global variable
        this.currentUser = {
            id: window.currentUserID || 1, // In a real app, this would come from the server
            name: window.currentUserName || 'You',
            profile_picture: window.currentUserProfilePicture || '/static/img/avatars/default.jpg'
        };
        
        // Debug: alert the current user ID
        alert('Current User ID: ' + this.currentUser.id);
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus(true);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus(false);
        });
        
        // Chat events
        this.socket.on('receive_message', (data) => {
            this.receiveMessage(data);
        });
        
        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data);
        });
        
        this.socket.on('message_read_receipt', (data) => {
            this.updateReadReceipt(data);
        });
        
        this.socket.on('user_connected', (data) => {
            this.updateUserStatus(data.user_id, true);
        });
        
        this.socket.on('user_disconnected', (data) => {
            this.updateUserStatus(data.user_id, false);
        });
        
        this.socket.on('message_delivered', (data) => {
            this.updateDeliveryStatus(data);
        });
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;
        
        if (connected) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'connection-status connected';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'connection-status disconnected';
        }
    }
    
    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.chat-sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && e.target !== mobileToggle) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }
    
    setupEnhancedFeatures() {
        this.addScrollToBottomButton();
        this.addSoundToggle();
        this.setupMessageReactions();
        this.addUnreadCountIndicator();
        this.setupKeyboardShortcuts();
        this.addConnectionIndicator();
        this.setupAutoResize();
        this.setupEmojiPicker();
        this.setupSearchFilters();
        this.setupCharacterCounter();
        this.setupConversationSwitching();
        this.setupMessageSending();
        this.setupNewChatModal();
        this.setupModals();
        this.setupTravelFeatures();
        this.setupVoiceRecording();
    }
    
    setupConversationSwitching() {
        // Toggle between welcome screen and active chat
        if (this.conversationItems) {
            this.conversationItems.forEach(item => {
                item.addEventListener('click', () => {
                    // Hide welcome screen and show active chat
                    if (this.chatWelcome) this.chatWelcome.style.display = 'none';
                    if (this.activeChat) this.activeChat.style.display = 'flex';
                    
                    // Update chat header with conversation info
                    const userName = item.querySelector('.conversation-header h4')?.textContent;
                    const userAvatar = item.querySelector('.conversation-avatar img')?.src;
                    
                    if (userName) document.querySelector('.user-details h3').textContent = userName;
                    if (userAvatar) document.querySelector('.user-avatar img').src = userAvatar;
                    
                    // Mark as read if unread
                    item.classList.remove('unread');
                    
                    // Scroll to bottom of messages
                    this.scrollToBottom();
                });
            });
        }
    }
    
    setupMessageSending() {
        // Send message functionality
        if (this.sendBtn && this.messageInput) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            this.messageInput.addEventListener('input', () => {
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
            });
        }
        
        // Setup reaction buttons
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle reaction menu (simplified for demo)
                this.showReactionPicker(btn);
            });
        });
        
        // Setup reply buttons
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.messageInput) {
                    const messageText = btn.closest('.message-container').querySelector('.message-bubble p')?.textContent;
                    if (messageText) {
                        this.messageInput.value = `Replying to: "${messageText.substring(0, 30)}..." \n`;
                        this.messageInput.focus();
                    }
                }
            });
        });
    }
        this.setupVoiceRecording();
        this.setupModals();
        this.setupTravelFeatures();
        this.setupThemeSync(); // Sync Messages nav with theme changes
    }
    
    setupThemeWatcher() {
        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.darkMode = this.detectDarkMode();
                    this.updateThemeElements();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    updateThemeElements() {
        // Update theme-specific elements
        console.log('Theme updated to:', this.darkMode ? 'dark' : 'light');
        this.updateMessageAnimations();
        this.updateMessagesNavItem();
    }

    setupThemeSync() {
        // Listen for theme changes and update Messages navigation item
        document.addEventListener('themeChange', () => {
            this.updateMessagesNavItem();
        });
        
        // Also watch for data-theme attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateMessagesNavItem();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    updateMessagesNavItem() {
        // Ensure Messages navigation item has proper styling when theme changes
        const messagesNavItem = document.querySelector('.nav-item.messages-active');
        if (messagesNavItem) {
            // Force a re-render by temporarily removing and re-adding the class
            messagesNavItem.classList.remove('messages-active');
            setTimeout(() => {
                messagesNavItem.classList.add('messages-active');
            }, 10);
        }
    }
    
    addScrollToBottomButton() {
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-bottom';
        scrollBtn.className = 'scroll-to-bottom-btn';
        scrollBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            font-size: 1.2rem;
        `;
        
        scrollBtn.addEventListener('click', () => {
            this.scrollToBottom(true);
            scrollBtn.style.transform = 'scale(1.2)';
            setTimeout(() => scrollBtn.style.transform = 'scale(1)', 200);
        });
        
        container.parentNode.appendChild(scrollBtn);
        
        // Show/hide based on scroll position
        container.addEventListener('scroll', () => {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            
            if (isNearBottom) {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.visibility = 'hidden';
                scrollBtn.style.transform = 'translateY(20px)';
            } else {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.visibility = 'visible';
                scrollBtn.style.transform = 'translateY(0)';
            }
        });
    }
    
    addSoundToggle() {
        const chatHeader = document.querySelector('.chat-header .chat-actions');
        if (!chatHeader) return;
        
        const soundBtn = document.createElement('button');
        soundBtn.className = 'chat-action sound-toggle';
        soundBtn.innerHTML = `<i class="fas fa-${this.soundEnabled ? 'volume-up' : 'volume-mute'}"></i>`;
        soundBtn.title = 'Toggle notification sounds';
        
        soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundBtn.innerHTML = `<i class="fas fa-${this.soundEnabled ? 'volume-up' : 'volume-mute'}"></i>`;
            localStorage.setItem('chatSoundEnabled', this.soundEnabled);
            
            // Visual feedback
            soundBtn.style.transform = 'rotate(15deg) scale(1.1)';
            setTimeout(() => soundBtn.style.transform = '', 200);
        });
        
        chatHeader.appendChild(soundBtn);
    }
    
    setupMessageReactions() {
        // Add CSS for reactions
        const reactionStyles = `
            .message-reactions {
                position: absolute;
                top: -30px;
                right: 15px;
                display: flex;
                gap: 8px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10;
            }
            
            .message:hover .message-reactions {
                opacity: 1;
                visibility: visible;
                transform: translateY(-5px);
            }
            
            .reaction-btn {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .reaction-btn:hover {
                transform: scale(1.3) rotate(15deg);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
            }
            
            .reaction-btn:active {
                transform: scale(0.9);
            }
        `;
        
        if (!document.getElementById('reaction-styles')) {
            const style = document.createElement('style');
            style.id = 'reaction-styles';
            style.textContent = reactionStyles;
            document.head.appendChild(style);
        }
    }
    
    addUnreadCountIndicator() {
        const sidebar = document.querySelector('.chat-sidebar');
        if (!sidebar) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'total-unread-indicator';
        indicator.className = 'total-unread-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4757, #ff3838);
            color: white;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 700;
            box-shadow: 0 3px 10px rgba(255, 71, 87, 0.4);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            animation: pulse 2s infinite;
        `;
        
        sidebar.appendChild(indicator);
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus message input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.target.closest('input, textarea')) {
                e.preventDefault();
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.focus();
                    messageInput.style.transform = 'scale(1.02)';
                    setTimeout(() => messageInput.style.transform = '', 200);
                }
            }
            
            // Escape to clear input or close modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal[style*="display: flex"]');
                if (activeModal) {
                    this.closeModal(activeModal);
                } else {
                    const messageInput = document.getElementById('message-input');
                    if (messageInput && messageInput === document.activeElement) {
                        messageInput.value = '';
                        messageInput.blur();
                    }
                }
            }
            
            // Arrow up to edit last message
            if (e.key === 'ArrowUp' && !e.target.value && e.target.id === 'message-input') {
                // TODO: Implement message editing
                this.editLastMessage();
            }
        });
    }
    
    addConnectionIndicator() {
        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'connection-indicator';
        indicator.className = 'connection-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 100;
        `;
        
        chatHeader.appendChild(indicator);
    }
    
    setupAutoResize() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;
        
        messageInput.addEventListener('input', () => {
            // Auto-resize textarea
            messageInput.style.height = 'auto';
            const newHeight = Math.min(messageInput.scrollHeight, 120);
            messageInput.style.height = newHeight + 'px';
            
            // Update container height
            const container = messageInput.closest('.message-input-form');
            if (container) {
                container.style.minHeight = (newHeight + 20) + 'px';
            }
        });
    }
    
    loadUserPreferences() {
        // Load saved preferences
        this.soundEnabled = localStorage.getItem('chatSoundEnabled') !== 'false';
        this.lastSeenTimestamp = localStorage.getItem('chatLastSeen');
    }
    
    playNotificationSound() {
        if (!this.soundEnabled) return;
        
        // Create audio context for better sound control
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }
    
    initializeSocket() {
        // Initialize Socket.IO connection
        this.socket = io({
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        this.setupSocketEvents();
    }
    
    loadCurrentUser() {
        // Get current user info from the page or global variable
        this.currentUser = {
            id: window.currentUserID || 1, // In a real app, this would come from the server
            name: window.currentUserName || 'You'
        };
    }
    
    setupEventListeners() {
        // Conversation list items
        document.addEventListener('click', (e) => {
            const conversationItem = e.target.closest('.conversation-item');
            if (conversationItem) {
                const userId = parseInt(conversationItem.dataset.userId);
                this.selectConversation(userId);
            }
        });
        
        // Enhanced input interactions
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.handleTyping();
                this.handleQuickActionsToggle();
            });
            
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                    // Allow shift+enter for new line
                    return;
                }
            });
            
            // Add focus/blur effects
            messageInput.addEventListener('focus', () => {
                const container = messageInput.closest('.message-input-container');
                if (container) {
                    container.style.transform = 'translateY(-2px)';
                    container.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                }
            });
            
            messageInput.addEventListener('blur', () => {
                const container = messageInput.closest('.message-input-container');
                if (container) {
                    container.style.transform = 'translateY(0)';
                    container.style.boxShadow = '';
                }
            });
        }
        
        // Send button
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // Search conversations
        const searchInput = document.getElementById('conversation-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterConversations(e.target.value);
            });
        }
        
        // Back to conversations (mobile)
        const backButton = document.getElementById('back-to-conversations');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showConversationsList();
            });
        }
        
        // New chat button
        const newChatButton = document.getElementById('new-chat-btn');
        if (newChatButton) {
            newChatButton.addEventListener('click', () => {
                this.openNewChatModal();
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });
        
        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
        
        // Enhanced quick actions
        document.addEventListener('click', (e) => {
            const quickAction = e.target.closest('.quick-action');
            if (quickAction) {
                const action = quickAction.dataset.action;
                this.handleQuickAction(action);
                
                // Visual feedback
                quickAction.style.transform = 'scale(1.2) rotate(15deg)';
                setTimeout(() => {
                    quickAction.style.transform = '';
                }, 300);
            }
        });
        
        // Enhanced emoji and attachment buttons
        const emojiBtn = document.querySelector('.emoji-btn');
        const attachmentBtn = document.querySelector('.attachment-btn');
        
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }
        
        if (attachmentBtn) {
            attachmentBtn.addEventListener('click', () => {
                this.toggleQuickActions();
            });
        }
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus(true);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus(false);
        });
        
        // Chat events
        this.socket.on('receive_message', (data) => {
            this.receiveMessage(data);
        });
        
        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data);
        });
        
        this.socket.on('message_read_receipt', (data) => {
            this.updateReadReceipt(data);
        });
        
        this.socket.on('user_connected', (data) => {
            this.updateUserStatus(data.user_id, true);
        });
        
        this.socket.on('user_disconnected', (data) => {
            this.updateUserStatus(data.user_id, false);
        });
        
        this.socket.on('message_delivered', (data) => {
            this.updateDeliveryStatus(data);
        });
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;
        
        if (connected) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'connection-status connected';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'connection-status disconnected';
        }
    }
    
    async loadConversations() {
        try {
            const response = await fetch('/chat/api/conversations');
            if (!response.ok) throw new Error('Failed to load conversations');
            
            this.conversations = await response.json();
            this.renderConversations();
            
            // Debug: alert the number of conversations
            alert('Loaded ' + this.conversations.length + ' conversations');
            
            // Hide empty state if we have conversations
            const emptyState = document.getElementById('conversations-empty');
            const conversationsList = document.getElementById('conversations-list');
            
            if (this.conversations.length > 0) {
                emptyState.style.display = 'none';
                conversationsList.style.display = 'block';
                
                // Select first conversation if none is selected
                if (!this.currentConversation && this.conversations.length > 0) {
                    this.selectConversation(this.conversations[0].user.id);
                }
            } else {
                emptyState.style.display = 'block';
                conversationsList.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            this.showError('Failed to load conversations');
        }
    }
    
    renderConversations() {
        const container = document.getElementById('conversations-list');
        if (!container) return;
        
        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item" data-user-id="${conv.user.id}">
                <div class="conversation-avatar">
                    <img src="${conv.user.profile_picture}" alt="${conv.user.name}">
                    <span class="status-indicator ${this.getUserStatus(conv.user.id)}"></span>
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <h4>${conv.user.name}</h4>
                        <span class="conversation-time">${this.formatTime(conv.last_message ? conv.last_message.created_at : '')}</span>
                    </div>
                    <div class="conversation-preview">
                        <p>${this.truncateMessage(conv.last_message ? conv.last_message.content : '')}</p>
                        ${conv.unread_count > 0 ? `
                            <span class="unread-badge">${conv.unread_count}</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click event listeners
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = parseInt(item.dataset.userId);
                this.selectConversation(userId);
            });
        });
    }
    
    async selectConversation(userId) {
        if (this.currentConversation === userId) return;
        
        this.currentConversation = userId;
        
        // Update UI to show selected conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.userId) === userId);
        });
        
        // Show chat interface, hide welcome screen
        document.getElementById('chat-welcome').style.display = 'none';
        document.getElementById('active-chat').style.display = 'flex';
        
        // Load messages for this conversation
        await this.loadMessages(userId);
        
        // Update chat header with user info
        this.updateChatHeader(userId);
        
        // Mark messages as read
        this.markMessagesAsRead(userId);
        
        // Join conversation room
        if (this.socket) {
            const conversation = this.conversations.find(c => c.user.id === userId);
            if (conversation) {
                this.socket.emit('join_conversation', {
                    conversation_id: conversation.conversation_id
                });
            }
        }
        
        // Hide sidebar on mobile
        if (window.innerWidth <= 768) {
            this.hideConversationsList();
        }
    }
    
    updateChatHeader(userId) {
        const conversation = this.conversations.find(c => c.user.id === userId);
        if (!conversation) return;
        
        const userNameElement = document.getElementById('chat-user-name');
        const userAvatarElement = document.getElementById('chat-user-avatar');
        const userStatusElement = document.getElementById('user-status');
        const userStatusTextElement = document.getElementById('user-status-text');
        
        if (userNameElement) userNameElement.textContent = conversation.user.name;
        if (userAvatarElement) {
            const img = userAvatarElement.querySelector('img');
            if (img) img.src = conversation.user.profile_picture;
        }
        if (userStatusElement) {
            userStatusElement.className = `status-indicator ${this.getUserStatus(userId)}`;
        }
        if (userStatusTextElement) {
            userStatusTextElement.textContent = this.getUserStatus(userId) === 'online' ? 'Online' : 'Offline';
        }
    }
    
    async loadMessages(userId) {
        try {
            const response = await fetch(`/chat/api/messages/${userId}`);
            if (!response.ok) throw new Error('Failed to load messages');
            
            const messages = await response.json();
            this.renderMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.showError('Failed to load messages');
        }
    }
    
    renderMessages(messages) {
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        // Debug: alert the number of messages
        alert('Rendering ' + messages.length + ' messages');
        
        // Group messages by date
        const groupedMessages = this.groupMessagesByDate(messages);
        
        container.innerHTML = Object.entries(groupedMessages).map(([date, dateMessages]) => `
            <div class="date-separator">
                <span>${this.formatDate(date)}</span>
            </div>
            ${dateMessages.map(msg => this.createMessageElement(msg)).join('')}
        `).join('');
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    createMessageElement(message) {
        const isSent = message.sender_id === this.currentUser.id;
        const messageClass = isSent ? 'message-sent' : 'message-received';
        const messageId = message.message_id || message.id;
        
        return `
            <div class="message-group ${isSent ? 'sent-group' : ''}">
                <div class="message ${messageClass}" data-message-id="${messageId}">
                    ${!isSent ? `
                        <div class="message-avatar">
                            <img src="${this.getUserAvatar(message.sender_id)}" alt="">
                        </div>
                    ` : ''}
                    <div class="message-bubble">
                        <div class="message-content">
                            <p>${this.escapeHtml(message.content)}</p>
                        </div>
                        <div class="message-meta">
                            <span class="message-time">${this.formatTime(message.timestamp || message.created_at)}</span>
                            ${isSent ? `
                                <span class="message-status ${message.is_read ? 'read' : 'sent'}">
                                    <i class="fas fa-${message.is_read ? 'check-double' : 'check'}"></i>
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    ${isSent ? `
                        <div class="message-avatar">
                            <img src="${this.getUserAvatar(this.currentUser.id)}" alt="You">
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    getUserAvatar(userId) {
        // Get user avatar from conversations or default
        const conversation = this.conversations.find(c => c.user.id === userId);
        if (conversation) {
            return conversation.user.profile_picture;
        }
        return `/static/img/avatars/${userId % 10 + 1}.jpg`;
    }
    
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }
    
    groupMessagesByDate(messages) {
        const groups = {};
        messages.forEach(message => {
            const date = new Date(message.timestamp || message.created_at).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        return groups;
    }
    
    truncateMessage(message, maxLength = 50) {
        if (!message) return '';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }
    
    getUserStatus(userId) {
        // Simple status logic - in a real app, this would come from server
        return Math.random() > 0.5 ? 'online' : 'offline';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }
    
    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput || !messageInput.value.trim() || !this.currentConversation) return;
        
        const message = messageInput.value.trim();
        const messageData = {
            content: message,
            receiver_id: this.currentConversation,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Add visual feedback to send button
            const sendButton = document.getElementById('send-button');
            if (sendButton) {
                sendButton.style.transform = 'scale(1.15)';
                setTimeout(() => {
                    sendButton.style.transform = '';
                }, 200);
            }
            
            // Clear input with animation
            messageInput.style.transition = 'opacity 0.2s';
            messageInput.style.opacity = '0.5';
            
            setTimeout(() => {
                // Add message to UI immediately for better UX
                this.addMessageToUI({
                    id: 'temp-' + Date.now(), // Temporary ID with prefix for animation detection
                    sender_id: this.currentUser.id,
                    receiver_id: this.currentConversation,
                    content: message,
                    timestamp: new Date().toISOString(),
                    is_read: false
                });
                
                // Clear input and restore opacity
                messageInput.value = '';
                messageInput.style.opacity = '1';
                
                // Send via Socket.IO
                if (this.socket) {
                    console.log('Sending message via Socket.IO:', message);
                    this.socket.emit('send_message', {
                        message: message,
                        receiver_id: this.currentConversation
                    });
                }
            }, 100);
            
            // Also send via API for persistence
            const response = await fetch('/chat/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });
            
            if (!response.ok) throw new Error('Failed to send message');
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError('Failed to send message');
        }
    }
    
    receiveMessage(data) {
        console.log('Received message:', data);
        // If this message is for the current conversation and not from me (already added), add it to UI
        if (this.currentConversation && 
            (data.sender_id == this.currentConversation || data.receiver_id == this.currentConversation) &&
            data.sender_id !== this.currentUser.id) {
            this.addMessageToUI({
                id: data.message_id,
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                content: data.content,
                timestamp: data.timestamp,
                is_read: data.sender_id === this.currentUser.id
            });
            
            // Mark as read if we're the receiver
            if (data.receiver_id === this.currentUser.id) {
                this.markMessageAsRead(data.message_id);
            }
        }
        
        // Update conversations list
        this.loadConversations();

        // Show toast and update global badge for messages not currently open
        const isIncoming = data.receiver_id === this.currentUser.id;
        const isOtherConversation = !this.currentConversation || data.sender_id != this.currentConversation;
        if (isIncoming && isOtherConversation) {
            try {
                if (window.NotificationManager) {
                    NotificationManager.showToast({
                        type: 'message',
                        message: `New message from ${data.sender_name || 'Travel Buddy'}`,
                        duration: 3500
                    });
                }
                if (window.NavbarManager && typeof NavbarManager.incrementMessageBadge === 'function') {
                    NavbarManager.incrementMessageBadge(1);
                }
            } catch (e) {
                console.warn('Failed to show message toast/badge:', e);
            }
        }
    }
    
    addMessageToUI(messageData) {
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        // Check if we need to add a date separator
        const messageDate = new Date(messageData.timestamp).toDateString();
        const lastMessage = container.lastElementChild;
        const lastMessageDate = lastMessage?.classList?.contains('date-separator') ? 
            lastMessage.textContent : null;
        
        if (lastMessageDate !== messageDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.innerHTML = `<span>${this.formatDate(messageDate)}</span>`;
            container.appendChild(dateSeparator);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.sender_id === this.currentUser.id ? 'message-sent' : 'message-received'}`;
        messageElement.dataset.messageId = messageData.id;
        
        // Apply enhanced animation based on whether it's a new message
        const isNewMessage = messageData.id.toString().includes('temp-') || Date.now() - new Date(messageData.timestamp).getTime() < 10000;
        
        if (isNewMessage) {
            messageElement.style.animation = 'messagePop 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(30px) scale(0.9)';
        } else {
            messageElement.style.animation = 'messageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        }
        
        messageElement.innerHTML = `
            ${messageData.sender_id !== this.currentUser.id ? `
                <div class="message-avatar">
                    <img src="${this.getUserAvatar(messageData.sender_id)}" alt="" loading="lazy">
                </div>
            ` : ''}
            <div class="message-bubble">
                <div class="message-content">
                    <p>${this.escapeHtml(messageData.content)}</p>
                </div>
                <div class="message-meta">
                    <span class="message-time">${this.formatTime(messageData.timestamp)}</span>
                    ${messageData.sender_id === this.currentUser.id ? `
                        <span class="message-status ${messageData.is_read ? 'read' : 'sent'}">
                            <i class="fas fa-${messageData.is_read ? 'check-double' : 'check'}"></i>
                        </span>
                    ` : ''}
                </div>
            </div>
            ${messageData.sender_id === this.currentUser.id ? `
                <div class="message-avatar">
                    <img src="${this.getUserAvatar(this.currentUser.id)}" alt="" loading="lazy">
                </div>
            ` : ''}
        `;
        
        container.appendChild(messageElement);
        
        // Add enhanced hover effects
        this.addMessageInteractions(messageElement);
        
        // Play sound for new messages from others
        if (isNewMessage && messageData.sender_id !== this.currentUser.id) {
            this.playNotificationSound();
            this.updateUnreadCount(1);
        }
        
        // Scroll to bottom with enhanced animation
        this.scrollToBottom(true);
        
        // Add stagger animation for multiple messages
        if (isNewMessage) {
            setTimeout(() => {
                messageElement.style.animation = 'none';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0) scale(1)';
            }, 600);
        }
    }
    
    addMessageInteractions(messageElement) {
        const contentElement = messageElement.querySelector('.message-content');
        const avatarElement = messageElement.querySelector('.message-avatar img');
        const reactionButtons = messageElement.querySelectorAll('.reaction-btn');
        
        // Enhanced hover effects for message content
        if (contentElement) {
            contentElement.addEventListener('mouseenter', () => {
                contentElement.style.transform = 'translateY(-3px) scale(1.02)';
                contentElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            
            contentElement.addEventListener('mouseleave', () => {
                contentElement.style.transform = 'translateY(0) scale(1)';
            });
            
            // Double-click to react with heart
            contentElement.addEventListener('dblclick', () => {
                this.addQuickReaction(messageElement, '❤️');
            });
        }
        
        // Enhanced hover effects for avatar
        if (avatarElement) {
            avatarElement.addEventListener('mouseenter', () => {
                avatarElement.style.transform = 'scale(1.15) rotate(5deg)';
                avatarElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            
            avatarElement.addEventListener('mouseleave', () => {
                avatarElement.style.transform = 'scale(1) rotate(0deg)';
            });
        }
        
        // Reaction button interactions
        reactionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const reaction = btn.dataset.reaction;
                this.addQuickReaction(messageElement, reaction);
                
                // Visual feedback
                btn.style.transform = 'scale(1.5) rotate(360deg)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 300);
            });
        });
    }
    
    addQuickReaction(messageElement, reaction) {
        // Create floating reaction animation
        const floatingReaction = document.createElement('div');
        floatingReaction.textContent = reaction;
        floatingReaction.style.cssText = `
            position: absolute;
            font-size: 2rem;
            pointer-events: none;
            z-index: 1000;
            animation: floatingReaction 2s ease-out forwards;
        `;
        
        const rect = messageElement.getBoundingClientRect();
        floatingReaction.style.left = (rect.left + Math.random() * 100) + 'px';
        floatingReaction.style.top = (rect.top - 20) + 'px';
        
        document.body.appendChild(floatingReaction);
        
        setTimeout(() => {
            floatingReaction.remove();
        }, 2000);
        
        // Add reaction animation CSS if not exists
        if (!document.getElementById('floating-reaction-styles')) {
            const style = document.createElement('style');
            style.id = 'floating-reaction-styles';
            style.textContent = `
                @keyframes floatingReaction {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: translateY(-30px) scale(1.3) rotate(180deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-60px) scale(0.8) rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateUnreadCount(change) {
        this.unreadCount += change;
        const indicator = document.getElementById('total-unread-indicator');
        
        if (indicator) {
            if (this.unreadCount > 0) {
                indicator.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                indicator.style.opacity = '1';
                indicator.style.visibility = 'visible';
                indicator.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    indicator.style.transform = 'scale(1)';
                }, 200);
            } else {
                indicator.style.opacity = '0';
                indicator.style.visibility = 'hidden';
            }
        }
        
        // Update page title
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) Chat - Dating App`;
        } else {
            document.title = 'Chat - Dating App';
        }
    }
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-indicator');
        if (!indicator) return;
        
        if (connected) {
            indicator.textContent = 'Connected';
            indicator.style.background = 'linear-gradient(135deg, #2ed573, #1dd1a1)';
            indicator.style.color = 'white';
            
            // Hide after 2 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                indicator.style.visibility = 'hidden';
            }, 2000);
        } else {
            indicator.textContent = 'Reconnecting...';
            indicator.style.background = 'linear-gradient(135deg, #ff6b81, #ff4757)';
            indicator.style.color = 'white';
            indicator.style.opacity = '1';
            indicator.style.visibility = 'visible';
        }
    }
    
    handleTyping() {
        if (!this.currentConversation || !this.socket) return;
        
        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing', {
                receiver_id: this.currentConversation,
                is_typing: true
            });
        }
        
        // Clear previous timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Set new timeout
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.socket.emit('typing', {
                receiver_id: this.currentConversation,
                is_typing: false
            });
        }, 1000);
    }
    
    showTypingIndicator(data) {
        if (data.user_id !== this.currentConversation) return;
        
        const container = document.getElementById('messages-container');
        const existingIndicator = document.getElementById('typing-indicator');
        
        if (data.is_typing) {
            if (!existingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'typing-indicator';
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="message-avatar">
                        <img src="${this.getUserAvatar(data.user_id)}" alt="">
                    </div>
                    <div class="typing-content">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p>${data.user_name} is typing...</p>
                    </div>
                `;
                container.appendChild(indicator);
                this.scrollToBottom();
            }
        } else if (existingIndicator) {
            existingIndicator.remove();
        }
    }
    
    markMessageAsRead(messageId) {
        if (!this.socket) return;
        
        this.socket.emit('message_read', {
            message_id: messageId
        });
    }
    
    markMessagesAsRead(userId) {
        // Mark all messages from this user as read in UI
        document.querySelectorAll('.message-received .message-status').forEach(status => {
            status.classList.remove('sent');
            status.classList.add('read');
            status.innerHTML = '<i class="fas fa-check-double"></i>';
        });
        
        // Emit read event for all unread messages from this user
        const unreadMessages = document.querySelectorAll('.message-received .message-status.sent');
        unreadMessages.forEach(status => {
            const messageElement = status.closest('.message');
            const messageId = messageElement.dataset.messageId;
            if (messageId) {
                this.markMessageAsRead(messageId);
            }
        });
    }
    
    updateReadReceipt(data) {
        // Update message status in UI
        const messageElement = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            const status = messageElement.querySelector('.message-status');
            if (status) {
                status.classList.remove('sent');
                status.classList.add('read');
                status.innerHTML = '<i class="fas fa-check-double"></i>';
            }
        }
    }
    
    updateDeliveryStatus(data) {
        // Update message delivery status in UI
        const messageElement = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            const status = messageElement.querySelector('.message-status');
            if (status && !status.classList.contains('read')) {
                status.classList.add('delivered');
                status.innerHTML = '<i class="fas fa-check"></i>';
            }
        }
    }
    
    updateUserStatus(userId, isOnline) {
        // Update status indicator in conversations list
        const conversationItem = document.querySelector(`.conversation-item[data-user-id="${userId}"]`);
        if (conversationItem) {
            const statusIndicator = conversationItem.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
            }
        }
        
        // Update status in chat header if this is the current conversation
        if (this.currentConversation == userId) {
            const statusElement = document.getElementById('user-status');
            const statusTextElement = document.getElementById('user-status-text');
            
            if (statusElement) {
                statusElement.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
            }
            if (statusTextElement) {
                statusTextElement.textContent = isOnline ? 'Online' : 'Offline';
            }
        }
    }
    
    filterConversations(query) {
        const conversations = document.querySelectorAll('.conversation-item');
        conversations.forEach(conv => {
            const userName = conv.querySelector('h4').textContent.toLowerCase();
            const matches = userName.includes(query.toLowerCase());
            conv.style.display = matches ? 'flex' : 'none';
        });
    }
    
    openNewChatModal() {
        const modal = document.getElementById('new-chat-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    startNewConversation(userId) {
        this.closeModal(document.getElementById('new-chat-modal'));
        this.selectConversation(parseInt(userId));
    }
    
    showConversationsList() {
        document.getElementById('chat-welcome').style.display = 'flex';
        document.getElementById('active-chat').style.display = 'none';
        document.querySelector('.chat-sidebar').style.display = 'flex';
    }
    
    hideConversationsList() {
        document.querySelector('.chat-sidebar').style.display = 'none';
    }
    
    updateMessageAnimations() {
        // Add enhanced message entrance animations
        const messages = document.querySelectorAll('.message');
        messages.forEach((message, index) => {
            message.style.animationDelay = `${index * 0.1}s`;
        });
    }
    
    handleQuickActionsToggle() {
        const messageInput = document.getElementById('message-input');
        const quickActions = document.querySelector('.quick-actions');
        
        if (!messageInput || !quickActions) return;
        
        // Show quick actions when input is empty and focused
        if (messageInput.value.trim() === '' && messageInput === document.activeElement) {
            quickActions.style.display = 'flex';
            quickActions.style.animation = 'slideUp 0.3s ease';
        } else {
            quickActions.style.display = 'none';
        }
    }
    
    toggleQuickActions() {
        const quickActions = document.querySelector('.quick-actions');
        if (!quickActions) return;
        
        if (quickActions.style.display === 'none' || !quickActions.style.display) {
            quickActions.style.display = 'flex';
            quickActions.style.animation = 'slideUp 0.3s ease';
        } else {
            quickActions.style.display = 'none';
        }
    }
    
    handleQuickAction(action) {
        switch (action) {
            case 'voice':
                this.startVoiceRecording();
                break;
            case 'photo':
                this.openPhotoCapture();
                break;
            case 'location':
                this.shareLocation();
                break;
            case 'gif':
                this.openGifPicker();
                break;
            default:
                console.log('Unknown quick action:', action);
        }
    }
    
    startVoiceRecording() {
        // TODO: Implement voice recording
        console.log('Voice recording feature - coming soon!');
        this.showTemporaryMessage('🎤 Voice recording feature coming soon!');
    }
    
    openPhotoCapture() {
        // TODO: Implement photo capture
        console.log('Photo capture feature - coming soon!');
        this.showTemporaryMessage('📸 Photo sharing feature coming soon!');
    }
    
    shareLocation() {
        // TODO: Implement location sharing
        console.log('Location sharing feature - coming soon!');
        this.showTemporaryMessage('📍 Location sharing feature coming soon!');
    }
    
    openGifPicker() {
        // TODO: Implement GIF picker
        console.log('GIF picker feature - coming soon!');
        this.showTemporaryMessage('🎯 GIF picker feature coming soon!');
    }
    
    toggleEmojiPicker() {
        // TODO: Implement emoji picker
        console.log('Emoji picker feature - coming soon!');
        this.showTemporaryMessage('😊 Emoji picker feature coming soon!');
    }
    
    showTemporaryMessage(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'temporary-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-weight: 500;
            opacity: 0;
            animation: popIn 0.3s ease forwards;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'popOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
        
        // Add animation styles if not exists
        if (!document.getElementById('temp-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'temp-notification-styles';
            style.textContent = `
                @keyframes popIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                @keyframes popOut {
                    from {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Enhanced scroll to bottom with momentum
    scrollToBottom(smooth = false) {
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        if (smooth) {
            // Create momentum scrolling effect
            const scrollDistance = container.scrollHeight - container.scrollTop;
            const duration = Math.min(scrollDistance / 3, 800); // Adaptive duration
            
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
            
            // Add visual feedback
            container.style.scrollBehavior = 'smooth';
            setTimeout(() => {
                container.style.scrollBehavior = 'auto';
            }, duration);
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }
    
    truncateMessage(message, maxLength = 50) {
        return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getUserStatus(userId) {
        // In a real app, this would check the actual user status
        // For demo purposes, return random status
        const statuses = ['online', 'offline', 'away'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    getUserAvatar(userId) {
        // In a real app, this would get the actual user avatar
        // For demo purposes, return a random avatar
        const avatars = [
            '/static/img/avatars/1.jpg',
            '/static/img/avatars/2.jpg',
            '/static/img/avatars/3.jpg',
            '/static/img/avatars/4.jpg',
            '/static/img/avatars/5.jpg'
        ];
        return avatars[userId % avatars.length];
    }
    
    groupMessagesByDate(messages) {
        const grouped = {};
        
        messages.forEach(message => {
            const date = new Date(message.timestamp).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(message);
        });
        
        return grouped;
    }
    
    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        const container = document.querySelector('.chat-main');
        if (container) {
            container.appendChild(errorDiv);
            
            // Remove after 3 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 3000);
        }
    }
}

// Initialize enhanced chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chat-page')) {
        window.chatApp = new EnhancedChatApp();
    }
});

// Enhanced error styles with modern design
const enhancedErrorStyles = `
.chat-error {
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #ff4757, #ff3838);
    color: white;
    padding: 15px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1000;
    box-shadow: 0 8px 30px rgba(255, 71, 87, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 300px;
    font-weight: 500;
}

.chat-error i {
    font-size: 1.2rem;
    animation: pulse 2s infinite;
}

.total-unread-indicator {
    animation: pulse 2s infinite;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

/* Enhanced typing indicator */
.typing-content {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.typing-content p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-style: italic;
}

/* Date separator enhancements */
.date-separator {
    text-align: center;
    margin: 20px 0;
    position: relative;
}

.date-separator::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-color), transparent);
}

.date-separator span {
    background: var(--bg-primary);
    padding: 5px 15px;
    border-radius: 15px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
    position: relative;
    z-index: 1;
    border: 1px solid var(--border-color);
}

/* Enhanced message status indicators */
.message-status.read {
    color: var(--primary);
    animation: checkmark 0.3s ease;
}

.message-status.sent {
    color: var(--text-muted);
}

@keyframes checkmark {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.3);
    }
    100% {
        transform: scale(1);
    }
}
`;

// Enhanced Feature Methods
setupEmojiPicker() {
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiGrid = document.getElementById('emoji-grid');
    
    if (!emojiBtn || !emojiPicker || !emojiGrid) return;
    
    // Emoji categories
    const emojiCategories = {
        recent: ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎'],
        travel: ['✈️', '🏖️', '🏔️', '🗺️', '📸', '🎒', '🌍', '🏛️'],
        faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂'],
        nature: ['🌱', '🌿', '🌳', '🌲', '🌴', '🌵', '🌾', '🌺']
    };
    
    let currentCategory = 'recent';
    
    // Load emojis for category
    const loadEmojis = (category) => {
        emojiGrid.innerHTML = emojiCategories[category].map(emoji => 
            `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
        ).join('');
        
        // Add click handlers
        emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', () => {
                this.insertEmoji(item.dataset.emoji);
                this.toggleEmojiPicker();
            });
        });
    };
    
    // Toggle emoji picker
    emojiBtn.addEventListener('click', () => {
        this.toggleEmojiPicker();
    });
    
    // Category switching
    emojiPicker.querySelectorAll('.emoji-category').forEach(category => {
        category.addEventListener('click', () => {
            emojiPicker.querySelectorAll('.emoji-category').forEach(c => c.classList.remove('active'));
            category.classList.add('active');
            currentCategory = category.dataset.category;
            loadEmojis(currentCategory);
        });
    });
    
    // Load initial emojis
    loadEmojis(currentCategory);
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });
}

toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    if (!emojiPicker) return;
    
    if (emojiPicker.style.display === 'none' || !emojiPicker.style.display) {
        emojiPicker.style.display = 'block';
        emojiPicker.style.animation = 'slideUp 0.3s ease';
    } else {
        emojiPicker.style.display = 'none';
    }
}

insertEmoji(emoji) {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const cursorPos = messageInput.selectionStart;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(messageInput.selectionEnd);
    
    messageInput.value = textBefore + emoji + textAfter;
    messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;
    messageInput.focus();
    
    // Trigger input event for character counter
    messageInput.dispatchEvent(new Event('input'));
}

setupSearchFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('conversation-search');
    const searchClear = document.getElementById('search-clear');
    
    if (!filterBtns.length || !searchInput) return;
    
    let currentFilter = 'all';
    
    // Filter button handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            this.applySearchFilter(searchInput.value, currentFilter);
        });
    });
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        this.applySearchFilter(query, currentFilter);
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }
    });
    
    // Clear search
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            this.applySearchFilter('', currentFilter);
            searchInput.focus();
        });
    }
}

applySearchFilter(query, filter) {
    const conversations = document.querySelectorAll('.conversation-item');
    
    conversations.forEach(conv => {
        const userName = conv.querySelector('h4')?.textContent.toLowerCase() || '';
        const userStatus = conv.querySelector('.status-indicator')?.className || '';
        const isUnread = conv.querySelector('.unread-badge') !== null;
        
        let matchesQuery = userName.includes(query.toLowerCase());
        let matchesFilter = true;
        
        switch (filter) {
            case 'unread':
                matchesFilter = isUnread;
                break;
            case 'online':
                matchesFilter = userStatus.includes('online');
                break;
            case 'away':
                matchesFilter = userStatus.includes('away');
                break;
        }
        
        conv.style.display = (matchesQuery && matchesFilter) ? 'flex' : 'none';
    });
}

setupCharacterCounter() {
    const messageInput = document.getElementById('message-input');
    const charCount = document.getElementById('char-count');
    
    if (!messageInput || !charCount) return;
    
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 1000;
        
        charCount.textContent = `${length}/${maxLength}`;
        
        // Change color based on length
        if (length > maxLength * 0.9) {
            charCount.style.color = 'var(--error)';
        } else if (length > maxLength * 0.7) {
            charCount.style.color = 'var(--warning)';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }
    });
}

setupVoiceRecording() {
    const voiceBtn = document.getElementById('voice-btn');
    if (!voiceBtn) return;
    
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    
    voiceBtn.addEventListener('click', () => {
        if (isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    });
    
    this.startVoiceRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    this.sendVoiceMessage(audioBlob);
                };
                
                mediaRecorder.start();
                isRecording = true;
                voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceBtn.style.background = 'var(--error)';
                voiceBtn.style.color = 'white';
                
                // Visual feedback
                voiceBtn.style.animation = 'pulse 1s infinite';
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                this.showTemporaryMessage('Microphone access denied');
            });
    };
    
    this.stopVoiceRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.background = '';
            voiceBtn.style.color = '';
            voiceBtn.style.animation = '';
        }
    };
    
    this.sendVoiceMessage = (audioBlob) => {
        // TODO: Implement voice message sending
        console.log('Voice message recorded:', audioBlob);
        this.showTemporaryMessage('🎤 Voice message feature coming soon!');
    };
}

setupModals() {
    // Modal close handlers
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            this.closeModal(modal);
        });
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            this.closeModal(e.target);
        }
    });
    
    // Trip planning modal
    const tripPlanBtn = document.getElementById('trip-plan-btn');
    const tripPlanModal = document.getElementById('trip-plan-modal');
    const tripPlanForm = document.getElementById('trip-plan-form');
    
    if (tripPlanBtn && tripPlanModal) {
        tripPlanBtn.addEventListener('click', () => {
            tripPlanModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (tripPlanForm) {
        tripPlanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTripPlan();
        });
    }
    
    // Location sharing modal
    const locationBtn = document.getElementById('location-share-btn');
    const locationModal = document.getElementById('location-share-modal');
    
    if (locationBtn && locationModal) {
        locationBtn.addEventListener('click', () => {
            locationModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Location options
    document.querySelectorAll('.location-option').forEach(option => {
        option.addEventListener('click', () => {
            const action = option.id;
            this.handleLocationAction(action);
        });
    });
}

setupTravelFeatures() {
    // Quick actions
    document.querySelectorAll('.quick-action').forEach(action => {
        action.addEventListener('click', (e) => {
            const actionType = e.currentTarget.dataset.action;
            this.handleQuickAction(actionType);
        });
    });
    
    // Chat actions
    document.querySelectorAll('.chat-action').forEach(action => {
        action.addEventListener('click', (e) => {
            const actionId = e.currentTarget.id;
            this.handleChatAction(actionId);
        });
    });
}

handleQuickAction(action) {
    switch (action) {
        case 'location':
            this.shareLocation();
            break;
        case 'photo':
            this.openPhotoCapture();
            break;
        case 'trip':
            this.openTripPlanning();
            break;
        case 'expense':
            this.openExpenseSharing();
            break;
        case 'gif':
            this.openGifPicker();
            break;
        default:
            console.log('Unknown quick action:', action);
    }
}

handleChatAction(actionId) {
    switch (actionId) {
        case 'voice-call-btn':
            this.startVoiceCall();
            break;
        case 'video-call-btn':
            this.startVideoCall();
            break;
        case 'location-share-btn':
            this.openLocationSharing();
            break;
        case 'trip-plan-btn':
            this.openTripPlanning();
            break;
        case 'photo-share-btn':
            this.openPhotoSharing();
            break;
        case 'more-options-btn':
            this.openMoreOptions();
            break;
        default:
            console.log('Unknown chat action:', actionId);
    }
}

openTripPlanning() {
    const modal = document.getElementById('trip-plan-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

openLocationSharing() {
    const modal = document.getElementById('location-share-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

createTripPlan() {
    const form = document.getElementById('trip-plan-form');
    const formData = new FormData(form);
    
    const tripData = {
        title: document.getElementById('trip-title').value,
        destination: document.getElementById('trip-destination').value,
        start_date: document.getElementById('trip-start-date').value,
        end_date: document.getElementById('trip-end-date').value,
        description: document.getElementById('trip-description').value
    };
    
    // TODO: Send trip plan to server
    console.log('Creating trip plan:', tripData);
    this.showTemporaryMessage('🗺️ Trip plan created successfully!');
    this.closeModal(document.getElementById('trip-plan-modal'));
}

handleLocationAction(action) {
    switch (action) {
        case 'current-location':
            this.getCurrentLocation();
            break;
        case 'select-location':
            this.openLocationPicker();
            break;
        case 'live-location':
            this.startLiveLocationSharing();
            break;
    }
}

getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                this.sendLocationMessage(location);
            },
            (error) => {
                console.error('Error getting location:', error);
                this.showTemporaryMessage('Location access denied');
            }
        );
    } else {
        this.showTemporaryMessage('Geolocation not supported');
    }
}

sendLocationMessage(location) {
    // TODO: Send location message
    console.log('Sending location:', location);
    this.showTemporaryMessage('📍 Location shared!');
    this.closeModal(document.getElementById('location-share-modal'));
}

startVoiceCall() {
    this.showTemporaryMessage('📞 Voice call feature coming soon!');
}

startVideoCall() {
    this.showTemporaryMessage('📹 Video call feature coming soon!');
}

openPhotoSharing() {
    this.showTemporaryMessage('📸 Photo sharing feature coming soon!');
}

openMoreOptions() {
    this.showTemporaryMessage('⚙️ More options coming soon!');
}

openExpenseSharing() {
    this.showTemporaryMessage('💰 Expense sharing feature coming soon!');
}

openGifPicker() {
    this.showTemporaryMessage('🎯 GIF picker feature coming soon!');
}

openLocationPicker() {
    this.showTemporaryMessage('🗺️ Location picker feature coming soon!');
}

startLiveLocationSharing() {
    this.showTemporaryMessage('📍 Live location sharing feature coming soon!');
}

// Inject enhanced styles
const enhancedStyleSheet = document.createElement('style');
enhancedStyleSheet.textContent = enhancedErrorStyles;
document.head.appendChild(enhancedStyleSheet);

// Initialize chat app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new EnhancedChatApp();
});