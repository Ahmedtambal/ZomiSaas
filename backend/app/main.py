"""
Main FastAPI application entry point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os
import pydantic
import base64
import json

from app.config import settings
from app.routes import auth, forms, public_forms, companies, employees, form_submissions, form_templates, form_analytics, audit_logs, kpi_stats, change_information, user_profiles, team_management, lookups
from app.middleware import ActivityTrackingMiddleware, SecurityHeadersMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security logger for auth events
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="Zomi Wealth Portal API",
    description="Corporate wealth management backend API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    redirect_slashes=False,  # Disable automatic slash redirects to prevent CORS issues
)


def _jwt_role_hint(jwt_token: str) -> str | None:
    """Best-effort decode of a Supabase JWT to identify its role claim.

    This is used for diagnostics only (no signature verification).
    """
    try:
        parts = jwt_token.split(".")
        if len(parts) < 2:
            return None
        payload_b64 = parts[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
        payload = json.loads(payload_json)
        return payload.get("role")
    except Exception:
        return None


# =====================================================
# Startup diagnostics
# =====================================================

supabase_key_role = _jwt_role_hint(settings.SUPABASE_KEY)
if supabase_key_role and supabase_key_role != "service_role":
    logger.warning(
        "SUPABASE_KEY does not look like a service_role key (role=%s). "
        "Team management actions (role updates/deletes) may fail due to RLS.",
        supabase_key_role,
    )

if settings.SUPABASE_ANON_KEY:
    anon_role = _jwt_role_hint(settings.SUPABASE_ANON_KEY)
    if anon_role and anon_role != "anon":
        logger.warning(
            "SUPABASE_ANON_KEY role claim is unexpected (role=%s).",
            anon_role,
        )

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =====================================================
# Security Middleware
# =====================================================

# HTTPS Redirect (Production only)
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS - Strict configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if settings.FRONTEND_URL else [],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # Specific methods only
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],  # Specific headers only - NO wildcard
    expose_headers=["Content-Length", "X-Total-Count"],
    max_age=600,  # Cache preflight requests for 10 minutes (reduced from 1 hour)
)

# Trusted Host - Prevent host header attacks
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["zomisaasbackend.onrender.com", "*.onrender.com"]
    )

# Security headers (CSP, HSTS, X-Frame-Options, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Activity tracking - 15 minute inactivity timeout
app.add_middleware(ActivityTrackingMiddleware)

# =====================================================
# Routes
# =====================================================

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(form_submissions.router, prefix="/api/form-submissions", tags=["Form Submissions"])
app.include_router(form_templates.router, prefix="/api/forms", tags=["Form Templates"])
app.include_router(form_analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(public_forms.router, prefix="/api/public", tags=["Public"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(change_information.router, prefix="/api/change-information", tags=["Change Information"])
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Audit Logs"])
app.include_router(kpi_stats.router, prefix="/api/kpi", tags=["KPI Statistics"])
app.include_router(user_profiles.router, prefix="/api/user-profiles", tags=["User Profiles"])
app.include_router(team_management.router, prefix="/api/team", tags=["Team Management"])
app.include_router(lookups.router, prefix="/api/lookups", tags=["Lookups"])

# =====================================================
# Health Check
# =====================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Zomi Wealth Portal API",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENVIRONMENT != "production" else "disabled"
    }

# =====================================================
# Startup & Shutdown Events
# =====================================================

@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Starting Zomi Wealth Portal API - {settings.ENVIRONMENT}")
    logger.info(f"📍 Frontend URL: {settings.FRONTEND_URL}")
    logger.info(f"🔧 Commit: {os.getenv('RENDER_GIT_COMMIT', 'unknown')}")
    logger.info(f"🔧 Pydantic: {pydantic.__version__}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Shutting down Zomi Wealth Portal API")
