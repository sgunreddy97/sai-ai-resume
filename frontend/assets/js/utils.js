// frontend/assets/js/utils.js

// Utility functions for the AI Resume Website

// DOM Utilities
const DOM = {
    // Safe element selector
    select: (selector, context = document) => {
        try {
            return context.querySelector(selector);
        } catch (e) {
            console.warn('Invalid selector:', selector);
            return null;
        }
    },
    
    // Select multiple elements
    selectAll: (selector, context = document) => {
        try {
            return context.querySelectorAll(selector);
        } catch (e) {
            console.warn('Invalid selector:', selector);
            return [];
        }
    },
    
    // Create element with attributes
    create: (tag, attributes = {}, content = '') => {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    },
    
    // Check if element is in viewport
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Smooth scroll to element
    scrollTo: (element, offset = 0) => {
        const elementTop = element.offsetTop - offset;
        window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
        });
    },
    
    // Add class with animation
    addClassWithDelay: (element, className, delay = 0) => {
        setTimeout(() => {
            element.classList.add(className);
        }, delay);
    }
};

// Animation Utilities
const Animation = {
    // Fade in element
    fadeIn: (element, duration = 300) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const fadeAnimation = element.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: duration,
            fill: 'forwards'
        });
        
        return fadeAnimation.finished;
    },
    
    // Fade out element
    fadeOut: (element, duration = 300) => {
        const fadeAnimation = element.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: duration,
            fill: 'forwards'
        });
        
        fadeAnimation.addEventListener('finish', () => {
            element.style.display = 'none';
        });
        
        return fadeAnimation.finished;
    },
    
    // Slide in from direction
    slideIn: (element, direction = 'up', duration = 300, distance = 30) => {
        const transforms = {
            up: `translateY(${distance}px)`,
            down: `translateY(-${distance}px)`,
            left: `translateX(${distance}px)`,
            right: `translateX(-${distance}px)`
        };
        
        element.style.transform = transforms[direction];
        element.style.opacity = '0';
        
        const slideAnimation = element.animate([
            { 
                transform: transforms[direction], 
                opacity: 0 
            },
            { 
                transform: 'translateY(0) translateX(0)', 
                opacity: 1 
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });
        
        return slideAnimation.finished;
    },
    
    // Bounce animation
    bounce: (element, intensity = 10, duration = 600) => {
        const bounceAnimation = element.animate([
            { transform: 'translateY(0px)' },
            { transform: `translateY(-${intensity}px)` },
            { transform: 'translateY(0px)' },
            { transform: `translateY(-${intensity/2}px)` },
            { transform: 'translateY(0px)' }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        });
        
        return bounceAnimation.finished;
    },
    
    // Pulse animation
    pulse: (element, scale = 1.05, duration = 800) => {
        const pulseAnimation = element.animate([
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` },
            { transform: 'scale(1)' }
        ], {
            duration: duration,
            easing: 'ease-in-out'
        });
        
        return pulseAnimation.finished;
    },
    
    // Typing effect
    typeText: (element, text, speed = 50) => {
        element.textContent = '';
        let index = 0;
        
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                element.textContent += text[index];
                index++;
                
                if (index >= text.length) {
                    clearInterval(timer);
                    resolve();
                }
            }, speed);
        });
    }
};

// String Utilities
const StringUtils = {
    // Truncate text
    truncate: (text, maxLength, suffix = '...') => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    },
    
    // Capitalize first letter
    capitalize: (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    },
    
    // Convert to title case
    toTitleCase: (text) => {
        return text.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },
    
    // Generate random ID
    generateId: (prefix = 'id', length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix + '_';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    // Strip HTML tags
    stripHtml: (html) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    },
    
    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Date Utilities
const DateUtils = {
    // Format date
    format: (date, format = 'MM/DD/YYYY') => {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        
        return format
            .replace('MM', month)
            .replace('DD', day)
            .replace('YYYY', year);
    },
    
    // Time ago format
    timeAgo: (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count > 0) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    },
    
    // Duration format
    formatDuration: (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
};

// Storage Utilities
const Storage = {
    // Set item with expiration
    set: (key, value, expirationMinutes = null) => {
        const item = {
            value: value,
            timestamp: Date.now(),
            expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
            return false;
        }
    },
    
    // Get item with expiration check
    get: (key, defaultValue = null) => {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return defaultValue;
            
            const item = JSON.parse(itemStr);
            
            // Check expiration
            if (item.expiration && Date.now() > item.expiration) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            
            return item.value;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },
    
    // Remove item
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
            return false;
        }
    },
    
    // Clear all items
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
            return false;
        }
    }
};

// Device Detection
const Device = {
    // Check if mobile
    isMobile: () => {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Check if tablet
    isTablet: () => {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    // Check if desktop
    isDesktop: () => {
        return window.innerWidth > 1024;
    },
    
    // Check if touch device
    isTouchDevice: () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    // Get device info
    getInfo: () => {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            deviceType: Device.isMobile() ? 'mobile' : Device.isTablet() ? 'tablet' : 'desktop',
            isTouch: Device.isTouchDevice()
        };
    }
};

// Performance Utilities
const Performance = {
    // Debounce function
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Measure execution time
    measure: (name, func) => {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
        return result;
    },
    
    // Lazy load images
    lazyLoadImages: (selector = '[data-src]') => {
        const images = document.querySelectorAll(selector);
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    },
    
    // Preload images
    preloadImages: (urls) => {
        const promises = urls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
        });
        
        return Promise.all(promises);
    }
};

// API Utilities
const API = {
    // Base fetch wrapper
    request: async (url, options = {}) => {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // GET request
    get: (url, params = {}) => {
        const urlWithParams = new URL(url);
        Object.keys(params).forEach(key => 
            urlWithParams.searchParams.append(key, params[key])
        );
        
        return API.request(urlWithParams.toString());
    },
    
    // POST request
    post: (url, data = {}) => {
        return API.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    // PUT request
    put: (url, data = {}) => {
        return API.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    // DELETE request
    delete: (url) => {
        return API.request(url, {
            method: 'DELETE',
        });
    }
};

// Form Utilities
const FormUtils = {
    // Serialize form data
    serialize: (form) => {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    // Validate email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate phone
    isValidPhone: (phone) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },
    
    // Auto-resize textarea
    autoResize: (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
};

// Color Utilities
const ColorUtils = {
    // Convert hex to RGB
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    // Convert RGB to hex
    rgbToHex: (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    // Get contrast color (black or white)
    getContrastColor: (hex) => {
        const rgb = ColorUtils.hexToRgb(hex);
        if (!rgb) return '#000000';
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }
};

// Error Handling
const ErrorHandler = {
    // Global error handler
    init: () => {
        window.addEventListener('error', (e) => {
            ErrorHandler.logError('JavaScript Error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack
            });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            ErrorHandler.logError('Unhandled Promise Rejection', {
                reason: e.reason,
                stack: e.reason?.stack
            });
        });
    },
    
    // Log error
    logError: (type, details) => {
        console.error(`${type}:`, details);
        
        // Send to analytics if available
        if (window.trackAnalyticsEvent) {
            window.trackAnalyticsEvent('error', {
                error_type: type,
                ...details
            });
        }
        
        // Could also send to error reporting service
        // ErrorHandler.sendToErrorService(type, details);
    },
    
    // Wrap async function with error handling
    wrapAsync: (asyncFn) => {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                ErrorHandler.logError('Async Function Error', {
                    function_name: asyncFn.name,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        };
    }
};

// Notification System
const Notifications = {
    // Show notification
    show: (message, type = 'info', duration = 5000) => {
        const notification = DOM.create('div', {
            className: `notification notification-${type}`,
            innerHTML: `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `
        });
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove
        const removeNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', removeNotification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(removeNotification, duration);
        }
        
        return notification;
    },
    
    success: (message, duration) => Notifications.show(message, 'success', duration),
    error: (message, duration) => Notifications.show(message, 'error', duration),
    warning: (message, duration) => Notifications.show(message, 'warning', duration),
    info: (message, duration) => Notifications.show(message, 'info', duration)
};

// Initialize utilities
document.addEventListener('DOMContentLoaded', () => {
    // Initialize error handling
    ErrorHandler.init();
    
    // Initialize performance optimizations
    Performance.lazyLoadImages();
    
    // Add utility classes to body based on device
    document.body.classList.add(
        Device.isMobile() ? 'mobile' : Device.isTablet() ? 'tablet' : 'desktop'
    );
    
    if (Device.isTouchDevice()) {
        document.body.classList.add('touch');
    }
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success { background: #10b981; }
    .notification-error { background: #ef4444; }
    .notification-warning { background: #f59e0b; }
    .notification-info { background: #3b82f6; }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Export utilities for global access
window.Utils = {
    DOM,
    Animation,
    StringUtils,
    DateUtils,
    Storage,
    Device,
    Performance,
    API,
    FormUtils,
    ColorUtils,
    ErrorHandler,
    Notifications
};