

const API = {
    post: async function (url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    get: async function (url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    sendChatbotMessage: async function (data) {
        return this.post('/chatbot/api/openai/chat', data);
    },

    getConversations: async function () {
        return this.get('/chatbot/api/conversations');
    },

    getConversationMessages: async function (conversationId) {
        return this.get(`/chatbot/api/conversation/${conversationId}/messages`);
    },

    createNewConversation: async function (title) {
        return this.post('/chatbot/api/conversation/new', { title: title });
    }
};

class EnhancedChatbot {
    constructor() {
        console.log('EnhancedChatbot constructor started');

        this.messages = [];
        this.isTyping = false;
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.inputField = document.getElementById('chatbot-input');
        this.currentConversationId = null;
        this.conversations = [];
        this.isInitialized = false;
        this.darkMode = this.detectDarkMode();

        console.log('Chatbot elements assigned:', {
            messagesContainer: !!this.messagesContainer,
            inputField: !!this.inputField,
            darkMode: this.darkMode
        });

        if (!this.messagesContainer || !this.inputField) {
            console.error('Required chatbot elements not found');
            return;
        }

        this.setupDarkModeObserver();
        this.setupEventListeners(); // set listeners early so UI is responsive
        this.enhanceUI();

        // alias so legacy code calling addWelcomeMessage works
        this.addWelcomeMessage = (...args) => this.addEnhancedWelcomeMessage(...args);

        this.init().catch(error => {
            console.error('Failed to initialize chatbot:', error);
        });

        console.log('EnhancedChatbot constructor completed');
    }

    detectDarkMode() {
        // Check data-theme attribute
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme) {
            return theme === 'dark';
        }

        // Check for dark mode preference
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setupDarkModeObserver() {
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

        // Also listen for system theme changes
        if (window.matchMedia) {
            // Use addEventListener if available, fallback to addListener
            const mm = window.matchMedia('(prefers-color-scheme: dark)');
            if (typeof mm.addEventListener === 'function') {
                mm.addEventListener('change', (e) => {
                    if (!document.documentElement.getAttribute('data-theme')) {
                        this.darkMode = e.matches;
                        this.updateThemeElements();
                    }
                });
            } else if (typeof mm.addListener === 'function') {
                mm.addListener((e) => {
                    if (!document.documentElement.getAttribute('data-theme')) {
                        this.darkMode = e.matches;
                        this.updateThemeElements();
                    }
                });
            }
        }
    }

    updateThemeElements() {
        // Update any theme-specific elements if needed
        console.log('Theme updated to:', this.darkMode ? 'dark' : 'light');

        // example: toggle a data attribute for the messages container for CSS
        if (this.messagesContainer) {
            if (this.darkMode) {
                this.messagesContainer.setAttribute('data-theme', 'dark');
            } else {
                this.messagesContainer.removeAttribute('data-theme');
            }
        }
    }

    enhanceUI() {
        // Add enhanced UI elements
        this.addScrollToBottomButton();
        this.enhanceInputArea();
        this.addKeyboardShortcuts();
        this.improveTypingIndicator();
        this.addMessageReactions();

        // global styles for enhanced UI (kept minimal)
        const style = document.createElement('style');
        style.textContent = `
            .scroll-to-bottom { /* styles are inline in code but keep minimal fallback */ }
            .typing-indicator { display:flex; gap:8px; align-items:center; padding:8px; opacity:.9; }
            .typing-indicator .typing-indicator-content span {
                display:inline-block;
                width:6px;
                height:6px;
                border-radius:50%;
                background:rgba(0,0,0,0.25);
                animation: blink 1s infinite;
            }
            .typing-indicator .typing-indicator-content span:nth-child(2) { animation-delay: .15s; }
            .typing-indicator .typing-indicator-content span:nth-child(3) { animation-delay: .3s; }
            @keyframes blink { 50% { opacity: 0.2; transform: translateY(2px); } }
        `;
        document.head.appendChild(style);
    }

    addScrollToBottomButton() {
        const parent = this.messagesContainer.parentNode;
        if (!parent) return;

        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-bottom';
        scrollBtn.setAttribute('aria-label', 'Scroll to bottom');
        scrollBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        scrollBtn.style.cssText = `
            position: absolute;
            bottom: 80px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary, #06b6d4), var(--secondary, #7c3aed));
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 10;
        `;

        scrollBtn.addEventListener('click', () => this.scrollToBottom());
        parent.appendChild(scrollBtn);

        // Show/hide based on scroll position
        this.messagesContainer.addEventListener('scroll', () => {
            const isNearBottom = this.messagesContainer.scrollHeight -
                this.messagesContainer.scrollTop - this.messagesContainer.clientHeight < 100;

            if (isNearBottom) {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.visibility = 'hidden';
            } else {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.visibility = 'visible';
            }
        });
    }

    enhanceInputArea() {
        // Add input enhancements
        if (this.inputField) {
            // Auto-resize textarea
            this.inputField.style.overflow = 'hidden';
            this.inputField.addEventListener('input', () => {
                this.inputField.style.height = 'auto';
                this.inputField.style.height = Math.min(this.inputField.scrollHeight, 150) + 'px';
            });

            // Add typing indicators debounce (unused server emission, placeholder)
            let typingTimer;
            this.inputField.addEventListener('input', () => {
                clearTimeout(typingTimer);
                // Could emit typing event to server here
                typingTimer = setTimeout(() => {
                    // Stop typing indicator or send 'stopped typing'
                }, 1000);
            });
        }
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus input
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (this.inputField) {
                    this.inputField.focus();
                }
            }

            // Escape to clear input
            if (e.key === 'Escape' && this.inputField === document.activeElement) {
                this.inputField.value = '';
                this.inputField.style.height = 'auto';
            }
        });
    }

    improveTypingIndicator() {
        // Enhanced typing indicator with better animation
        this.createTypingIndicator();
    }

    createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator enhanced';
        indicator.style.display = 'none';
        indicator.innerHTML = `
            <div class="message-avatar" style="background-color: #10a37f;">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator-content" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.typingIndicatorElement = indicator; // store for potential reuse
    }

    addMessageReactions() {
        // Add message reactions styles on hover (CSS only)
        const style = document.createElement('style');
        style.textContent = `
            .message:hover .message-reactions {
                opacity: 1;
                visibility: visible;
            }
            .message-reactions {
                position: absolute;
                top: -15px;
                right: 10px;
                display: flex;
                gap: 5px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 10;
            }
            .reaction-btn {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: none;
                background: var(--white, #fff);
                box-shadow: 0 4px 8px rgba(0,0,0,0.08);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8em;
                transition: all 0.2s ease;
            }
            .reaction-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 18px rgba(0,0,0,0.12);
            }
            [data-theme="dark"] .reaction-btn {
                background: rgba(255, 255, 255, 0.06);
                color: var(--text-dark, #e6e6e6);
            }
        `;
        document.head.appendChild(style);
    }

    async init() {
        console.log('Starting enhanced chatbot initialization...');

        try {
            await this.loadConversationHistory();
            console.log('Conversation history loaded');
        } catch (error) {
            console.warn('Failed to load conversation history:', error);
        }

        if (!this.currentConversationId) {
            console.log('No active conversation, adding welcome message');
            this.addEnhancedWelcomeMessage();
        }

        this.isInitialized = true;
        console.log('Enhanced chatbot initialization completed');
    }

    addEnhancedWelcomeMessage() {
        if (this.messagesContainer && this.messagesContainer.children.length === 0) {
            const welcomeMsg = `🤖 **Welcome to Travel Buddy AI Assistant!**

${this.darkMode ? '🌙' : '☀️'} I've detected your ${this.darkMode ? 'dark' : 'light'} mode preference and optimized my interface accordingly.

✨ **Enhanced Features:**
• Full administrative control over your Travel Buddy app
• Real-time conversation history
• Smart command execution
• Personalized Buddy insights
• Adaptive dark/light mode interface

🚀 **Quick Start:**
• Type \`/help\` for all commands
• Use **Ctrl+K** to focus on chat input
• Press **Escape** to clear input
• Scroll up to see the scroll-to-bottom button

What would you like to explore first?`;

            this.addBotMessage(welcomeMsg, true, new Date().toISOString());
        }
    }

    // Conversation API wrappers
    async loadConversationHistory() {
        try {
            this.conversations = await API.getConversations();
            this.updateSidebarHistory();

            // Load the most recent conversation if available
            if (Array.isArray(this.conversations) && this.conversations.length > 0) {
                await this.loadConversation(this.conversations[0].id);
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    updateSidebarHistory() {
        const historyContainer = document.querySelector('.chat-history');
        if (!historyContainer || !Array.isArray(this.conversations) || this.conversations.length === 0) {
            return;
        }

        // Clear existing dynamic history items
        const existingItems = historyContainer.querySelectorAll('.history-item.dynamic');
        existingItems.forEach(item => item.remove());

        // Add conversations to history (limit 10)
        this.conversations.slice(0, 10).forEach((conv, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item dynamic';
            historyItem.dataset.conversationId = conv.id;

            historyItem.innerHTML = `
                <i class="fas fa-comment"></i>
                <span title="${this.escapeHtml(conv.title || 'Untitled')}">${this.truncateText(conv.title || 'Untitled', 25)}</span>
                <small class="conversation-date">${this.formatDate(conv.updated_at)}</small>
            `;

            historyItem.addEventListener('click', () => {
                this.loadConversation(conv.id);
            });

            historyContainer.appendChild(historyItem);
        });
    }

    async loadConversation(conversationId) {
        try {
            const data = await API.getConversationMessages(conversationId);
            this.currentConversationId = conversationId;

            // Clear current messages
            this.clearMessages();

            // Load messages if available (expecting data.messages)
            if (data && Array.isArray(data.messages)) {
                data.messages.forEach(msg => {
                    if (msg.role === 'user') {
                        this.addUserMessage(msg.content, false, msg.created_at);
                    } else {
                        this.addBotMessage(msg.content, false, msg.created_at);
                    }
                });
            }

            // Update conversation title in UI if needed
            if (data && data.conversation && data.conversation.title) {
                this.updateConversationTitle(data.conversation.title);
            }

            this.scrollToBottom();
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    }

    clearMessages() {
        if (this.messagesContainer) {
            // Clear everything (keeps UI predictable)
            this.messagesContainer.innerHTML = '';
        }
        this.messages = [];
    }

    updateConversationTitle(title) {
        const titleElement = document.querySelector('.conversation-title');
        if (titleElement) {
            titleElement.textContent = title || 'Conversation';
        }
    }

    setupEventListeners() {
        console.log('Setting up chatbot event listeners...');

        // Send message button
        const sendButton = document.getElementById('send-chatbot-message');
        if (sendButton) {
            console.log('✅ Send button found, adding click listener');
            sendButton.addEventListener('click', (e) => {
                console.log('Send button clicked');
                e.preventDefault();
                this.sendMessage();
            });
        } else {
            console.warn('❌ Send button not found');
        }

        // Enter key in input
        if (this.inputField) {
            console.log('✅ Input field found, adding keypress listener');
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    console.log('Enter key pressed');
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        } else {
            console.error('❌ Input field not found');
        }

        // Suggestions (buttons)
        const suggestions = document.querySelectorAll('.suggestion');
        console.log(`Found ${suggestions.length} suggestion buttons`);
        suggestions.forEach(button => {
            button.addEventListener('click', (e) => {
                const message = e.currentTarget.dataset.message || e.target.dataset.message;
                console.log('Suggestion clicked:', message);
                if (message) this.sendMessageWithContent(message);
            });
        });

        // New chat button
        const newChatBtn = document.querySelector('.new-chat-btn');
        if (newChatBtn) {
            console.log('✅ New chat button found');
            newChatBtn.addEventListener('click', () => {
                console.log('New chat button clicked');
                this.startNewConversation();
            });
        } else {
            console.warn('⚠️ New chat button not found');
        }

        // Static history items (suggested topics)
        const staticHistoryItems = document.querySelectorAll('.history-item:not(.dynamic)');
        staticHistoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const text = item.querySelector('span')?.textContent;
                if (text) {
                    console.log('Static history item clicked:', text);
                    this.openSidePanel(text);
                }
            });
        });

        // Close side panel button
        const closePanelBtn = document.getElementById('close-side-panel');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.closeSidePanel();
            });
        }

        console.log('Event listeners setup completed');
    }

    openSidePanel(title) {
        const panel = document.getElementById('command-side-panel');
        const panelTitle = document.getElementById('side-panel-title');
        const panelContent = document.getElementById('side-panel-content');

        if (!panel || !panelTitle || !panelContent) {
            console.error('Side panel elements not found');
            return;
        }

        panelTitle.textContent = title;
        panel.classList.add('open');

        // Simulate loading content
        panelContent.innerHTML = `
            <div class="panel-loading">
                <i class="fas fa-spinner fa-spin"></i> Loading details for ${title}...
            </div>
        `;

        // Simulate fetching data (replace with actual API calls later if needed)
        setTimeout(() => {
            let content = '';
            if (title.includes('profile')) {
                content = `
                    <div class="panel-section">
                        <h4><i class="fas fa-user-circle"></i> Profile Overview</h4>
                        <p>Your profile is currently <strong>85% complete</strong>.</p>
                        <button class="btn-action">Edit Profile</button>
                    </div>
                    <div class="panel-section">
                        <h4><i class="fas fa-camera"></i> Photos</h4>
                        <div class="photo-grid">
                            <div class="photo-placeholder">1</div>
                            <div class="photo-placeholder">2</div>
                            <div class="photo-placeholder">3</div>
                        </div>
                    </div>
                `;
            } else if (title.includes('matches') || title.includes('Matches')) {
                content = `
                    <div class="panel-section">
                        <h4><i class="fas fa-heart"></i> Recent Matches</h4>
                        <ul class="match-list">
                            <li>Sarah (95% match)</li>
                            <li>Jessica (88% match)</li>
                            <li>Emily (82% match)</li>
                        </ul>
                        <button class="btn-action">View All Matches</button>
                    </div>
                `;
            } else if (title.includes('analytics') || title.includes('Stats')) {
                content = `
                    <div class="panel-section">
                        <h4><i class="fas fa-chart-line"></i> Activity Stats</h4>
                        <p>Profile Views: <strong>124</strong> (This week)</p>
                        <p>Likes Received: <strong>45</strong></p>
                        <p>Messages Sent: <strong>89</strong></p>
                    </div>
                `;
            } else {
                content = `
                    <div class="panel-section">
                        <h4><i class="fas fa-info-circle"></i> ${title}</h4>
                        <p>Here is some information about ${title}.</p>
                        <ul>
                            <li>Tip 1: Be authentic</li>
                            <li>Tip 2: Use high quality photos</li>
                            <li>Tip 3: Be respectful</li>
                        </ul>
                    </div>
                `;
            }

            // Add some styles for the dynamic content
            const style = `
                <style>
                    .panel-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                    .btn-action { background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px; }
                    .photo-grid { display: flex; gap: 10px; margin-top: 10px; }
                    .photo-placeholder { width: 60px; height: 60px; background: #ddd; display: flex; align-items: center; justify-content: center; border-radius: 5px; }
                    .match-list { list-style: none; padding: 0; }
                    .match-list li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
                </style>
            `;

            panelContent.innerHTML = style + content;
        }, 800);
    }

    closeSidePanel() {
        const panel = document.getElementById('command-side-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    }

    async startNewConversation(topic = null) {
        try {
            // Create new conversation
            const title = topic || `New Chat ${new Date().toLocaleTimeString()}`;
            const newConv = await API.createNewConversation(title);

            // Update current conversation
            if (newConv && newConv.id) {
                this.currentConversationId = newConv.id;
            } else {
                this.currentConversationId = null;
            }

            // Clear messages
            this.clearMessages();

            // Add welcome message for new conversation
            this.addWelcomeMessage();

            this.showCommandFeedback("New conversation started");

            // Reload conversation history
            await this.loadConversationHistory();

            // If a topic was provided, send it as a message
            if (topic) {
                // send immediately
                const message = topic.startsWith('/') ? topic : `Tell me about ${topic}`;
                await this.sendMessageWithContent(message);
            }

        } catch (error) {
            console.error('Failed to start new conversation:', error);
            // Fallback to local conversation
            this.currentConversationId = null;
            this.clearMessages();
            this.addWelcomeMessage();
        }
    }

    async sendMessage() {
        console.log('sendMessage called');

        if (!this.inputField) {
            console.error('Input field not available');
            return;
        }

        const message = this.inputField.value.trim();
        console.log('Message to send:', message);

        if (!message) {
            console.log('Empty message, not sending');
            return;
        }

        await this.sendMessageWithContent(message);
    }

    async sendMessageWithContent(message) {
        // Add user message to chat
        this.addUserMessage(message);

        // Clear input
        if (this.inputField) {
            this.inputField.value = '';
            // Reset textarea height
            this.inputField.style.height = 'auto';
        }

        // Get bot response
        await this.getBotResponse(message);
    }

    addUserMessage(message, scroll = true, timestamp = null) {
        const messageElement = this.createMessageElement(message, 'user', timestamp);
        this.messagesContainer.appendChild(messageElement);

        if (scroll) {
            this.scrollToBottom();
        }
        this.messages.push({ type: 'user', content: message });
    }

    addBotMessage(message, scroll = true, timestamp = null) {
        const messageElement = this.createMessageElement(message, 'bot', timestamp);
        this.messagesContainer.appendChild(messageElement);

        if (scroll) {
            this.scrollToBottom();
        }
        this.messages.push({ type: 'bot', content: message });
    }

    createMessageElement(message, type, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.style.position = 'relative'; // for reaction absolute placement

        const icon = type === 'bot' ? 'robot' : 'user';
        const bgColor = type === 'bot' ? '#10a37f' : '#7c3aed';

        const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formatted = this.formatMessage(message);

        messageDiv.innerHTML = `
            <div class="message-avatar" style="background-color: ${bgColor};">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="message-content">
                <p>${formatted}</p>
                <span class="message-time">${this.escapeHtml(timeStr)}</span>
            </div>
        `;

        // add reactions container so CSS shows it on hover (buttons can be wired later)
        const reactions = document.createElement('div');
        reactions.className = 'message-reactions';
        reactions.innerHTML = `
            <button class="reaction-btn" title="Like">👍</button>
            <button class="reaction-btn" title="Love">❤️</button>
            <button class="reaction-btn" title="Laugh">😂</button>
        `;
        messageDiv.appendChild(reactions);

        return messageDiv;
    }

    formatMessage(message) {
        if (!message && message !== '') return '';

        // escape HTML first
        let formattedMessage = this.escapeHtml(String(message));

        // Convert URLs to clickable links (safe because message already escaped)
        formattedMessage = formattedMessage.replace(
            /(https?:\/\/[^\s]+)/g,
            (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );

        // Convert line breaks to HTML
        formattedMessage = formattedMessage.replace(/\n/g, '<br>');

        // Format commands and highlights (e.g., /help)
        formattedMessage = formattedMessage.replace(
            /(\/\w+)/g,
            '<code class="command">$1</code>'
        );

        // Format emojis and make them slightly larger — using Unicode range for common pictographs
        formattedMessage = formattedMessage.replace(
            /([\u{1F300}-\u{1F6FF}\u2600-\u26FF\u2700-\u27BF])/gu,
            '<span class="emoji">$1</span>'
        );

        return formattedMessage;
    }

    // Simple HTML escape to avoid injection when inserting message text as HTML
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async getBotResponse(userMessage) {
        this.showTypingIndicator();

        // Realistic typing delay based on message length (keeps UI feeling natural)
        const typingDelay = Math.min(1500, 800 + userMessage.length * 15);
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        try {
            // Use enhanced API with conversation support
            const response = await API.sendChatbotMessage({
                message: userMessage,
                conversation_id: this.currentConversationId
            });

            this.hideTypingIndicator();

            // Handle response
            const botResponse = (response && (response.response || response.message)) || null;
            if (botResponse) {
                this.addBotMessage(botResponse);

                // Update conversation ID if new conversation was created
                if (response && response.conversation_id && !this.currentConversationId) {
                    this.currentConversationId = response.conversation_id;
                    // Reload conversation history to show the new conversation
                    await this.loadConversationHistory();
                }

                // Show command execution feedback
                if (response && response.command_executed) {
                    this.showCommandFeedback(response.command_result);
                }

            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Failed to get bot response:', error);

            this.hideTypingIndicator();

            // Enhanced fallback response
            const fallbackResponse = this.getEnhancedFallback(userMessage);
            this.addBotMessage(fallbackResponse);
        }
    }

    showCommandFeedback(result) {
        if (result) {
            // Create a subtle notification or highlight
            const feedback = document.createElement('div');
            feedback.className = 'command-feedback';

            const message = typeof result === 'string' ? result : 'Command executed successfully';
            feedback.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

            // Add to message container temporarily
            this.messagesContainer.appendChild(feedback);

            // Remove after 3 seconds
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 3000);
        }
    }

    getEnhancedFallback(message) {
        const lowerMessage = (message || '').toLowerCase();

        // Command handling
        if (typeof message === 'string' && message.startsWith('/')) {
            return `🤖 I understand you're trying to use the command "${this.escapeHtml(message)}". While I'm temporarily offline, I can still help! Type /help when I'm back online to see all available commands.`;
        }

        // Context-aware responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return '👋 Hello! I\'m temporarily having connection issues, but I\'m still here to help! What would you like to know about Connectify?';
        }

        if (lowerMessage.includes('help')) {
            return '🆘 I can help with profile optimization, matching tips, dating advice, safety guidelines, and managing your Connectify account. What specific area interests you?';
        }

        if (lowerMessage.includes('profile')) {
            return '📸 For a great profile: Use 3-6 high-quality photos, write an authentic bio, showcase your interests, and keep it positive! Complete profiles get 3x more matches.';
        }

        if (lowerMessage.includes('match') || lowerMessage.includes('swipe')) {
            return '❤️ Our algorithm considers your preferences, interests, location, and activity. Be selective but open-minded, and update your preferences regularly for better matches!';
        }

        if (lowerMessage.includes('message') || lowerMessage.includes('chat')) {
            return '💬 Great conversation starters: Ask about their interests, comment on their photos, share a fun fact, or ask open-ended questions. Avoid generic "hey" messages!';
        }

        return `🤖 I\'m temporarily having connection issues, but I\'m still here to help with Connectify! Could you rephrase your question or try asking about profiles, matches, messages, or dating advice?`;
    }

    showTypingIndicator() {
        if (this.isTyping) return;

        this.isTyping = true;

        // If we have a pre-created reusable typing indicator element, clone it, else create inline
        let typingIndicator;
        if (this.typingIndicatorElement) {
            typingIndicator = this.typingIndicatorElement.cloneNode(true);
            typingIndicator.style.display = 'flex';
        } else {
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = `
                <div class="message-avatar" style="background-color: #10a37f;">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="typing-indicator-content">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
        }

        // store to remove later
        typingIndicator.dataset._typing = '1';
        this.messagesContainer.appendChild(typingIndicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;

        const typingIndicator = this.messagesContainer.querySelector('[data-_typing="1"], .typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            // smooth behavior may be nicer but fallback to instant to guarantee scroll
            try {
                this.messagesContainer.scrollTo({ top: this.messagesContainer.scrollHeight, behavior: 'smooth' });
            } catch (err) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        }
    }

    // Utility functions
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return this.escapeHtml(dateString);

        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    }
}

// Legacy Chatbot class for backward compatibility
class Chatbot extends EnhancedChatbot {
    constructor() {
        super();
        console.log('Using legacy Chatbot class - consider upgrading to EnhancedChatbot');
    }

    // Legacy method for conversation history
    updateConversationHistory(role, content) {
        // This method is now handled by the database, but kept for compatibility
        console.log(`Legacy conversation history: ${role} - ${content}`);
    }
}

// Initialize enhanced chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for chatbot elements...');

    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const sendButton = document.getElementById('send-chatbot-message');

    console.log('Chatbot elements found:', {
        messages: !!chatbotMessages,
        input: !!chatbotInput,
        sendButton: !!sendButton
    });

    if (chatbotMessages && chatbotInput && sendButton) {
        try {
            console.log('Initializing Enhanced Chatbot...');
            // Use the enhanced chatbot by default
            window.chatbotApp = new EnhancedChatbot();
            console.log('✅ Enhanced Chatbot initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Chatbot:', error);
            window.chatbotApp = null;
        }
    } else {
        console.warn('⚠️ Required chatbot elements not found, skipping initialization');
    }

    // Add some custom styles for the enhanced features
    const style = document.createElement('style');
    style.textContent = `
        .command-feedback {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            margin: 8px 0;
            text-align: center;
            font-size: 0.9em;
            animation: slideIn 0.3s ease-out;
        }
        
        .conversation-date {
            font-size: 0.7em;
            color: rgba(255, 255, 255, 0.6);
            display: block;
            margin-top: 2px;
        }
        
        .history-item.dynamic {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .history-item.dynamic:hover {
            background-color: rgba(255, 255, 255, 0.04);
            transform: translateX(5px);
        }
        
        .command {
            background: rgba(124, 58, 237, 0.08);
            color: #7c3aed;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
        }
        
        .emoji {
            font-size: 1.2em;
            display: inline-block;
            margin: 0 2px;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});
