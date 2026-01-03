"""
Configuration for Data Analysis Lab Backend
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # AI API Keys
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    
    # File upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'sav'}
    
    # Data storage (in-memory for now, could use Redis/DB later)
    DATA_STORAGE = {}
    
    # Statistical significance level
    ALPHA = 0.05
    
    # Effect size thresholds (Cohen's conventions)
    EFFECT_SIZE_THRESHOLDS = {
        'cohens_d': {'small': 0.2, 'medium': 0.5, 'large': 0.8},
        'r': {'small': 0.1, 'medium': 0.3, 'large': 0.5},
        'eta_squared': {'small': 0.01, 'medium': 0.06, 'large': 0.14},
        'cramers_v': {'small': 0.1, 'medium': 0.3, 'large': 0.5},
        'r_squared': {'small': 0.02, 'medium': 0.13, 'large': 0.26}
    }


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


# Use development config by default
config = DevelopmentConfig()

