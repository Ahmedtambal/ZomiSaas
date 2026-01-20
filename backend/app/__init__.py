"""
Backend Application Package
Zomi Wealth Portal - FastAPI Backend

This package contains the backend API following MVVM architecture:
- Models: Data structures and database schemas
- Views: API endpoints and request handlers
- ViewModels: Business logic and data transformation
- Services: External integrations (Supabase, etc.)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# Create FastAPI application instance
app = FastAPI(
    title="Zomi Wealth Portal API",
    description="Corporate Wealth Management Platform Backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register routes
from app.routes import auth, members, forms, invite_codes

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(invite_codes.router, prefix="/api/invite-codes", tags=["Invite Codes"])

@app.get("/")
async def root():
    return {
        "message": "Zomi Wealth Portal API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
