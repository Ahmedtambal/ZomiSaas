# 🎯 Quick Reference Card

## Backend Commands

```bash
# Start backend dev server
cd backend
uvicorn app.main:app --reload

# Install dependencies
pip install -r requirements.txt

# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/auth/signup/admin` | POST | Admin signup (creates org) |
| `/api/auth/signup/user` | POST | User signup (needs invite code) |
| `/api/auth/login` | POST | Login |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout (revoke token) |

## Test Payloads

### Admin Signup
```json
{
  "full_name": "Admin Name",
  "email": "admin@company.com",
  "password": "Admin123!",
  "job_title": "CEO",
  "organization_name": "My Company",
  "role": "admin"
}
```

### User Signup
```json
{
  "full_name": "User Name",
  "email": "user@company.com",
  "password": "User123!",
  "job_title": "Manager",
  "invite_code": "ABC12345",
  "role": "user"
}
```

### Login
```json
{
  "email": "admin@company.com",
  "password": "Admin123!"
}
```

### Refresh Token
```json
{
  "refresh_token": "eyJ..."
}
```

## Password Rules

- ✓ Minimum 8 characters
- ✓ At least 1 uppercase letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 digit (0-9)
- ✓ At least 1 special character (!@#$%^&*(),.?":{}|<>)

**Valid examples**: `Admin123!`, `SecurePass1$`, `MyP@ssw0rd`

## Database Tables

1. **organizations** - Companies/orgs
2. **users** - User accounts
3. **invite_codes** - Registration codes (2-hour expiry)
4. **refresh_tokens** - JWT refresh tokens
5. **audit_logs** - Security audit trail

## Environment Variables (`.env`)

```env
# Supabase (from dashboard)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=service_role_key
SUPABASE_JWT_SECRET=jwt_secret

# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-32-char-secret

# Keep as-is
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

## Supabase Credentials Location

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → API:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_KEY`
   - JWT Settings → **JWT Secret** → `SUPABASE_JWT_SECRET`

## Token Expiry

- **Access Token**: 30 minutes
- **Refresh Token**: 7 days
- **Invite Code**: 2 hours

## URLs

- **Backend Dev**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Frontend Dev**: http://localhost:5173
- **Supabase Dashboard**: https://supabase.com/dashboard

## SQL Quick Queries

### Create invite code manually
```sql
INSERT INTO invite_codes (code, organization_id, role, is_used, expires_at)
VALUES (
  'TEST1234',
  'org-uuid-here',
  'user',
  false,
  NOW() + INTERVAL '2 hours'
);
```

### Check recent users
```sql
SELECT email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check audit logs
```sql
SELECT action, resource, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check unused invite codes
```sql
SELECT code, role, expires_at, is_used
FROM invite_codes
WHERE is_used = false
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

## Response Codes

- **200 OK** - Success (login, refresh, logout)
- **201 Created** - Success (signup)
- **400 Bad Request** - Validation error, invite code issue
- **401 Unauthorized** - Invalid credentials, expired token
- **500 Internal Server Error** - Server error

## Common Errors

| Error | Solution |
|-------|----------|
| `Invalid invite code` | Check code exists, not used, not expired |
| `User already exists` | Use different email |
| `Invalid credentials` | Check email/password correct |
| `Token expired` | Use refresh token endpoint |
| `CORS error` | Check FRONTEND_URL in .env |
| `Connection refused` | Check Supabase URL/key |

## Security Checklist

- ✓ Service role key used in backend only
- ✓ CORS: single origin (no wildcards)
- ✓ Passwords hashed with bcrypt
- ✓ JWT tokens with expiry
- ✓ Email validation at DB level
- ✓ Audit logs enabled
- ✓ HTTPS in production
- ✓ Environment variables not committed

## Architecture (MVVM)

```
Routes (Views)         → API endpoints
    ↓
ViewModels            → Business logic
    ↓
Services              → External integrations
    ↓
Models                → Data validation
```

## Files Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── models/              # Pydantic models
│   │   ├── user.py
│   │   ├── organization.py
│   │   └── invite_code.py
│   ├── services/            # External services
│   │   ├── auth_service.py
│   │   └── database_service.py
│   ├── viewmodels/          # Business logic
│   │   └── auth_viewmodel.py
│   └── routes/              # API endpoints
│       └── auth.py
├── requirements.txt
├── .env.example
└── AUTH_README.md

supabase/
└── migrations/
    └── 002_auth_schema.sql  # Database schema
```

## Documentation Files

- **SETUP_CHECKLIST.md** - Step-by-step setup guide
- **AUTHENTICATION_COMPLETE.md** - Implementation summary
- **backend/AUTH_README.md** - Full technical documentation
- **QUICK_REFERENCE.md** - This file

---

**Need more details?** See `SETUP_CHECKLIST.md` for step-by-step instructions.
