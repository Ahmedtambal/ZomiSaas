"""
Backend Application Package
Zomi Wealth Portal - FastAPI Backend

This package contains the backend API following MVVM architecture:
- Models: Data structures and database schemas
- Views: API endpoints and request handlers
- ViewModels: Business logic and data transformation
- Services: External integrations (Supabase, etc.)
"""

__version__ = "1.0.0"

async def health_check():
    return {"status": "healthy"}
