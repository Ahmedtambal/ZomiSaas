"""
Configuration Settings
Environment-based configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application Settings"""
    
    # Application
    APP_NAME: str = "Zomi Wealth Portal API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Frontend URL
    FRONTEND_URL: str
    
    # CORS Origins
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Security
    SECRET_KEY: str
    INVITE_CODE_SALT: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Add frontend URL to CORS origins
if settings.FRONTEND_URL not in settings.CORS_ORIGINS:
    settings.CORS_ORIGINS.append(settings.FRONTEND_URL)
