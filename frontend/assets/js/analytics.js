// frontend/assets/js/analytics.js

// Custom Analytics Implementation
class AnalyticsManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.isActive = true;
        this.lastActivity = Date.now();
        
        this.init();
    }
    
    init() {
        // Track page load
        this.trackEvent('page_load', {
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start session tracking
        this.startSessionTracking();
        
        console.log('Analytics initialized with session:', this.sessionId);
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupEventListeners() {
        // Track clicks on important elements
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Track scroll behavior
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScrollDepth();
            }, 250);
        });
        
        // Track time spent on page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_blur', {
                    time_spent: Date.now() - this.lastActivity
                });
            } else {
                this.lastActivity = Date.now();
                this.trackEvent('page_focus');
            }
        });
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_unload', {
                total_time_spent: Date.now() - this.startTime,
                total_events: this.events.length
            });
            this.sendAnalytics();
        });
        
        // Track mouse movement patterns (basic heatmap data)
        let mouseMoveTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                this.trackMousePosition(e.clientX, e.clientY);
            }, 1000);
        });
        
        // Track form interactions
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.trackEvent('form_interaction', {
                    element_type: e.target.type,
                    element_name: e.target.name || e.target.id,
                    has_value: e.target.value.length > 0
                });
            }
        });
        
        // Track errors
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno
            });
        });
    }
    
    handleClick(e) {
        const element = e.target;
        const elementData = this.getElementData(element);
        
        this.trackEvent('click', {
            element_type: element.tagName.toLowerCase(),
            element_class: element.className,
            element_id: element.id,
            element_text: element.textContent?.substring(0, 100),
            position: {
                x: e.clientX,
                y: e.clientY
            },
            ...elementData
        });
        
        // Special tracking for important elements
        if (element.matches('.nav-link')) {
            this.trackEvent('navigation', {
                target_section: element.getAttribute('href'),
                nav_text: element.textContent
            });
        }
        
        if (element.matches('.download-btn')) {
            this.trackEvent('download_attempt', {
                button_text: element.textContent
            });
        }
        
        if (element.matches('.project-card, .project-btn')) {
            this.trackEvent('project_interest', {
                project: element.dataset.project || 'unknown'
            });
        }
        
        if (element.matches('.skill-item')) {
            this.trackEvent('skill_click', {
                skill: element.dataset.skill || element.textContent
            });
        }
    }
    
    getElementData(element) {
        const rect = element.getBoundingClientRect();
        return {
            element_position: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            },
            in_viewport: this.isInViewport(element)
        };
    }
    
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    trackScrollDepth() {
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        
        // Track significant scroll milestones
        const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
            if (scrollPercent >= milestone && !this.scrollMilestones?.[milestone]) {
                this.scrollMilestones = this.scrollMilestones || {};
                this.scrollMilestones[milestone] = true;
                
                this.trackEvent('scroll_depth', {
                    percentage: milestone,
                    absolute_position: window.scrollY
                });
            }
        });
    }
    
    trackMousePosition(x, y) {
        // Simple heatmap data - store mouse positions in grid format
        const gridSize = 50;
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        
        this.heatmapData = this.heatmapData || {};
        const key = `${gridX},${gridY}`;
        this.heatmapData[key] = (this.heatmapData[key] || 0) + 1;
        
        // Occasionally send heatmap data
        if (Object.keys(this.heatmapData).length % 20 === 0) {
            this.trackEvent('heatmap_data', {
                grid_size: gridSize,
                hot_spots: Object.entries(this.heatmapData)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([pos, count]) => ({ position: pos, count }))
            });
        }
    }
    
    startSessionTracking() {
        // Track session activity every 30 seconds
        setInterval(() => {
            if (this.isActive) {
                this.trackEvent('session_ping', {
                    time_elapsed: Date.now() - this.startTime,
                    current_section: this.getCurrentSection()
                });
            }
        }, 30000);
        
        // Track inactive sessions
        let inactivityTimeout;
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimeout);
            this.isActive = true;
            
            inactivityTimeout = setTimeout(() => {
                this.isActive = false;
                this.trackEvent('session_inactive');
            }, 5 * 60 * 1000); // 5 minutes
        };
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });
        
        resetInactivityTimer();
    }
    
    getCurrentSection() {
        // Determine which section is currently visible
        const sections = document.querySelectorAll('.section');
        let currentSection = 'unknown';
        
        sections.forEach(section => {
            if (section.classList.contains('active')) {
                currentSection = section.id;
            }
        });
        
        return currentSection;
    }
    
    trackEvent(eventName, eventData = {}) {
        const event = {
            event: eventName,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            ...eventData
        };
        
        this.events.push(event);
        
        // Send events in batches to avoid too many requests
        if (this.events.length >= 10) {
            this.sendAnalytics();
        }
        
        // Also send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        console.log('Analytics Event:', eventName, eventData);
    }
    
    async sendAnalytics() {
        if (this.events.length === 0) return;
        
        try {
            // Send to our backend
            const response = await fetch(`${API_BASE_URL}/api/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    events: this.events,
                    user_info: {
                        user_agent: navigator.userAgent,
                        language: navigator.language,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        screen_resolution: `${screen.width}x${screen.height}`,
                        color_depth: screen.colorDepth
                    }
                })
            });
            
            if (response.ok) {
                console.log(`Sent ${this.events.length} analytics events`);
                this.events = []; // Clear sent events
            }
        } catch (error) {
            console.warn('Failed to send analytics:', error);
            // Keep events for retry
        }
    }
    
    // Performance tracking
    trackPerformance() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            this.trackEvent('performance', {
                page_load_time: navigation.loadEventEnd - navigation.loadEventStart,
                dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                first_paint: paint.find(p => p.name === 'first-paint')?.startTime,
                first_contentful_paint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
                memory_used: performance.memory ? performance.memory.usedJSHeapSize : null
            });
        }
    }
    
    // A/B Testing support
    trackABTest(testName, variant) {
        this.trackEvent('ab_test', {
            test_name: testName,
            variant: variant,
            session_id: this.sessionId
        });
    }
    
    // Conversion funnel tracking
    trackFunnelStep(funnelName, step, success = true) {
        this.trackEvent('funnel_step', {
            funnel: funnelName,
            step: step,
            success: success,
            timestamp: new Date().toISOString()
        });
    }
    
    // User engagement scoring
    calculateEngagementScore() {
        const timeSpent = Date.now() - this.startTime;
        const eventsCount = this.events.length;
        const sectionsVisited = new Set(this.events
            .filter(e => e.event === 'navigation')
            .map(e => e.target_section)
        ).size;
        
        // Simple engagement scoring algorithm
        let score = 0;
        score += Math.min(timeSpent / (60 * 1000), 10) * 10; // Time factor (max 100 points for 10 minutes)
        score += Math.min(eventsCount, 50) * 2; // Event factor (max 100 points for 50 events)
        score += sectionsVisited * 20; // Section exploration (20 points per section)
        
        return Math.round(score);
    }
    
    // Get analytics summary
    getSessionSummary() {
        return {
            session_id: this.sessionId,
            start_time: new Date(this.startTime).toISOString(),
            duration: Date.now() - this.startTime,
            events_count: this.events.length,
            engagement_score: this.calculateEngagementScore(),
            sections_visited: new Set(this.events
                .filter(e => e.event === 'navigation')
                .map(e => e.target_section)
            ).size,
            most_clicked_elements: this.getMostClickedElements(),
            scroll_depth: this.getMaxScrollDepth()
        };
    }
    
    getMostClickedElements() {
        const clicks = this.events.filter(e => e.event === 'click');
        const elementCounts = {};
        
        clicks.forEach(click => {
            const key = click.element_type + (click.element_class ? '.' + click.element_class : '');
            elementCounts[key] = (elementCounts[key] || 0) + 1;
        });
        
        return Object.entries(elementCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([element, count]) => ({ element, count }));
    }
    
    getMaxScrollDepth() {
        const scrollEvents = this.events.filter(e => e.event === 'scroll_depth');
        return Math.max(0, ...scrollEvents.map(e => e.percentage));
    }
}

// Initialize analytics when DOM is ready
let analytics = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if analytics should be enabled (respect user privacy)
    const analyticsEnabled = localStorage.getItem('analytics_enabled') !== 'false';
    
    if (analyticsEnabled) {
        analytics = new AnalyticsManager();
        
        // Track performance after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                analytics.trackPerformance();
            }, 1000);
        });
    }
});

// Export for use by other scripts
function trackAnalyticsEvent(eventName, eventData = {}) {
    if (analytics) {
        analytics.trackEvent(eventName, eventData);
    }
}

function getAnalyticsSummary() {
    return analytics ? analytics.getSessionSummary() : null;
}

function enableAnalytics() {
    localStorage.setItem('analytics_enabled', 'true');
    if (!analytics) {
        analytics = new AnalyticsManager();
    }
}

function disableAnalytics() {
    localStorage.setItem('analytics_enabled', 'false');
    if (analytics) {
        analytics.sendAnalytics(); // Send final batch
        analytics = null;
    }
}

// Make functions available globally
window.trackAnalyticsEvent = trackAnalyticsEvent;
window.getAnalyticsSummary = getAnalyticsSummary;
window.enableAnalytics = enableAnalytics;
window.disableAnalytics = disableAnalytics;