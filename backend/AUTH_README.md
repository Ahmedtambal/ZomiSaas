# Authentication System Documentation

## Overview

This authentication system implements secure user registration, login, and JWT-based token management following industry best practices.

## Architecture

### MVVM Pattern
- **Models** (`app/models/`): Pydantic schemas for data validation
- **Views** (`app/routes/`): FastAPI route handlers
- **ViewModels** (`app/viewmodels/`): Business logic layer
- **Services** (`app/services/`): External integrations (Supabase, Auth)

## Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

### Token Management
- **Access Token**: JWT, expires in 30 minutes
- **Refresh Token**: JWT, expires in 7 days, stored in database
- Algorithm: HS256
- Refresh tokens can be revoked (logout)

### CORS Configuration
- Strict origin control (no wildcards)
- Specific HTTP methods: GET, POST, PUT, DELETE, PATCH
- Specific headers: Authorization, Content-Type, Accept, Origin, X-Requested-With
- Credentials enabled for cookies

### Database Security
- Passwords hashed with bcrypt
- Email validation with regex
- Invite codes expire after 2 hours
- Audit logging for all auth events
- Row-level security disabled (using service_role key)

## Database Schema

### Organizations Table
```sql
- id: UUID (primary key)
- name: TEXT (unique, not null)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- is_active: BOOLEAN
```

### Users Table
```sql
- id: UUID (primary key)
- organization_id: UUID (foreign key)
- full_name: TEXT
- email: TEXT (unique, validated)
- job_title: TEXT
- password_hash: TEXT
- role: TEXT (admin/user)
- is_active: BOOLEAN
- is_email_verified: BOOLEAN
- email_verified_at: TIMESTAMP
- last_login_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Invite Codes Table
```sql
- id: UUID (primary key)
- code: TEXT (8-char, unique)
- organization_id: UUID (foreign key)
- role: TEXT (admin/user)
- is_used: BOOLEAN
- used_by: UUID (foreign key to users)
- used_at: TIMESTAMP
- expires_at: TIMESTAMP (2 hours from creation)
- created_by: UUID (foreign key to users)
- created_at: TIMESTAMP
```

### Refresh Tokens Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- token: TEXT (unique)
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
- revoked_at: TIMESTAMP
```

### Audit Logs Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- organization_id: UUID (foreign key)
- action: TEXT
- resource: TEXT
- details: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMP
```

## API Endpoints

### Admin Signup
**POST** `/api/auth/signup/admin`

Creates a new organization and admin user.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@company.com",
  "password": "SecurePass123!",
  "job_title": "CEO",
  "organization_name": "Company Name",
  "role": "admin"
}
```

**Response (201 Created):**
```json
{
  "message": "Admin account created successfully",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "uuid",
      "organization_id": "uuid",
      "full_name": "John Doe",
      "email": "john@company.com",
      "job_title": "CEO",
      "role": "admin",
      "is_active": true,
      "is_email_verified": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### User Signup
**POST** `/api/auth/signup/user`

Creates a new user with a valid invite code.

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "password": "SecurePass123!",
  "job_title": "Manager",
  "invite_code": "ABC12345",
  "role": "user"
}
```

**Response (201 Created):**
```json
{
  "message": "User account created successfully",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": { ... }
  }
}
```

**Error Responses:**
- 400: Invalid invite code / Code expired / Code already used
- 400: User already exists

### Login
**POST** `/api/auth/login`

Authenticates user and returns JWT tokens.

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": { ... }
  }
}
```

**Error Responses:**
- 401: Invalid email or password
- 401: Account is deactivated

### Refresh Token
**POST** `/api/auth/refresh`

Generates a new access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800
  }
}
```

**Error Responses:**
- 401: Invalid refresh token
- 401: Token expired or revoked

### Logout
**POST** `/api/auth/logout`

Revokes the refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

## Signup Flow

### Admin Signup Flow
1. User fills form: name, email, password, job title, organization name
2. Backend validates password strength
3. Backend checks if email already exists
4. Backend creates new organization
5. Backend creates admin user linked to organization
6. Backend generates JWT tokens
7. Backend logs audit event
8. Returns tokens and user details

### User Signup Flow
1. User fills form: name, email, password, job title, invite code
2. Backend validates password strength
3. Backend checks if email already exists
4. Backend validates invite code:
   - Code exists
   - Not already used
   - Not expired (< 2 hours old)
5. Backend creates user linked to organization from invite code
6. Backend marks invite code as used
7. Backend generates JWT tokens
8. Backend logs audit event
9. Returns tokens and user details

## Frontend Integration

### Registration Page Structure
The registration page should have **2 tabs**:

#### Admin Tab
```javascript
// Form fields
{
  full_name: string,
  email: string,
  password: string,
  job_title: string,
  organization_name: string,
  role: "admin"  // Fixed value
}

// API call
POST /api/auth/signup/admin
```

#### User Tab
```javascript
// Form fields
{
  full_name: string,
  email: string,
  password: string,
  job_title: string,
  invite_code: string,  // 8-character code
  role: "user"  // Fixed value
}

// API call
POST /api/auth/signup/user
```

### Token Storage
Store tokens securely:
- **Access Token**: Can be stored in memory or httpOnly cookie
- **Refresh Token**: Must be stored in httpOnly cookie (recommended) or secure storage

### Authorization Header
For protected API requests:
```
Authorization: Bearer <access_token>
```

### Token Refresh Strategy
1. Check if access token is expired before each API call
2. If expired, use refresh token to get new access token
3. If refresh fails, redirect to login page

### After Login Redirect
After successful login/signup, redirect user to:
```
/dashboard
```

## Environment Variables

Create `.env` file in backend root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Security
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Password Requirements
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_DIGIT=true
REQUIRE_SPECIAL_CHAR=true

# Invite Codes
INVITE_CODE_EXPIRY_HOURS=2

# Frontend
FRONTEND_URL=http://localhost:5173

# Environment
ENVIRONMENT=development
```

## Running SQL Migrations

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor

### Step 2: Run Migration
1. Copy contents of `supabase/migrations/002_auth_schema.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify tables created in Table Editor

### Step 3: Verify Schema
Check that these tables exist:
- organizations
- users
- invite_codes
- refresh_tokens
- audit_logs

## Testing the API

### 1. Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Test Admin Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup/admin \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Admin User",
    "email": "admin@test.com",
    "password": "Admin123!",
    "job_title": "Administrator",
    "organization_name": "Test Org",
    "role": "admin"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

### 4. Test Token Refresh
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## Common Issues

### Issue: Password validation fails
**Solution**: Ensure password meets all requirements (8+ chars, uppercase, lowercase, digit, special char)

### Issue: Invite code expired
**Solution**: Invite codes are valid for 2 hours only. Generate a new code.

### Issue: CORS error in frontend
**Solution**: Ensure `FRONTEND_URL` in backend .env matches your frontend URL exactly

### Issue: Supabase connection fails
**Solution**: Verify `SUPABASE_URL` and `SUPABASE_KEY` (use service_role key, not anon key)

### Issue: JWT token invalid
**Solution**: Ensure `SECRET_KEY` is consistent and `SUPABASE_JWT_SECRET` is set correctly

## Security Best Practices

1. **Never commit .env files** - Use `.gitignore`
2. **Use service_role key** only in backend (never expose to frontend)
3. **HTTPS only** in production
4. **Rotate SECRET_KEY** periodically
5. **Monitor audit_logs** for suspicious activity
6. **Implement rate limiting** for auth endpoints (future enhancement)
7. **Add email verification** before full account activation (future enhancement)
8. **Implement password reset** flow (future enhancement)

## Next Steps

1. Run SQL migrations in Supabase
2. Configure environment variables
3. Start backend server
4. Update frontend to use real API
5. Test complete signup/login flow
6. Deploy to production (Render)
