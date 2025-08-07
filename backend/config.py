# backend/config.py
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-key-change-in-production')
    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'
    
    # API Configuration
    TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
    TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
    DEFAULT_MODEL = "meta-llama/Llama-2-7b-chat-hf"
    
    # Admin Configuration
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'change-this-password')
    
    # File Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    RESUME_DATA_FILE = os.path.join(DATA_DIR, 'resume_data.json')
    CONVERSATIONS_FILE = os.path.join(DATA_DIR, 'conversations.json')
    ANALYTICS_FILE = os.path.join(DATA_DIR, 'analytics.json')
    EMBEDDINGS_FILE = os.path.join(DATA_DIR, 'embeddings.json')
    
    # Resume Generation
    FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), 'frontend')
    RESUMES_DIR = os.path.join(FRONTEND_DIR, 'resumes')
    GENERATED_RESUMES_DIR = os.path.join(RESUMES_DIR, 'generated')
    
    # RAG Configuration
    EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
    MAX_CONTEXT_LENGTH = 2048
    TOP_K_RESULTS = 5
    SIMILARITY_THRESHOLD = 0.3
    
    # Chat Configuration
    MAX_CHAT_HISTORY = 100
    DEFAULT_TEMPERATURE = 0.7
    MAX_RESPONSE_TOKENS = 512
    
    # Analytics Configuration
    MAX_VISITS_STORED = 1000
    MAX_CHATS_STORED = 500
    ANALYTICS_BATCH_SIZE = 10
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://*.netlify.app",
        "https://*.herokuapp.com",
        "https://*.railway.app"
    ]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_PER_MINUTE = 60
    CHAT_RATE_LIMIT = 20  # Per minute
    
    # Logging Configuration
    LOG_LEVEL = 'INFO' if not DEBUG else 'DEBUG'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @staticmethod
    def ensure_directories():
        """Ensure all required directories exist"""
        directories = [
            Config.DATA_DIR,
            Config.RESUMES_DIR,
            Config.GENERATED_RESUMES_DIR
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    @staticmethod
    def validate_config():
        """Validate required configuration"""
        required_vars = ['TOGETHER_API_KEY']
        missing_vars = []
        
        for var in required_vars:
            if not getattr(Config, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        return True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    LOG_LEVEL = 'INFO'
    
    # Enhanced security for production
    RATE_LIMIT_PER_MINUTE = 30
    CHAT_RATE_LIMIT = 10

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory storage for tests
    DATA_DIR = '/tmp/resume_test_data'

# Configuration mapping
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(env_name=None):
    """Get configuration based on environment"""
    if env_name is None:
        env_name = os.getenv('FLASK_ENV', 'default')
    
    return config_map.get(env_name, config_map['default'])