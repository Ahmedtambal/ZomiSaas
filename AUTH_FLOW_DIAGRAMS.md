# Authentication Flow Diagrams

## 1. Admin Signup Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ADMIN SIGNUP TAB                            │
└─────────────────────────────────────────────────────────────────────┘

User fills form:
┌───────────────────────┐
│ Full Name            │
│ Email                │
│ Password             │ → Must meet requirements:
│ Job Title            │   • 8+ characters
│ Organization Name    │   • Uppercase + lowercase
│ [Role: admin]        │   • Digit + special char
└───────────────────────┘
         │
         ↓ POST /api/auth/signup/admin
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                          BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Validate password strength (regex)                               │
│     ✓ Min 8 chars, uppercase, lowercase, digit, special char         │
│                                                                       │
│  2. Check if email already exists                                    │
│     ✗ If yes → 400 "User already exists"                            │
│                                                                       │
│  3. Create new organization                                          │
│     INSERT INTO organizations (name) VALUES (...)                    │
│     → Returns org_id                                                 │
│                                                                       │
│  4. Hash password with bcrypt                                        │
│     password_hash = bcrypt.hash(password)                            │
│                                                                       │
│  5. Create admin user                                                │
│     INSERT INTO users (                                              │
│       organization_id, email, password_hash,                         │
│       role='admin', ...                                              │
│     )                                                                │
│                                                                       │
│  6. Generate JWT tokens                                              │
│     access_token (30 min) + refresh_token (7 days)                   │
│                                                                       │
│  7. Save refresh_token to database                                   │
│     INSERT INTO refresh_tokens (...)                                 │
│                                                                       │
│  8. Log audit event                                                  │
│     INSERT INTO audit_logs (action='signup', ...)                    │
│                                                                       │
└───────────────────────────────────────┬───────────────────────────────┘
                                        │
                                        ↓ 201 Created
                        ┌───────────────────────────┐
                        │  Response:                │
                        │  - access_token          │
                        │  - refresh_token         │
                        │  - user details          │
                        │  - org details           │
                        └───────────┬───────────────┘
                                    │
                                    ↓
                        ┌───────────────────────────┐
                        │  Frontend:                │
                        │  - Store tokens           │
                        │  - Redirect to /dashboard │
                        └───────────────────────────┘
```

## 2. User Signup Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER SIGNUP TAB                            │
└─────────────────────────────────────────────────────────────────────┘

User fills form:
┌───────────────────────┐
│ Full Name            │
│ Email                │
│ Password             │
│ Job Title            │
│ Invite Code          │ → 8-character code (e.g., ABC12345)
│ [Role: user]         │
└───────────────────────┘
         │
         ↓ POST /api/auth/signup/user
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                          BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Validate password strength (same as admin)                       │
│                                                                       │
│  2. Check if email already exists                                    │
│     ✗ If yes → 400 "User already exists"                            │
│                                                                       │
│  3. Validate invite code                                             │
│     SELECT * FROM invite_codes WHERE code = 'ABC12345'               │
│                                                                       │
│     ✗ If not found → 400 "Invalid invite code"                      │
│     ✗ If is_used = true → 400 "Code already used"                   │
│     ✗ If expires_at < NOW() → 400 "Code expired"                    │
│     ✓ If valid → Continue                                            │
│                                                                       │
│  4. Hash password with bcrypt                                        │
│                                                                       │
│  5. Create user linked to org from invite code                       │
│     INSERT INTO users (                                              │
│       organization_id = invite_code.organization_id,                 │
│       role = invite_code.role,                                       │
│       ...                                                            │
│     )                                                                │
│                                                                       │
│  6. Mark invite code as used                                         │
│     UPDATE invite_codes                                              │
│     SET is_used = true, used_by = user_id, used_at = NOW()          │
│     WHERE code = 'ABC12345'                                          │
│                                                                       │
│  7. Generate JWT tokens (same as admin)                              │
│                                                                       │
│  8. Save refresh_token to database                                   │
│                                                                       │
│  9. Log audit event                                                  │
│                                                                       │
└───────────────────────────────────────┬───────────────────────────────┘
                                        │
                                        ↓ 201 Created
                        ┌───────────────────────────┐
                        │  Response: (same as admin)│
                        │  - tokens + user details  │
                        └───────────┬───────────────┘
                                    │
                                    ↓
                        ┌───────────────────────────┐
                        │  Redirect to /dashboard   │
                        └───────────────────────────┘
```

## 3. Login Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                            LOGIN PAGE                                │
└─────────────────────────────────────────────────────────────────────┘

User enters:
┌───────────────────────┐
│ Email                │
│ Password             │
└───────────────────────┘
         │
         ↓ POST /api/auth/login
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                          BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Get user by email                                                │
│     SELECT * FROM users WHERE email = '...'                          │
│     ✗ If not found → 401 "Invalid credentials"                      │
│                                                                       │
│  2. Verify password                                                  │
│     bcrypt.verify(password, user.password_hash)                      │
│     ✗ If incorrect → 401 "Invalid credentials"                      │
│                                                                       │
│  3. Check if user is active                                          │
│     ✗ If is_active = false → 401 "Account deactivated"              │
│                                                                       │
│  4. Update last login timestamp                                      │
│     UPDATE users SET last_login_at = NOW()                           │
│                                                                       │
│  5. Generate JWT tokens                                              │
│     access_token + refresh_token                                     │
│                                                                       │
│  6. Save refresh_token to database                                   │
│                                                                       │
│  7. Log audit event (action='login')                                 │
│                                                                       │
└───────────────────────────────────────┬───────────────────────────────┘
                                        │
                                        ↓ 200 OK
                        ┌───────────────────────────┐
                        │  Response:                │
                        │  - access_token          │
                        │  - refresh_token         │
                        │  - user details          │
                        └───────────┬───────────────┘
                                    │
                                    ↓
                        ┌───────────────────────────┐
                        │  Redirect to /dashboard   │
                        └───────────────────────────┘
```

## 4. Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ACCESS TOKEN EXPIRES (30 min)                       │
└─────────────────────────────────────────────────────────────────────┘
         │
         ↓ Frontend detects expired token
         │
┌────────▼────────────────────────────────────────────────────────────┐
│  Frontend sends refresh request                                      │
│  POST /api/auth/refresh                                              │
│  { "refresh_token": "eyJ..." }                                       │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────▼────────────────────────────────────────────────────────────┐
│                          BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Decode refresh token (JWT)                                       │
│     ✗ If invalid → 401 "Invalid token"                              │
│                                                                       │
│  2. Validate token type = "refresh"                                  │
│     ✗ If wrong type → 401 "Invalid token type"                      │
│                                                                       │
│  3. Check token in database                                          │
│     SELECT * FROM refresh_tokens                                     │
│     WHERE token = '...' AND revoked_at IS NULL                       │
│     ✗ If not found → 401 "Token not found or revoked"               │
│                                                                       │
│  4. Check if token expired                                           │
│     ✗ If expires_at < NOW() → 401 "Token expired"                   │
│                                                                       │
│  5. Get user by ID from token payload                                │
│     ✗ If not found or inactive → 401 "User invalid"                 │
│                                                                       │
│  6. Generate NEW access token                                        │
│     (Keep same refresh token)                                        │
│                                                                       │
└───────────────────────────────────────┬───────────────────────────────┘
                                        │
                                        ↓ 200 OK
                        ┌───────────────────────────┐
                        │  Response:                │
                        │  - access_token (NEW)    │
                        │  - token_type            │
                        │  - expires_in            │
                        └───────────┬───────────────┘
                                    │
                                    ↓
                        ┌───────────────────────────┐
                        │  Frontend stores new token│
                        │  Continue API requests    │
                        └───────────────────────────┘
```

## 5. Logout Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER CLICKS LOGOUT                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         ↓ POST /api/auth/logout
         │ { "refresh_token": "eyJ..." }
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                          BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Revoke refresh token                                             │
│     UPDATE refresh_tokens                                            │
│     SET revoked_at = NOW()                                           │
│     WHERE token = '...'                                              │
│                                                                       │
└───────────────────────────────────────┬───────────────────────────────┘
                                        │
                                        ↓ 200 OK
                        ┌───────────────────────────┐
                        │  Response:                │
                        │  { "message": "Success" } │
                        └───────────┬───────────────┘
                                    │
                                    ↓
                        ┌───────────────────────────┐
                        │  Frontend:                │
                        │  - Clear tokens           │
                        │  - Redirect to /login     │
                        └───────────────────────────┘
```

## 6. Protected API Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  USER MAKES API REQUEST                              │
└─────────────────────────────────────────────────────────────────────┘
         │
         ↓ GET /api/dashboard (example)
         │ Headers: { Authorization: "Bearer eyJ..." }
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                          BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Extract access token from Authorization header                   │
│     ✗ If missing → 401 "Unauthorized"                               │
│                                                                       │
│  2. Decode JWT token                                                 │
│     ✗ If invalid → 401 "Invalid token"                              │
│                                                                       │
│  3. Validate token type = "access"                                   │
│     ✗ If wrong type → 401 "Invalid token type"                      │
│                                                                       │
│  4. Check token expiry                                               │
│     ✗ If exp < NOW() → 401 "Token expired"                          │
│                                                                       │
│  5. Extract user_id from token payload                               │
│                                                                       │
│  6. Process request with authenticated user                          │
│                                                                       │
└───────────────────────────────────────┬───────────────────────────────┘
                                        │
                                        ↓ 200 OK
                        ┌───────────────────────────┐
                        │  Return requested data    │
                        └───────────────────────────┘

If access token expired:
         ↓ 401 "Token expired"
         │
┌────────▼────────────────────────────────────────────────────────────┐
│  Frontend automatically calls /api/auth/refresh                      │
│  Gets new access token                                               │
│  Retries original request                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## 7. Database Relationships

```
┌──────────────────────┐
│   organizations      │
│ ─────────────────── │
│ • id (PK)           │
│ • name (unique)     │──┐
│ • created_at        │  │
│ • is_active         │  │
└──────────────────────┘  │
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ↓                ↓                ↓
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│     users       │ │ invite_codes │ │ audit_logs   │
│ ─────────────── │ │ ──────────── │ │ ──────────── │
│ • id (PK)      │ │ • id (PK)   │ │ • id (PK)   │
│ • org_id (FK)  │ │ • org_id (FK)│ │ • org_id (FK)│
│ • email        │ │ • code      │ │ • user_id   │
│ • password_hash│ │ • is_used   │ │ • action    │
│ • role         │ │ • expires_at│ │ • details   │
│ • is_active    │ │ • used_by   │──│             │
└─────────┬───────┘ └──────────────┘ └──────────────┘
          │
          ↓
┌──────────────────┐
│ refresh_tokens   │
│ ──────────────── │
│ • id (PK)       │
│ • user_id (FK)  │
│ • token         │
│ • expires_at    │
│ • revoked_at    │
└──────────────────┘
```

## 8. Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                              │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: HTTPS (Production)
├─ All traffic encrypted in transit
└─ Configured in Render deployment

Layer 2: CORS
├─ Strict origin control (no wildcards)
├─ Specific methods: GET, POST, PUT, DELETE, PATCH
├─ Specific headers: Authorization, Content-Type, Accept, Origin
└─ Prevents unauthorized cross-origin requests

Layer 3: Password Security
├─ Bcrypt hashing with salt
├─ Strength validation (8+ chars, mixed case, digits, special)
├─ Never stored in plain text
└─ Never returned in API responses

Layer 4: JWT Tokens
├─ Signed with SECRET_KEY (HS256)
├─ Short-lived access tokens (30 min)
├─ Refresh tokens stored in DB (can be revoked)
├─ Token type validation (access vs refresh)
└─ Automatic expiry checks

Layer 5: Database
├─ Email validation with regex
├─ Unique constraints (email, invite codes)
├─ Foreign key relationships
├─ Invite code expiry (2 hours)
└─ Service role key used (not anon key)

Layer 6: Audit Logging
├─ All auth events logged
├─ User/org/action/resource tracked
├─ IP address and user agent captured
└─ Immutable audit trail

Layer 7: Rate Limiting (Future)
├─ Prevent brute force attacks
├─ Limit failed login attempts
└─ IP-based throttling
```

## 9. Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TOKEN LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────┘

[Login/Signup]
      │
      ↓ Generate tokens
      │
┌─────▼──────────────────────┐  ┌─────────────────────────────┐
│   ACCESS TOKEN             │  │   REFRESH TOKEN             │
│ ───────────────────────── │  │ ─────────────────────────── │
│ • Type: "access"          │  │ • Type: "refresh"          │
│ • Expires: 30 minutes     │  │ • Expires: 7 days          │
│ • Stored: Memory/cookie   │  │ • Stored: Database + cookie│
│ • Used: API requests      │  │ • Used: Token refresh      │
└────────┬───────────────────┘  └──────────┬──────────────────┘
         │                                 │
         ↓ Time passes...                  │
         │                                 │
[After 30 minutes]                         │
         │                                 │
         ↓ Token expired                   │
         │                                 │
    [401 Response]                         │
         │                                 │
         ↓ Frontend detects                │
         │                                 │
    ┌────▼──────────────────────────────┐ │
    │  Call /api/auth/refresh           │ │
    │  Send refresh_token ──────────────┼─┘
    └────┬──────────────────────────────┘
         │
         ↓ Validate refresh token
         │
    [If valid]
         │
         ↓ Generate new access token
         │
┌────────▼─────────────────────┐
│  NEW ACCESS TOKEN            │
│ • Fresh 30 min expiry        │
│ • Same refresh token         │
└────────┬─────────────────────┘
         │
         ↓ Continue API requests
         │
[After 7 days]
         │
         ↓ Refresh token expires
         │
    [Must login again]
         │
         ↓ Redirect to /login
```

---

**Visual Reference**: These diagrams show the complete authentication flow from user input to database storage and token management.

For detailed code examples and API documentation, see:
- `backend/AUTH_README.md` - Complete technical documentation
- `SETUP_CHECKLIST.md` - Step-by-step setup guide
- `QUICK_REFERENCE.md` - Command and API reference
