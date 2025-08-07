# backend/utils/analytics.py
import json
import os
from datetime import datetime
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class AnalyticsTracker:
    def __init__(self):
        self.analytics_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'analytics.json')
        self.ensure_analytics_file()
    
    def ensure_analytics_file(self):
        """Ensure analytics file exists with default structure"""
        if not os.path.exists(self.analytics_file):
            default_analytics = {
                'visits': [],
                'chat_interactions': [],
                'page_views': {},
                'popular_sections': {},
                'user_agents': {},
                'countries': {},
                'total_visits': 0,
                'total_chats': 0
            }
            self.save_analytics(default_analytics)
    
    def load_analytics(self):
        """Load analytics data from file"""
        try:
            with open(self.analytics_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            logger.error("Failed to load analytics data")
            return {}
    
    def save_analytics(self, data):
        """Save analytics data to file"""
        try:
            os.makedirs(os.path.dirname(self.analytics_file), exist_ok=True)
            with open(self.analytics_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            logger.error(f"Failed to save analytics: {str(e)}")
            return False
    
    def track_visit(self, visitor_info):
        """Track a page visit"""
        analytics = self.load_analytics()
        
        visit_data = {
            'timestamp': datetime.now().isoformat(),
            'ip': visitor_info.get('ip', 'unknown'),
            'user_agent': visitor_info.get('user_agent', 'unknown'),
            'page': visitor_info.get('page', 'main')
        }
        
        analytics['visits'].append(visit_data)
        analytics['total_visits'] = analytics.get('total_visits', 0) + 1
        
        # Update user agents stats
        ua = visitor_info.get('user_agent', 'unknown')[:50]  # Truncate for privacy
        analytics['user_agents'][ua] = analytics['user_agents'].get(ua, 0) + 1
        
        # Keep only last 1000 visits to manage file size
        analytics['visits'] = analytics['visits'][-1000:]
        
        self.save_analytics(analytics)
        logger.info(f"Tracked visit from {visitor_info.get('ip', 'unknown')}")
    
    def track_chat_interaction(self, session_id, message, mode):
        """Track a chat interaction"""
        analytics = self.load_analytics()
        
        chat_data = {
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'message_length': len(message),
            'mode': mode,
            'message_preview': message[:50]  # First 50 chars for analysis
        }
        
        analytics['chat_interactions'].append(chat_data)
        analytics['total_chats'] = analytics.get('total_chats', 0) + 1
        
        # Keep only last 500 chat interactions
        analytics['chat_interactions'] = analytics['chat_interactions'][-500:]
        
        self.save_analytics(analytics)
        logger.info(f"Tracked chat interaction in {mode} mode")
    
    def get_analytics_summary(self):
        """Get comprehensive analytics summary"""
        analytics = self.load_analytics()
        
        # Calculate summary stats
        total_visits = analytics.get('total_visits', 0)
        total_chats = analytics.get('total_chats', 0)
        
        # Recent activity (last 30 days)
        thirty_days_ago = (datetime.now().replace(microsecond=0) - 
                          datetime.timedelta(days=30)).isoformat()
        
        recent_visits = [v for v in analytics.get('visits', []) 
                        if v['timestamp'] >= thirty_days_ago]
        recent_chats = [c for c in analytics.get('chat_interactions', []) 
                       if c['timestamp'] >= thirty_days_ago]
        
        # Top user agents
        user_agents = analytics.get('user_agents', {})
        top_browsers = sorted(user_agents.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Chat mode analysis
        chat_modes = defaultdict(int)
        for chat in analytics.get('chat_interactions', []):
            chat_modes[chat.get('mode', 'unknown')] += 1
        
        # Daily activity for the last 7 days
        daily_activity = {}
        for i in range(7):
            date = (datetime.now() - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
            daily_visits = len([v for v in recent_visits 
                              if v['timestamp'].startswith(date)])
            daily_chats = len([c for c in recent_chats 
                             if c['timestamp'].startswith(date)])
            daily_activity[date] = {
                'visits': daily_visits,
                'chats': daily_chats
            }
        
        return {
            'overview': {
                'total_visits': total_visits,
                'total_chats': total_chats,
                'recent_visits_30d': len(recent_visits),
                'recent_chats_30d': len(recent_chats),
                'conversion_rate': round((total_chats / max(total_visits, 1)) * 100, 2)
            },
            'daily_activity': daily_activity,
            'top_browsers': dict(top_browsers),
            'chat_modes': dict(chat_modes),
            'recent_activity': {
                'last_visit': analytics.get('visits', [])[-1] if analytics.get('visits') else None,
                'last_chat': analytics.get('chat_interactions', [])[-1] if analytics.get('chat_interactions') else None
            }
        }