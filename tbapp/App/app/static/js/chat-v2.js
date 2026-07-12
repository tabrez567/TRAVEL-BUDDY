/* global io */

// Clean chat implementation used by app/chat/templates/chat/chat.html
// Uses the Flask endpoints:
// - GET /chat/api/conversations
// - GET /chat/api/messages/<user_id>
// And Socket.IO event:
// - send_message (emit)
// - receive_message (listen)

class ChatAppV2 {
  constructor() {
    // DOM
    this.chatPage = document.getElementById('chat-page');
    this.chatWelcome = document.getElementById('chat-welcome');
    this.activeChat = document.getElementById('active-chat');

    this.conversationsList = document.getElementById('conversations-list');
    this.conversationsEmpty = document.getElementById('conversations-empty');

    this.messagesContainer = document.getElementById('messages-container');
    this.messageInput = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');

    this.connectionStatus = document.getElementById('connection-status');

    // Header elements
    this.chatUserName = document.getElementById('chat-user-name');
    this.chatUserAvatar = document.getElementById('chat-user-avatar');
    this.userStatusText = document.getElementById('user-status-text');

    // Data
    this.socket = null;
    this.conversations = [];
    this.renderedMessageIds = new Set();

    this.currentUserId = Number(window.currentUserID);
    this.currentConversationUserId = null; // user id of the other person
    this.currentConversationId = null; // conversation_id string like "1_2"

    if (!this.chatPage) return;

    this.init();
  }

  init() {
    this.bindUI();
    this.initSocket();
    this.loadConversations();
  }

  bindUI() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('chat-sidebar');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Search
    const searchInput = document.getElementById('conversation-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterConversations(e.target.value));
    }

    // Send message
    if (this.messageInput) {
      this.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto resize
      this.messageInput.addEventListener('input', () => {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = `${Math.min(this.messageInput.scrollHeight, 120)}px`;
      });
    }

    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => this.sendMessage());
    }

    // New chat modal open/close (existing UI)
    const newChatBtn = document.getElementById('new-chat-btn');
    const newChatModal = document.getElementById('new-chat-modal');
    const matchSearch = document.getElementById('match-search');
    
    if (newChatBtn && newChatModal) {
      newChatBtn.addEventListener('click', () => {
        newChatModal.classList.add('show');
        this.loadAllUsers();
      });

      newChatModal.querySelectorAll('.modal-close').forEach((btn) => {
        btn.addEventListener('click', () => {
          newChatModal.classList.remove('show');
        });
      });
      
      // Search functionality
      if (matchSearch) {
        matchSearch.addEventListener('input', (e) => this.searchUsers(e.target.value));
      }
    }
    
    // Close modal when clicking outside (on conversations)
    const chatSidebar = document.getElementById('chat-sidebar');
    if (chatSidebar && newChatModal) {
      chatSidebar.addEventListener('click', (e) => {
        // Only close if clicking on a conversation item
        if (e.target.closest('.conversation-item')) {
          newChatModal.classList.remove('show');
        }
      });
    }
  }

  initSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      this.updateConnectionStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      this.updateConnectionStatus(false);
    });

    this.socket.on('receive_message', (msg) => {
      console.log('[Socket] Message received:', msg);
      this.handleIncomingMessage(msg);
    });

    this.socket.on('user_typing', (data) => {
      console.log('[Socket] User typing:', data);
      this.handleUserTyping(data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log('[Socket] User stopped typing:', data);
      this.handleUserStoppedTyping(data);
    });
  }

  updateConnectionStatus(connected) {
    if (!this.connectionStatus) return;

    const icon = this.connectionStatus.querySelector('i');
    const text = this.connectionStatus.querySelector('span');

    if (icon) icon.style.color = connected ? '#25d366' : '#ccc';
    if (text) text.textContent = connected ? 'Connected' : 'Disconnected';

    if (this.sendButton) this.sendButton.disabled = !connected;
  }

  async loadConversations() {
    try {
      console.debug('[Chat] Fetching conversations...');
      const res = await fetch('/chat/api/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');

      this.conversations = await res.json();
      console.log('[Chat] Loaded conversations:', this.conversations.length);
      this.renderConversations();

      if (!this.currentConversationUserId && this.conversations.length > 0) {
        // Auto select first conversation only if no conversation is currently selected
        console.log('[Chat] Auto-selecting first conversation');
        this.selectConversation(this.conversations[0].user.id);
      }
    } catch (e) {
      console.error('[Chat] loadConversations error:', e);
      this.conversations = [];
      this.renderConversations();
    }
  }

  renderConversations() {
    if (!this.conversationsList || !this.conversationsEmpty) return;

    this.conversationsList.innerHTML = '';

    if (!this.conversations || this.conversations.length === 0) {
      this.conversationsEmpty.style.display = 'flex';
      this.conversationsList.style.display = 'none';
      return;
    }

    this.conversationsEmpty.style.display = 'none';
    this.conversationsList.style.display = 'block';

    this.conversations.forEach((conv) => {
      const el = this.createConversationItem(conv);
      this.conversationsList.appendChild(el);
    });
  }

  createConversationItem(conv) {
    const item = document.createElement('div');

    const unreadCount = Number(conv.unread_count || 0);
    
    // CRITICAL: Ensure we're using the correct user (conversation partner), not current user
    const conversationUser = conv.user;
    if (!conversationUser || !conversationUser.id) {
      console.warn('[Chat] Conversation missing user data:', conv);
      return item;
    }
    
    const isActive = this.currentConversationUserId === conversationUser.id;

    item.className = `conversation-item${isActive ? ' active' : ''}${unreadCount > 0 ? ' unread' : ''}`;
    item.dataset.userId = String(conversationUser.id);
    item.dataset.conversationId = String(conv.conversation_id || '');
    // Store the user name as data attribute for avatar fallback reference
    item.dataset.userName = String(conversationUser.name || '');

    const avatarUrl = (conversationUser && conversationUser.profile_picture) ? conversationUser.profile_picture : '/static/img/avatars/default.jpg';
    const userName = String(conversationUser.name || '');

    const timeSource = (conv.last_message && (conv.last_message.created_at || conv.last_message_at)) || conv.last_message_at;
    const timeText = timeSource ? this.formatConversationTime(timeSource) : '';

    const previewHtml = this.getConversationPreviewHtml(conv);

    item.innerHTML = `
      <div class="conversation-avatar">
        <img src="${this.escapeAttr(avatarUrl)}" alt="${this.escapeAttr(userName)}" data-username="${this.escapeAttr(userName)}">
        <span class="status-indicator offline"></span>
      </div>
      <div class="conversation-info">
        <div class="conversation-header">
          <h4 data-username="${this.escapeAttr(userName)}">${this.escapeHtml(userName)}</h4>
          <span class="conversation-time">${this.escapeHtml(timeText)}</span>
        </div>
        <div class="conversation-preview-wrapper">
          <p class="conversation-preview">${previewHtml}</p>
          ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
        </div>
      </div>
    `;

    item.addEventListener('click', () => this.selectConversation(conversationUser.id));
    return item;
  }

  getConversationPreviewHtml(conv) {
    const last = conv.last_message;
    if (!last) return 'No messages yet';

    const type = (last.message_type || 'text').toLowerCase();

    if (type === 'photo' || type === 'image' || type === 'attachment') {
      return `<i class="fa-regular fa-image"></i><span>Photo</span>`;
    }

    if (type === 'location') {
      return `<i class="fas fa-map-marker-alt"></i><span>Location</span>`;
    }

    if (type === 'trip_invitation') {
      return `<i class="fas fa-route"></i><span>Trip plan</span>`;
    }

    return this.escapeHtml(this.truncate(last.content || '', 40));
  }

  async selectConversation(userId) {
    if (!userId) return;
    userId = Number(userId);

    const conv = this.conversations.find((c) => c.user && c.user.id === userId);
    if (!conv) {
      console.warn('Conversation not found for user:', userId);
      return;
    }

    this.currentConversationUserId = userId;
    this.currentConversationId = conv.conversation_id;

    if (this.chatWelcome) this.chatWelcome.style.display = 'none';
    if (this.activeChat) this.activeChat.style.display = 'flex';

    // UI Feedback: active class
    if (this.conversationsList) {
      this.conversationsList.querySelectorAll('.conversation-item').forEach((item) => {
        item.classList.toggle('active', Number(item.dataset.userId) === userId);
        if (Number(item.dataset.userId) === userId) {
          item.classList.remove('unread');
          const uc = item.querySelector('.unread-count');
          if (uc) uc.remove();
        }
      });
    }

    // Header
    if (this.chatUserName) this.chatUserName.textContent = conv.user.name || '';
    if (this.chatUserAvatar) {
      const userName = String(conv.user.name || '');
      this.chatUserAvatar.src = conv.user.profile_picture || '/static/img/avatars/default.jpg';
      this.chatUserAvatar.alt = userName;
      this.chatUserAvatar.setAttribute('data-username', userName);
    }
    if (this.userStatusText) this.userStatusText.textContent = 'Offline';

    // Join room for real-time updates
    if (this.socket && this.currentConversationId) {
      console.log('[Socket] Joining conversation room:', this.currentConversationId);
      this.socket.emit('join_conversation', { conversation_id: this.currentConversationId });
    }

    // Load messages
    await this.loadMessages(userId);

    // Close sidebar on mobile
    const sidebar = document.getElementById('chat-sidebar');
    if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');

    // Close the new conversation drawer
    const newChatModal = document.getElementById('new-chat-modal');
    if (newChatModal) {
      newChatModal.classList.remove('show');
    }
  }

  async loadMessages(userId) {
    if (!this.messagesContainer) return;

    this.messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #8696a0;"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
    this.renderedMessageIds.clear();

    try {
      console.log('[Chat] Loading messages for user:', userId);
      const res = await fetch(`/chat/api/messages/${userId}`);
      if (!res.ok) {
        throw new Error(`Failed to load messages: ${res.status}`);
      }

      const messages = await res.json();
      console.log('[Chat] Loaded messages:', messages.length);
      
      // Clear loading indicator
      this.messagesContainer.innerHTML = '';

      if (messages.length === 0) {
        this.messagesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #8696a0;">No messages yet. Start the conversation!</div>';
      } else {
        messages.forEach((m) => {
          const isSent = Number(m.sender_id) === this.currentUserId;
          this.addMessageToUI(m, isSent);
        });
      }
      
      this.scrollToBottom();
    } catch (e) {
      console.error('[Chat] loadMessages error:', e);
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #d32f2f;">Failed to load messages. Please refresh.</div>';
      }
    }
  }

  addMessageToUI(message, isSent) {
    if (!this.messagesContainer) return;

    const messageId = message && (message.message_id || message._id);
    if (messageId && this.renderedMessageIds.has(String(messageId))) return;
    if (messageId) this.renderedMessageIds.add(String(messageId));

    const messageGroup = document.createElement('div');
    messageGroup.className = `message-group ${isSent ? 'sent-group' : ''}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'message-sent' : 'message-received'}`;

    if (!isSent) {
      // RECEIVED MESSAGE: Use the sender's name and avatar
      const senderName = String(message.sender_name || `User ${message.sender_id}`);
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.innerHTML = `<img src="${this.escapeAttr(this.getUserAvatar(message.sender_id))}" alt="${this.escapeAttr(senderName)}" data-username="${this.escapeAttr(senderName)}">`;
      messageDiv.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `<p>${this.escapeHtml(message.content || '')}</p>`;

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = this.formatClockTime(message.created_at || message.timestamp || new Date().toISOString());
    meta.appendChild(time);

    bubble.appendChild(content);
    bubble.appendChild(meta);
    messageDiv.appendChild(bubble);

    if (isSent) {
      // SENT MESSAGE: Use current user's name and avatar
      const currentUserName = window.currentUserName || 'You';
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      const url = window.currentUserProfilePicture || '/static/img/avatars/default.jpg';
      avatar.innerHTML = `<img src="${this.escapeAttr(url)}" alt="${this.escapeAttr(currentUserName)}" data-username="${this.escapeAttr(currentUserName)}">`;
      messageDiv.appendChild(avatar);
    }

    messageGroup.appendChild(messageDiv);
    this.messagesContainer.appendChild(messageGroup);
  }

  sendMessage() {
    if (!this.messageInput || !this.socket) return;

    const text = (this.messageInput.value || '').trim();
    if (!text || !this.currentConversationUserId) return;

    // Disable send button while sending
    if (this.sendButton) {
      this.sendButton.disabled = true;
    }

    this.messageInput.value = '';
    this.messageInput.style.height = 'auto';

    const localMsg = {
      sender_id: this.currentUserId,
      sender_name: window.currentUserName || 'You',
      receiver_id: this.currentConversationUserId,
      content: text,
      message_type: 'text',
      created_at: new Date().toISOString()
    };

    // Add message to UI immediately with pending status
    this.addMessageToUI(localMsg, true);
    this.scrollToBottom();

    // Emit via Socket.IO
    this.socket.emit('send_message', {
      receiver_id: this.currentConversationUserId,
      message: text,
      message_type: 'text'
    }, (response) => {
      // Re-enable send button
      if (this.sendButton) {
        this.sendButton.disabled = false;
      }
      
      if (response && response.success) {
        console.log('Message sent successfully');
      } else {
        console.error('Failed to send message');
      }
    });

    // Update local conversation preview immediately
    this.updateConversationPreviewFromMessage(localMsg);
  }

  handleIncomingMessage(msg) {
    // msg payload fields in backend: sender_id, receiver_id, content, message_type, created_at/timestamp
    const senderId = Number(msg.sender_id);
    const receiverId = Number(msg.receiver_id);

    const otherUserId = senderId === this.currentUserId ? receiverId : senderId;

    // If current conversation is open, render message
    if (this.currentConversationUserId && otherUserId === this.currentConversationUserId) {
      const isSent = senderId === this.currentUserId;
      
      // Get sender name from socket message or look it up from conversations
      let senderName = msg.sender_name;
      if (!senderName) {
        if (isSent) {
          senderName = window.currentUserName || 'You';
        } else {
          const conv = this.conversations.find((c) => c.user && c.user.id === senderId);
          senderName = conv && conv.user ? conv.user.name : `User ${senderId}`;
        }
      }
      
      this.addMessageToUI(
        {
          message_id: msg.message_id,
          sender_id: senderId,
          sender_name: senderName,
          receiver_id: receiverId,
          content: msg.content,
          message_type: msg.message_type,
          created_at: msg.created_at || msg.timestamp
        },
        isSent
      );
      this.scrollToBottom();
    }

    this.updateConversationPreviewFromMessage(msg);
  }

  updateConversationPreviewFromMessage(msg) {
    const senderId = Number(msg.sender_id);
    const receiverId = Number(msg.receiver_id);
    const otherUserId = senderId === this.currentUserId ? receiverId : senderId;

    const conv = this.conversations.find((c) => c.user && c.user.id === otherUserId);
    if (!conv) {
      // If a new conversation appears, refresh list
      this.loadConversations();
      return;
    }

    conv.last_message = {
      content: msg.content,
      sender_id: senderId,
      message_type: (msg.message_type || 'text'),
      created_at: msg.created_at || msg.timestamp || new Date().toISOString()
    };
    conv.last_message_at = conv.last_message.created_at;

    if (senderId !== this.currentUserId && otherUserId !== this.currentConversationUserId) {
      conv.unread_count = Number(conv.unread_count || 0) + 1;
    }

    // Move updated conversation to top
    this.conversations = [conv].concat(this.conversations.filter((c) => c !== conv));
    this.renderConversations();
  }

  filterConversations(query) {
    if (!this.conversationsList) return;

    const q = (query || '').toLowerCase();
    this.conversationsList.querySelectorAll('.conversation-item').forEach((item) => {
      const name = (item.querySelector('h4')?.textContent || '').toLowerCase();
      const preview = (item.querySelector('.conversation-preview')?.textContent || '').toLowerCase();
      item.style.display = name.includes(q) || preview.includes(q) ? 'flex' : 'none';
    });
  }

  // Helpers
  truncate(text, max) {
    const t = text || '';
    return t.length > max ? `${t.slice(0, max)}...` : t;
  }

  formatClockTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatConversationTime(timestamp) {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';

    const now = new Date();

    // same day -> HH:MM
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // within last 7 days -> weekday
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }

    // else -> locale date
    return d.toLocaleDateString();
  }

  getUserAvatar(userId) {
    const conv = this.conversations.find((c) => c.user && c.user.id === Number(userId));
    if (conv && conv.user && conv.user.profile_picture) return conv.user.profile_picture;
    return '/static/img/avatars/default.jpg';
  }

  scrollToBottom() {
    if (!this.messagesContainer) return;
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  escapeAttr(text) {
    return this.escapeHtml(text).replace(/"/g, '&quot;');
  }

  handleUserTyping(data) {
    /**Handle user typing indicator*/
    if (!data.is_typing || !this.messagesContainer) return;
    if (Number(data.user_id) !== this.currentConversationUserId) return;

    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'flex';
      this.scrollToBottom();
    }
  }

  handleUserStoppedTyping(data) {
    /**Handle user stopped typing*/
    if (!this.messagesContainer) return;
    if (Number(data.user_id) !== this.currentConversationUserId) return;

    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'none';
    }
  }

  async loadAllUsers() {
    /**Load all available users for new conversations*/
    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return;

    matchesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';

    try {
      const response = await fetch('/chat/api/available-users?limit=20&offset=0');
      
      if (!response.ok) throw new Error('Failed to load users');

      const data = await response.json();
      this.renderMatches(data.users || []);
    } catch (e) {
      console.error('Error loading users:', e);
      if (matchesList) {
        matchesList.innerHTML = '<div class="empty-state"><p>Unable to load users. Please try again.</p></div>';
      }
    }
  }

  async searchUsers(query) {
    /**Search for users by query string*/
    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return;

    // Trim and validate query
    const trimmedQuery = (query || '').trim();
    
    if (!trimmedQuery || trimmedQuery.length < 2) {
      // If query is empty/short, load all users
      this.loadAllUsers();
      return;
    }

    matchesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

    try {
      const response = await fetch(`/chat/api/search-users?q=${encodeURIComponent(trimmedQuery)}&limit=20`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      this.renderMatches(data.users || []);
    } catch (e) {
      console.error('Search error:', e);
      if (matchesList) {
        matchesList.innerHTML = '<div class="empty-state"><p>Error searching users. Please try again.</p></div>';
      }
    }
  }

  renderMatches(users) {
    /**Render user list in the new conversation modal*/
    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return;

    if (!users || users.length === 0) {
      matchesList.innerHTML = '<div class="empty-state"><p>No users available to chat with.</p></div>';
      return;
    }

    matchesList.innerHTML = '';

    users.forEach(user => {
      const userCard = document.createElement('div');
      userCard.className = 'match-card';
      
      const profilePic = user.profile_picture || `/static/img/avatars/${user.id % 10 + 1}.jpg`;
      
      // Handle interests - could be string, array, or JSON string
      let interestsText = 'None';
      try {
        if (user.interests) {
          if (typeof user.interests === 'string') {
            // Try to parse as JSON first
            try {
              const parsed = JSON.parse(user.interests);
              interestsText = Array.isArray(parsed) ? parsed.join(', ') : user.interests;
            } catch {
              // If not JSON, use as is
              interestsText = user.interests;
            }
          } else if (Array.isArray(user.interests)) {
            interestsText = user.interests.join(', ');
          }
        }
      } catch (e) {
        console.error('Error parsing interests:', e);
      }

      userCard.innerHTML = `
        <div class="match-avatar">
          <img src="${this.escapeAttr(profilePic)}" alt="${this.escapeAttr(user.name)}" onerror="this.src='/static/img/avatars/default.jpg'">
        </div>
        <div class="match-info">
          <h4>${this.escapeHtml(user.name)}</h4>
          <p class="match-location"><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(user.location || 'Location unknown')}</p>
          <p class="match-bio">${this.escapeHtml(this.truncate(user.bio || '', 60))}</p>
          <p class="match-interests"><strong>Interests:</strong> ${this.escapeHtml(this.truncate(interestsText, 50))}</p>
          ${user.travel_style ? `<p class="match-travel"><strong>Travel Style:</strong> ${this.escapeHtml(user.travel_style)}</p>` : ''}
        </div>
        <button class="match-select-btn" data-user-id="${user.id}">
          <i class="fas fa-comment"></i> Chat
        </button>
      `;

      userCard.querySelector('.match-select-btn').addEventListener('click', () => {
        this.startConversation(user);
      });

      matchesList.appendChild(userCard);
    });
  }

  async startConversation(user) {
    /**Start a new conversation with a user*/
    if (!user || !user.id) return;

    try {
      console.log('[Chat] Starting conversation with:', user.name);
      
      // Call the backend to create/get the conversation
      const response = await fetch(`/chat/api/start-conversation/${user.id}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const data = await response.json();
      console.log('[Chat] Conversation response:', data);

      // Close the drawer
      const newChatModal = document.getElementById('new-chat-modal');
      if (newChatModal) {
        newChatModal.classList.remove('show');
      }

      // Reload conversations to get the latest list
      console.log('[Chat] Reloading conversations...');
      await this.loadConversations();
      
      // Wait a moment for the UI to update
      setTimeout(() => {
        // Select the new conversation
        console.log('[Chat] Selecting conversation for user:', user.id);
        this.selectConversation(user.id);
      }, 100);

    } catch (e) {
      console.error('[Chat] Error starting conversation:', e);
      alert('Failed to start conversation. Please try again.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Only run on the chat page
  if (document.getElementById('chat-page')) {
    window.chatApp = new ChatAppV2();
  }
});
