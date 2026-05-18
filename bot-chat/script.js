class AIChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearChat');
        this.status = document.getElementById('status');
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.clearBtn.addEventListener('click', () => this.clearChat());
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.showStatus('AI is thinking...', 'loading');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'ai');
            this.showStatus('Online', 'success');
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            this.showStatus('Error: ' + error.message, 'error');
        }
    }
    
    async getAIResponse(userMessage) {
        // Try to use public AI API (example with OpenRouter)
        const API_KEY = 'AIzaSyBhfefLsAontTO1_l92hybZfgNg2TBDicw'; // You need to get a free API key
        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mistralai/mistral-7b-instruct:free',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant. Keep responses concise and friendly.'
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    max_tokens: 500
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            // Fallback to local responses if API fails
            return this.getLocalResponse(userMessage);
        }
    }
    
    getLocalResponse(message) {
        // Smart local responses based on keywords
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return "Hello! How are you doing today?";
        } else if (lowerMsg.includes('how are you')) {
            return "I'm doing great, thank you for asking! How can I assist you?";
        } else if (lowerMsg.includes('name')) {
            return "I'm your AI Chat Assistant. You can call me whatever you'd like!";
        } else if (lowerMsg.includes('help')) {
            return "I can help you with conversations, answer questions, or just chat! What would you like to know?";
        } else if (lowerMsg.includes('weather')) {
            return "I can't check real-time weather, but you can use a weather API for that!";
        } else if (lowerMsg.includes('thank')) {
            return "You're very welcome! Happy to help! 😊";
        } else if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye')) {
            return "Goodbye! Have a wonderful day! 👋";
        } else {
            return `That's interesting! Tell me more about "${message}". I'd love to learn more about what you're thinking.`;
        }
    }
    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typingIndicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = 'Typing<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        contentDiv.style.background = '#f0f0f0';
        
        typingDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        
        // Add animation for dots
        this.animateTypingDots();
    }
    
    animateTypingDots() {
        const dots = document.querySelectorAll('#typingIndicator .dot');
        let i = 0;
        this.typingAnimation = setInterval(() => {
            dots.forEach((dot, index) => {
                dot.style.opacity = index <= i ? '1' : '0.3';
            });
            i = (i + 1) % dots.length;
        }, 500);
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
        if (this.typingAnimation) {
            clearInterval(this.typingAnimation);
        }
    }
    
    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        setTimeout(() => {
            if (this.status.textContent === message) {
                this.status.textContent = '';
            }
        }, 3000);
    }
    
    clearChat() {
        this.chatMessages.innerHTML = '';
        this.addMessage("Hello! I'm your AI assistant. How can I help you today?", 'ai');
        this.showStatus('Chat cleared', 'success');
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
});