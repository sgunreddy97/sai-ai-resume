// frontend/assets/js/main.js

// Global variables
let resumeData = null;
let currentTheme = 'dark';
let selectedText = '';
let currentSection = 'home';

// API Configuration
const API_BASE_URL = 'https://your-backend-url.onrender.com'; // Update with your actual backend URL

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Show loading screen
        showLoading();
        
        // Load resume data
        await loadResumeData();
        
        // Initialize all components
        initializeNavigation();
        initializeTextSelection();
        initializeAnimations();
        initializeSkillsRadar();
        initializeInteractiveElements();
        
        // Hide loading screen
        hideLoading();
        
        // Track page load
        trackEvent('page_load', {
            page: 'main_resume',
            user_agent: navigator.userAgent
        });
        
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoading();
        showErrorMessage('Failed to load resume data. Please refresh the page.');
    }
}

// Loading functions
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 1000);
    }
}

// Data loading
async function loadResumeData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/resume-data`);
        const result = await response.json();
        
        if (result.success) {
            resumeData = result.data;
            populateResumeContent();
        } else {
            throw new Error(result.error || 'Failed to load resume data');
        }
    } catch (error) {
        console.error('Error loading resume data:', error);
        // Use fallback data if API fails
        loadFallbackData();
    }
}

function loadFallbackData() {
    resumeData = {
        personal_info: {
            name: "Sai Teja Reddy",
            title: "AI/ML Engineer & Data Scientist",
            email: "saitejareddyg97@gmail.com",
            phone: "+1 (248) 803-3210",
            location: "Edmond, Oklahoma, USA"
        }
        // Add more fallback data as needed
    };
    populateResumeContent();
}

function populateResumeContent() {
    if (!resumeData) return;
    
    // Update personal information
    updatePersonalInfo();
    updateExperience();
    updateSkills();
    updateProjects();
    updateHobbies();
}

function updatePersonalInfo() {
    const personal = resumeData.personal_info;
    if (!personal) return;
    
    // Update contact information
    const emailLinks = document.querySelectorAll('[href^="mailto:"]');
    emailLinks.forEach(link => {
        link.href = `mailto:${personal.email}`;
        if (link.textContent.includes('@')) {
            link.textContent = personal.email;
        }
    });
    
    const phoneLinks = document.querySelectorAll('[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.href = `tel:${personal.phone}`;
        if (link.textContent.includes('(')) {
            link.textContent = personal.phone;
        }
    });
    
    const locationElements = document.querySelectorAll('.location');
    locationElements.forEach(elem => {
        if (elem.textContent.includes('📍')) {
            elem.textContent = `📍 ${personal.location}`;
        }
    });
}

function updateExperience() {
    const experiences = resumeData.experience || [];
    // Implementation for updating experience section
    // This would dynamically create experience timeline items
}

function updateSkills() {
    const skills = resumeData.skills || {};
    // Implementation for updating skills section
    // This would dynamically create skill bars and categories
}

function updateProjects() {
    const projects = resumeData.projects || [];
    // Implementation for updating projects section
    // This would dynamically create project cards
}

function updateHobbies() {
    const hobbies = resumeData.hobbies || [];
    // Implementation for updating hobbies section
    // This would dynamically create hobby categories
}

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('href').substring(1);
            showSection(targetSection);
            
            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            // Track navigation
            trackEvent('navigation', {
                section: targetSection,
                from: currentSection
            });
            
            currentSection = targetSection;
        });
    });
    
    // Smooth scroll for anchor links
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            scrollToSection(targetId);
        }
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollToSection(sectionId) {
    showSection(sectionId);
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    currentSection = sectionId;
}

// Text Selection and AI Explanation
function initializeTextSelection() {
    let popup = document.getElementById('textPopup');
    
    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        selectedText = selection.toString().trim();
        
        if (selectedText && selectedText.length > 5) {
            showTextPopup(e.pageX, e.pageY);
        } else {
            hideTextPopup();
        }
    });
    
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.text-popup')) {
            hideTextPopup();
        }
    });
}

function showTextPopup(x, y) {
    const popup = document.getElementById('textPopup');
    popup.style.display = 'block';
    popup.style.left = x + 'px';
    popup.style.top = (y - 50) + 'px';
    
    // Add animation
    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1)';
    }, 10);
}

function hideTextPopup() {
    const popup = document.getElementById('textPopup');
    popup.style.display = 'none';
}

async function explainSelectedText() {
    if (!selectedText) return;
    
    hideTextPopup();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/explain-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: selectedText,
                section: currentSection
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Open chatbot and show explanation
            openChatBot();
            addChatMessage('ai', `You selected: "${selectedText}"\n\n${result.explanation}`);
        } else {
            showErrorMessage('Failed to explain selected text');
        }
    } catch (error) {
        console.error('Error explaining text:', error);
        showErrorMessage('Error explaining text. Please try again.');
    }
    
    // Clear selection
    window.getSelection().removeAllRanges();
    selectedText = '';
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (currentTheme === 'dark') {
        body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
        currentTheme = 'light';
    } else {
        body.classList.remove('light-theme');
        themeToggle.textContent = '🌙';
        currentTheme = 'dark';
    }
    
    // Save theme preference
    localStorage.setItem('theme', currentTheme);
    
    // Track theme change
    trackEvent('theme_change', { theme: currentTheme });
}

// Resume Download
function downloadResume(type = null) {
    if (!type) {
        // Show modal to choose resume type
        const modal = document.getElementById('downloadModal');
        modal.style.display = 'flex';
        return;
    }
    
    // Close modal
    closeModal('downloadModal');
    
    // Download resume
    const link = document.createElement('a');
    
    if (type === 'uploaded') {
        link.href = './resumes/sai_resume.pdf';
        link.download = 'Sai_Teja_Reddy_Resume.pdf';
    } else if (type === 'dynamic') {
        // Generate dynamic resume via API
        generateDynamicResume();
        return;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track download
    trackEvent('resume_download', { type: type });
}

async function generateDynamicResume() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/download-resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'dynamic'
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Sai_Teja_Reddy_Dynamic_Resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Failed to generate dynamic resume');
        }
    } catch (error) {
        console.error('Error generating dynamic resume:', error);
        showErrorMessage('Failed to generate dynamic resume. Please try again.');
    } finally {
        hideLoading();
    }
}

// Interactive Elements
function initializeInteractiveElements() {
    // Add click handlers for all interactive elements
    addClickableEffects();
    initializeHoverEffects();
    initializeScrollAnimations();
}

function addClickableEffects() {
    // Make all resume sections clickable for explanations
    const clickableElements = document.querySelectorAll('[data-skill], [data-experience], [data-project], .stat-item, .achievement-item, .tech-tag');
    
    clickableElements.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            handleElementClick(element);
        });
        
        // Add hover cursor
        element.style.cursor = 'pointer';
    });
}

function handleElementClick(element) {
    const elementType = getElementType(element);
    const elementContent = getElementContent(element);
    
    // Open chatbot with specific question
    openChatBot();
    
    let question = '';
    switch (elementType) {
        case 'skill':
            question = `Tell me more about Sai's experience with ${elementContent}`;
            break;
        case 'experience':
            question = `What did Sai accomplish in this role?`;
            break;
        case 'project':
            question = `Tell me more details about this project`;
            break;
        case 'stat':
            question = `Explain this achievement in more detail`;
            break;
        default:
            question = `Tell me more about this: ${elementContent}`;
    }
    
    // Auto-send question to chatbot
    sendChatMessage(question);
    
    // Track interaction
    trackEvent('element_click', {
        type: elementType,
        content: elementContent.substring(0, 50)
    });
}

function getElementType(element) {
    if (element.dataset.skill) return 'skill';
    if (element.dataset.experience) return 'experience';
    if (element.dataset.project) return 'project';
    if (element.classList.contains('stat-item')) return 'stat';
    return 'general';
}

function getElementContent(element) {
    return element.textContent.trim() || element.dataset.skill || element.dataset.experience || element.dataset.project || 'this item';
}

function initializeHoverEffects() {
    // Add particle effects on hover
    const hoverElements = document.querySelectorAll('.project-card, .skill-item, .timeline-item');
    
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', createParticleEffect);
    });
}

function createParticleEffect(e) {
    const element = e.target;
    const rect = element.getBoundingClientRect();
    
    // Create particles
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle-effect';
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${rect.left + Math.random() * rect.width}px;
            top: ${rect.top + Math.random() * rect.height}px;
            animation: particle-float 1s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

// Add CSS for particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particle-float {
        0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-50px) scale(0);
        }
    }
`;
document.head.appendChild(particleStyle);

function initializeScrollAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special handling for skill bars
                if (entry.target.classList.contains('skill-item')) {
                    animateSkillBar(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe all animatable elements
    const animatableElements = document.querySelectorAll('.timeline-item, .project-card, .skill-item, .hobby-category');
    animatableElements.forEach(el => observer.observe(el));
}

function animateSkillBar(skillItem) {
    const progressBar = skillItem.querySelector('.skill-progress');
    if (progressBar) {
        const width = progressBar.style.width;
        progressBar.style.width = '0%';
        setTimeout(() => {
            progressBar.style.width = width;
        }, 200);
    }
}

// Skills Radar Chart
function initializeSkillsRadar() {
    const canvas = document.getElementById('skillsRadar');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;
    
    // Skills data
    const skills = [
        { name: 'Python', value: 0.98 },
        { name: 'AI/ML', value: 0.95 },
        { name: 'Cloud', value: 0.85 },
        { name: 'Data Science', value: 0.90 },
        { name: 'DevOps', value: 0.80 },
        { name: 'Leadership', value: 0.88 }
    ];
    
    // Animation
    let animationProgress = 0;
    const animationDuration = 2000;
    const startTime = Date.now();
    
    function drawRadar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const currentTime = Date.now();
        animationProgress = Math.min((currentTime - startTime) / animationDuration, 1);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw concentric circles
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Draw axis lines
        const angleStep = (2 * Math.PI) / skills.length;
        for (let i = 0; i < skills.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        // Draw skill polygon
        ctx.strokeStyle = '#667eea';
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < skills.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const skillRadius = radius * skills[i].value * animationProgress;
            const x = centerX + Math.cos(angle) * skillRadius;
            const y = centerY + Math.sin(angle) * skillRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw skill points
        ctx.fillStyle = '#667eea';
        for (let i = 0; i < skills.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const skillRadius = radius * skills[i].value * animationProgress;
            const x = centerX + Math.cos(angle) * skillRadius;
            const y = centerY + Math.sin(angle) * skillRadius;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Draw labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < skills.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 20;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;
            
            ctx.fillText(skills[i].name, x, y + 4);
        }
        
        // Continue animation
        if (animationProgress < 1) {
            requestAnimationFrame(drawRadar);
        }
    }
    
    drawRadar();
}

// Animations
function initializeAnimations() {
    // Add CSS animations
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .animate-in {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .tech-icon:nth-child(1) { --i: 0; }
        .tech-icon:nth-child(2) { --i: 1; }
        .tech-icon:nth-child(3) { --i: 2; }
        .tech-icon:nth-child(4) { --i: 3; }
        
        .trait:nth-child(1) { --i: 0; }
        .trait:nth-child(2) { --i: 1; }
        .trait:nth-child(3) { --i: 2; }
        .trait:nth-child(4) { --i: 3; }
        .trait:nth-child(5) { --i: 4; }
        .trait:nth-child(6) { --i: 5; }
        .trait:nth-child(7) { --i: 6; }
        .trait:nth-child(8) { --i: 7; }
    `;
    document.head.appendChild(animationStyle);
}

// Utility Functions
function showErrorMessage(message) {
    // Create and show error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #f87171;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function goBackToIntro() {
    // Smooth transition back to intro page
    document.body.style.transition = 'opacity 0.5s ease-out';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Event tracking function (placeholder)
function trackEvent(eventName, eventData = {}) {
    // This will be implemented in analytics.js
    if (window.trackAnalyticsEvent) {
        window.trackAnalyticsEvent(eventName, eventData);
    }
    console.log('Event tracked:', eventName, eventData);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to open chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openChatBot();
    }
    
    // Escape to close modals/chat
    if (e.key === 'Escape') {
        closeModal('downloadModal');
        closeChat();
    }
    
    // Number keys for quick navigation
    if (e.key >= '1' && e.key <= '7' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const sections = ['home', 'about', 'skills', 'experience', 'projects', 'hobbies', 'contact'];
        const sectionIndex = parseInt(e.key) - 1;
        if (sections[sectionIndex]) {
            showSection(sections[sectionIndex]);
        }
    }
});

// Initialize theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== currentTheme) {
        toggleTheme();
    }
});

// Project details modal (implementation placeholder)
function showProjectDetails(projectId) {
    // This would show detailed project information
    console.log('Showing details for project:', projectId);
    
    // For now, open chatbot with project question
    openChatBot();
    sendChatMessage(`Tell me all the details about the ${projectId.replace('-', ' ')} project`);
}

// Export functions for use by other scripts
window.mainApp = {
    showSection,
    scrollToSection,
    downloadResume,
    toggleTheme,
    trackEvent,
    showErrorMessage,
    explainSelectedText,
    showProjectDetails
};