// Gestionnaire du chat
class ChatManager {
    constructor() {
        this.messages = [];
        this.setupSocketListeners();
        this.setupUI();
    }

    setupSocketListeners() {
        // Écouter les nouveaux messages
        socket.on('newMessage', (data) => {
            this.addMessage(data);
            this.updateChatDisplay();
            this.scrollToBottom();
        });

        // Écouter l'historique des messages
        socket.on('chatHistory', (messages) => {
            this.messages = messages;
            this.updateChatDisplay();
            this.scrollToBottom();
        });

        // Écouter les notifications de typage
        socket.on('userTyping', (data) => {
            this.showTypingIndicator(data);
        });

        // Écouter les notifications de lecture
        socket.on('messageRead', (data) => {
            this.updateMessageStatus(data);
        });
    }

    setupUI() {
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');

        if (chatForm && messageInput) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage(messageInput.value);
                messageInput.value = '';
            });

            // Gérer l'indicateur de typage
            let typingTimeout;
            messageInput.addEventListener('input', () => {
                this.sendTypingIndicator();
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    this.stopTypingIndicator();
                }, 1000);
            });
        }
    }

    sendMessage(content) {
        if (!content.trim()) return;

        const message = {
            content,
            userId: socket.userId,
            timestamp: new Date()
        };

        socket.emit('sendMessage', message);
    }

    sendTypingIndicator() {
        socket.emit('typing', {
            userId: socket.userId,
            gameId: currentGameId
        });
    }

    stopTypingIndicator() {
        socket.emit('stopTyping', {
            userId: socket.userId,
            gameId: currentGameId
        });
    }

    addMessage(data) {
        this.messages.push({
            ...data,
            status: 'sent',
            readBy: new Set()
        });
    }

    updateMessageStatus(data) {
        const message = this.messages.find(m => m.id === data.messageId);
        if (message) {
            message.readBy.add(data.userId);
            message.status = 'read';
        }
    }

    showTypingIndicator(data) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.textContent = `${data.userId} est en train d'écrire...`;
            typingIndicator.style.display = 'block';

            // Cacher l'indicateur après 3 secondes
            setTimeout(() => {
                typingIndicator.style.display = 'none';
            }, 3000);
        }
    }

    updateChatDisplay() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        chatMessages.innerHTML = '';
        this.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.userId === socket.userId ? 'own-message' : ''}`;
            messageElement.innerHTML = `
                <div class="message-header">
                    <span class="message-user">${message.userId}</span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    ${this.formatMessageContent(message.content)}
                </div>
                <div class="message-status">
                    ${this.getMessageStatus(message)}
                </div>
            `;
            chatMessages.appendChild(messageElement);
        });
    }

    formatMessageContent(content) {
        // Convertir les URLs en liens cliquables
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    getMessageStatus(message) {
        if (message.userId === socket.userId) {
            return `
                <span class="status-icon ${message.status}">
                    ${message.status === 'read' ? '✓✓' : '✓'}
                </span>
            `;
        }
        return '';
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

// Initialiser le gestionnaire de chat
const chatManager = new ChatManager(); 