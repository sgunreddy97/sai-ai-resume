// frontend/assets/js/chatbot.js

// Chatbot global variables
let chatMode = 'strict'; // 'strict' or 'open'
let chatSession = null;
let isTyping = false;
let chatHistory = [];

// Initialize chatbot
document.addEventListener('DOMContentLoaded', function() {
    initializeChatbot();
});

function initializeChatbot() {
    // Generate unique session ID
    chatSession = generateSessionId();
    
    // Add event listeners
    setupChatEventListeners();
    
    // Initialize chat with welcome message
    addWelcomeMessage();
    
    // Make chatbot resizable
    makeChatbotResizable();
    
    console.log('Chatbot initialized with session:', chatSession);
}

function generateSessionId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function setupChatEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatFab = document.getElementById('chatFab');
    
    // Chat input events
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        chatInput.addEventListener('input', handleTypingIndicator);
    }
    
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Floating action button
    if (chatFab) {
        chatFab.addEventListener('click', openChatBot);
    }
}

function addWelcomeMessage() {
    const welcomeMessages = [
        "👋 Hi! I'm Sai's AI twin. I know everything about his experience, skills, and projects.",
        "🤖 I'm currently in **Strict Mode** - I'll focus on his professional background.",
        "💡 You can toggle to **Open Mode** using the button above to chat about anything!",
        "✨ Try clicking on any part of his resume or just ask me questions directly."
    ];
    
    welcomeMessages.forEach((message, index) => {
        setTimeout(() => {
            addChatMessage('ai', message, false);
        }, index * 1000);
    });
    
    // Add quick start suggestions after welcome messages
    setTimeout(() => {
        addQuickSuggestions([
            "Tell me about Sai's AI/ML experience",
            "What are his key achievements?",
            "Show me his recent projects",
            "What makes him a great hire?"
        ]);
    }, welcomeMessages.length * 1000 + 500);
}

function openChatBot() {
    const chatbot = document.getElementById('chatbot');
    const chatFab = document.getElementById('chatFab');
    
    if (chatbot && chatFab) {
        chatbot.style.display = 'flex';
        chatFab.style.display = 'none';
        
        // Animation
        chatbot.style.opacity = '0';
        chatbot.style.transform = 'translateY(20px) scale(0.9)';
        
        setTimeout(() => {
            chatbot.style.transition = 'all 0.3s ease';
            chatbot.style.opacity = '1';
            chatbot.style.transform = 'translateY(0) scale(1)';
        }, 10);
        
        // Focus on input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 300);
        }
        
        // Track chat open
        trackEvent('chatbot_open', {
            session: chatSession,
            mode: chatMode
        });
    }
}

function closeChat() {
    const chatbot = document.getElementById('chatbot');
    const chatFab = document.getElementById('chatFab');
    
    if (chatbot && chatFab) {
        chatbot.style.transition = 'all 0.3s ease';
        chatbot.style.opacity = '0';
        chatbot.style.transform = 'translateY(20px) scale(0.9)';
        
        setTimeout(() => {
            chatbot.style.display = 'none';
            chatFab.style.display = 'flex';
        }, 300);
        
        // Track chat close
        trackEvent('chatbot_close', {
            session: chatSession,
            messages_sent: chatHistory.filter(m => m.sender === 'user').length
        });
    }
}

function minimizeChat() {
    const chatbot = document.getElementById('chatbot');
    const chatFab = document.getElementById('chatFab');
    
    if (chatbot && chatFab) {
        chatbot.style.display = 'none';
        chatFab.style.display = 'flex';
        
        // Show minimized indicator
        chatFab.innerHTML = '<span class="fab-icon">💬</span><span class="chat-badge">1</span>';
        
        // Track minimize
        trackEvent('chatbot_minimize', { session: chatSession });
    }
}

function toggleChatMode() {
    const modeToggle = document.getElementById('modeToggle');
    const modeText = document.getElementById('modeText');
    
    chatMode = chatMode === 'strict' ? 'open' : 'strict';
    
    if (modeText) {
        modeText.textContent = chatMode === 'strict' ? 'Strict' : 'Open';
    }
    
    if (modeToggle) {
        modeToggle.style.background = chatMode === 'strict' 
            ? 'rgba(102, 126, 234, 0.2)' 
            : 'rgba(0, 212, 255, 0.2)';
    }
    
    // Add mode change message
    const modeMessage = chatMode === 'strict'
        ? "🔒 Switched to **Strict Mode** - I'll focus on Sai's professional background and always highlight his strengths!"
        : "🌟 Switched to **Open Mode** - I can chat about anything, but I'll always relate it back to Sai's amazing qualities!";
    
    addChatMessage('ai', modeMessage, false);
    
    // Track mode change
    trackEvent('chat_mode_toggle', {
        session: chatSession,
        new_mode: chatMode
    });
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message || isTyping) return;
    
    // Clear input
    chatInput.value = '';
    
    // Add user message
    addChatMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to API
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                mode: chatMode,
                context: getContextualInformation(),
                session_id: chatSession
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add AI response
            addChatMessage('ai', result.response);
            
            // Add follow-up suggestions
            if (result.suggestions && result.suggestions.length > 0) {
                setTimeout(() => {
                    addQuickSuggestions(result.suggestions);
                }, 1000);
            }
        } else {
            hideTypingIndicator();
            addChatMessage('ai', "I'm having trouble processing that right now. Could you try rephrasing your question?");
        }
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        
        // Fallback response
        const fallbackResponse = getFallbackResponse(message);
        addChatMessage('ai', fallbackResponse);
    }
    
    // Track message
    trackEvent('chat_message', {
        session: chatSession,
        mode: chatMode,
        message_length: message.length,
        user_message: message.substring(0, 100) // First 100 chars for analysis
    });
}

function sendChatMessage(message) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = message;
        sendMessage();
    }
}

function addChatMessage(sender, message, animate = true) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    if (animate) {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
    }
    
    // Create message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Process markdown-style formatting
    const formattedMessage = formatMessage(message);
    messageContent.innerHTML = formattedMessage;
    
    messageDiv.appendChild(messageContent);
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    messageDiv.appendChild(timestamp);
    
    chatMessages.appendChild(messageDiv);
    
    // Animation
    if (animate) {
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Scroll to bottom
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, animate ? 400 : 0);
    
    // Store in history
    chatHistory.push({
        sender: sender,
        message: message,
        timestamp: Date.now()
    });
    
    // Add "Tell me more" button for AI responses
    if (sender === 'ai' && message.length > 100) {
        setTimeout(() => {
            addTellMeMoreButton(messageDiv);
        }, 500);
    }
}

function formatMessage(message) {
    // Simple markdown-like formatting
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        // Convert emojis and special characters
        .replace(/:\)/g, '😊')
        .replace(/:\(/g, '😞')
        .replace(/<3/g, '❤️');
}

function addTellMeMoreButton(messageElement) {
    const tellMeMoreBtn = document.createElement('button');
    tellMeMoreBtn.className = 'tell-me-more-btn';
    tellMeMoreBtn.textContent = 'Tell me more 📖';
    tellMeMoreBtn.onclick = () => {
        const lastAiMessage = chatHistory.filter(m => m.sender === 'ai').pop();
        if (lastAiMessage) {
            sendChatMessage("Tell me more about that in detail");
        }
    };
    
    messageElement.appendChild(tellMeMoreBtn);
}

function addQuickSuggestions(suggestions) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages || !suggestions.length) return;
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'quick-suggestions';
    
    const title = document.createElement('div');
    title.className = 'suggestions-title';
    title.textContent = 'Quick questions:';
    suggestionsDiv.appendChild(title);
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    
    suggestions.forEach((suggestion, index) => {
        const suggestionBtn = document.createElement('button');
        suggestionBtn.className = 'suggestion-btn';
        suggestionBtn.textContent = suggestion;
        suggestionBtn.onclick = () => {
            sendChatMessage(suggestion);
            // Remove suggestions after click
            setTimeout(() => {
                if (suggestionsDiv.parentNode) {
                    suggestionsDiv.remove();
                }
            }, 100);
        };
        
        // Staggered animation
        suggestionBtn.style.animationDelay = (index * 0.1) + 's';
        suggestionsContainer.appendChild(suggestionBtn);
    });
    
    suggestionsDiv.appendChild(suggestionsContainer);
    chatMessages.appendChild(suggestionsDiv);
    
    // Scroll to show suggestions
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages || isTyping) return;
    
    isTyping = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    typingContent.innerHTML = `
        <div class="typing-animation">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    typingDiv.appendChild(typingContent);
    chatMessages.appendChild(typingDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

function handleTypingIndicator() {
    // Show that user is typing (visual feedback)
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (sendBtn && chatInput) {
        if (chatInput.value.trim()) {
            sendBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            sendBtn.style.transform = 'scale(1.05)';
        } else {
            sendBtn.style.background = '';
            sendBtn.style.transform = '';
        }
    }
}

function getContextualInformation() {
    // Get current section and any selected text for context
    const context = {
        current_section: currentSection || 'home',
        selected_text: selectedText || '',
        page_url: window.location.href,
        user_agent: navigator.userAgent.substring(0, 100)
    };
    
    return JSON.stringify(context);
}

function getFallbackResponse(message) {
    const messageLower = message.toLowerCase();
    
    // Predefined responses for common questions
    const responses = {
        experience: "Sai has 5+ years of AI/ML engineering experience! He worked at Ericsson Canada building production-scale systems that processed 100M+ daily events. He reduced customer query resolution time by 41% using fine-tuned LLMs. Want to know more about any specific role?",
        
        skills: "Sai is a Python expert with deep knowledge in TensorFlow, PyTorch, and Hugging Face. He's also skilled in cloud platforms like AWS, GCP, and Azure. His specialties include LLM fine-tuning, RAG systems, and MLOps. Which technology interests you most?",
        
        projects: "Sai has worked on amazing projects including LLM classification fine-tuning, multilingual speech recognition, and innovative IoT solutions for accessibility. His bus identification system for visually impaired people won university recognition! Want details on any project?",
        
        education: "Sai is currently pursuing his Master's in AI at Oklahoma Christian University with a 4.0 GPA. He also has a PG Diploma from Conestoga College and B.Tech from JNTU Hyderabad. He was always top 1% in mathematics and competitive exams!",
        
        personality: "Sai is naturally curious, jovial, and passionate about helping others. He loves space exploration, mathematics, camping, and wants to adopt and educate 10 underprivileged children. He believes education is key to everything and uses technology to better society!",
        
        default: "That's a great question! Sai is an exceptional AI/ML engineer with 5+ years of experience building production systems. He's passionate about using technology to solve real problems and help others. What specific aspect of his background would you like to explore?"
    };
    
    // Match keywords to responses
    if (messageLower.includes('experience') || messageLower.includes('work') || messageLower.includes('job')) {
        return responses.experience;
    } else if (messageLower.includes('skill') || messageLower.includes('technology') || messageLower.includes('tools')) {
        return responses.skills;
    } else if (messageLower.includes('project') || messageLower.includes('portfolio')) {
        return responses.projects;
    } else if (messageLower.includes('education') || messageLower.includes('degree') || messageLower.includes('university')) {
        return responses.education;
    } else if (messageLower.includes('personality') || messageLower.includes('hobby') || messageLower.includes('interests')) {
        return responses.personality;
    } else {
        return responses.default;
    }
}

// Make chatbot resizable
function makeChatbotResizable() {
    const chatbot = document.getElementById('chatbot');
    if (!chatbot) return;
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.innerHTML = '↘️';
    chatbot.appendChild(resizeHandle);
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(chatbot).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(chatbot).height, 10);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
        
        e.preventDefault();
    });
    
    function handleMouseMove(e) {
        if (!isResizing) return;
        
        const newWidth = startWidth + (e.clientX - startX);
        const newHeight = startHeight + (e.clientY - startY);
        
        // Set minimum and maximum sizes
        const minWidth = 300;
        const maxWidth = window.innerWidth * 0.8;
        const minHeight = 400;
        const maxHeight = window.innerHeight * 0.8;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            chatbot.style.width = newWidth + 'px';
        }
        
        if (newHeight >= minHeight && newHeight <= maxHeight) {
            chatbot.style.height = newHeight + 'px';
        }
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResize);
    }
}

// Voice input functionality (optional enhancement)
function initializeVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Add voice button to chat input
    const chatInput = document.getElementById('chatInput');
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'voice-btn';
    voiceBtn.innerHTML = '🎤';
    voiceBtn.title = 'Voice input';
    
    if (chatInput && chatInput.parentNode) {
        chatInput.parentNode.appendChild(voiceBtn);
    }
    
    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.style.color = '#f87171';
        voiceBtn.innerHTML = '🔴';
    });
    
    recognition.addEventListener('result', (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        voiceBtn.style.color = '';
        voiceBtn.innerHTML = '🎤';
    });
    
    recognition.addEventListener('end', () => {
        voiceBtn.style.color = '';
        voiceBtn.innerHTML = '🎤';
    });
    
    recognition.addEventListener('error', () => {
        voiceBtn.style.color = '';
        voiceBtn.innerHTML = '🎤';
    });
}

// Chat export functionality
function exportChatHistory() {
    const chatData = {
        session_id: chatSession,
        mode: chatMode,
        timestamp: new Date().toISOString(),
        messages: chatHistory
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sai_chat_${chatSession}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Clear chat history
function clearChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    chatHistory = [];
    
    // Re-add welcome message
    setTimeout(() => {
        addWelcomeMessage();
    }, 500);
    
    trackEvent('chat_clear', { session: chatSession });
}

// Add CSS for chatbot styling
const chatbotStyle = document.createElement('style');
chatbotStyle.textContent = `
    /* Chatbot Styles */
    .chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 500px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-xl), var(--shadow-glow);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: none;
        flex-direction: column;
        z-index: 1000;
        backdrop-filter: blur(20px);
        resize: both;
        overflow: hidden;
        min-width: 300px;
        min-height: 400px;
        max-width: 80vw;
        max-height: 80vh;
    }
    
    .chatbot-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(102, 126, 234, 0.1);
    }
    
    .bot-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }
    
    .bot-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        animation: bot-pulse 2s ease-in-out infinite;
    }
    
    @keyframes bot-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    .bot-details {
        display: flex;
        flex-direction: column;
    }
    
    .bot-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 1rem;
    }
    
    .bot-status {
        font-size: 0.8rem;
        color: var(--success-color);
    }
    
    .chat-controls {
        display: flex;
        gap: var(--spacing-xs);
    }
    
    .mode-toggle, .minimize-btn, .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--border-radius-sm);
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
    }
    
    .mode-toggle {
        width: auto;
        padding: 0 var(--spacing-sm);
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .mode-toggle:hover, .minimize-btn:hover, .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }
    
    .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }
    
    .chat-message {
        display: flex;
        flex-direction: column;
        max-width: 80%;
        animation: messageSlideIn 0.3s ease-out;
    }
    
    @keyframes messageSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .chat-message.user {
        align-self: flex-end;
    }
    
    .chat-message.ai {
        align-self: flex-start;
    }
    
    .message-content {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        line-height: 1.5;
        word-wrap: break-word;
    }
    
    .chat-message.user .message-content {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border-bottom-right-radius: 4px;
    }
    
    .chat-message.ai .message-content {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-bottom-left-radius: 4px;
        border: 1px solid rgba(102, 126, 234, 0.2);
    }
    
    .message-timestamp {
        font-size: 0.7rem;
        color: var(--text-muted);
        margin-top: var(--spacing-xs);
        padding: 0 var(--spacing-sm);
    }
    
    .chat-message.user .message-timestamp {
        text-align: right;
    }
    
    .typing-indicator {
        opacity: 0.7;
    }
    
    .typing-animation {
        display: flex;
        gap: 4px;
        padding: var(--spacing-sm);
    }
    
    .typing-animation span {
        width: 8px;
        height: 8px;
        background: var(--primary-color);
        border-radius: 50%;
        animation: typing-bounce 1.4s ease-in-out infinite;
    }
    
    .typing-animation span:nth-child(1) { animation-delay: -0.32s; }
    .typing-animation span:nth-child(2) { animation-delay: -0.16s; }
    .typing-animation span:nth-child(3) { animation-delay: 0s; }
    
    @keyframes typing-bounce {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1.2); opacity: 1; }
    }
    
    .chatbot-input {
        display: flex;
        padding: var(--spacing-md);
        gap: var(--spacing-sm);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
    }
    
    .chatbot-input input {
        flex: 1;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--border-radius);
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        font-size: 0.9rem;
        outline: none;
        transition: all 0.3s ease;
    }
    
    .chatbot-input input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }
    
    .chatbot-input input::placeholder {
        color: var(--text-muted);
    }
    
    .chatbot-input button {
        padding: var(--spacing-sm) var(--spacing-md);
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        white-space: nowrap;
    }
    
    .chatbot-input button:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    
    .chat-fab {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        box-shadow: var(--shadow-lg), var(--shadow-glow);
        transition: all 0.3s ease;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .chat-fab:hover {
        transform: scale(1.1);
        box-shadow: var(--shadow-xl), 0 0 30px rgba(102, 126, 234, 0.5);
    }
    
    .fab-icon {
        animation: fab-bounce 2s ease-in-out infinite;
    }
    
    @keyframes fab-bounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
    }
    
    .chat-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--error-color);
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: bold;
    }
    
    .quick-suggestions {
        margin: var(--spacing-md) 0;
        animation: suggestionsSlideIn 0.5s ease-out;
    }
    
    @keyframes suggestionsSlideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .suggestions-title {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: var(--spacing-sm);
        font-weight: 500;
    }
    
    .suggestions-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }
    
    .suggestion-btn {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: var(--border-radius-sm);
        color: var(--primary-color);
        cursor: pointer;
        font-size: 0.8rem;
        text-align: left;
        transition: all 0.3s ease;
        animation: suggestionFadeIn 0.3s ease-out;
    }
    
    @keyframes suggestionFadeIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    .suggestion-btn:hover {
        background: rgba(102, 126, 234, 0.2);
        transform: translateX(5px);
    }
    
    .tell-me-more-btn {
        margin-top: var(--spacing-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: transparent;
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: var(--border-radius-sm);
        color: var(--primary-color);
        cursor: pointer;
        font-size: 0.7rem;
        transition: all 0.3s ease;
    }
    
    .tell-me-more-btn:hover {
        background: rgba(102, 126, 234, 0.1);
        transform: scale(1.05);
    }
    
    .text-popup {
        position: absolute;
        background: var(--bg-secondary);
        border: 1px solid var(--primary-color);
        border-radius: var(--border-radius-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        display: none;
        backdrop-filter: blur(10px);
        transition: all 0.2s ease;
    }
    
    .text-popup button {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border: none;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nw-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        color: var(--text-muted);
        user-select: none;
    }
    
    .resize-handle:hover {
        color: var(--primary-color);
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .chatbot-container {
            bottom: 10px;
            right: 10px;
            left: 10px;
            width: auto;
            max-width: none;
        }
        
        .chat-fab {
            bottom: 10px;
            right: 10px;
        }
    }
`;
document.head.appendChild(chatbotStyle);

// Export functions for use by other scripts
window.chatbotApp = {
    openChatBot,
    closeChat,
    minimizeChat,
    toggleChatMode,
    sendChatMessage,
    addChatMessage,
    clearChatHistory,
    exportChatHistory
};