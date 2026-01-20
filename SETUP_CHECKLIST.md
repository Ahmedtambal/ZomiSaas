# 🚀 Authentication Setup Checklist

Follow these steps in order to get authentication working:

## ✅ Step 1: Run SQL Migrations in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project (or create new one in **eu-west-2 London**)
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy entire contents of `supabase/migrations/002_auth_schema.sql`
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success message
9. Click **Table Editor** to confirm these tables exist:
   - ✓ organizations
   - ✓ users
   - ✓ invite_codes
   - ✓ refresh_tokens
   - ✓ audit_logs

## ✅ Step 2: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them for .env):
   
   **Project URL**:
   ```
   Example: https://abcdefgh.supabase.co
   ```
   
   **anon public** key (NOT NEEDED - we use service_role):
   ```
   Skip this one
   ```
   
   **service_role** key (⚠️ SECRET - use this):
   ```
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
3. Go to **Settings** → **API** → **JWT Settings**
4. Copy **JWT Secret**:
   ```
   Example: your-super-secret-jwt-secret
   ```

## ✅ Step 3: Configure Backend Environment

1. Open terminal in project root
2. Navigate to backend:
   ```bash
   cd backend
   ```

3. Copy environment template:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file (use VS Code or any text editor):
   ```bash
   code .env
   ```

5. Fill in these values:

   ```env
   # From Supabase Settings → API
   SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   SUPABASE_KEY=YOUR-SERVICE-ROLE-KEY-HERE
   SUPABASE_JWT_SECRET=YOUR-JWT-SECRET-HERE
   
   # Generate a random 32+ character string (or use this command):
   # python -c "import secrets; print(secrets.token_urlsafe(32))"
   SECRET_KEY=your-random-32-character-secret-key-here
   
   # Keep these as-is
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   MIN_PASSWORD_LENGTH=8
   REQUIRE_UPPERCASE=true
   REQUIRE_LOWERCASE=true
   REQUIRE_DIGIT=true
   REQUIRE_SPECIAL_CHAR=true
   INVITE_CODE_EXPIRY_HOURS=2
   
   # Your frontend URL (production Render URL)
   FRONTEND_URL=https://your-frontend-app.onrender.com
   
   # Environment
   ENVIRONMENT=production
   ```

6. Generate SECRET_KEY (run in terminal):
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Copy the output and paste it as SECRET_KEY value.

## ✅ Step 4: Install Backend Dependencies

```bash
# Make sure you're in backend folder
cd backend

# Install Python packages
pip install -r requirements.txt
```

## ✅ Step 5: Test Backend Locally

1. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

2. You should see:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Waiting for application startup.
   🚀 Starting Zomi Wealth Portal API - development
   📍 Frontend URL: http://localhost:5173
   INFO:     Application startup complete.
   ```

3. Test health check (open new terminal):
   ```bash
   curl http://localhost:8000/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "environment": "development",
     "version": "1.0.0"
   }
   ```

4. Open API docs in browser:
   ```
   http://localhost:8000/docs
   ```
   You should see Swagger UI with all auth endpoints.

## ✅ Step 6: Test Admin Signup

1. Open Swagger UI: http://localhost:8000/docs
2. Find **POST /api/auth/signup/admin**
3. Click **Try it out**
4. Enter test data:
   ```json
   {
     "full_name": "Test Admin",
     "email": "admin@test.com",
     "password": "Admin123!",
     "job_title": "Administrator",
     "organization_name": "Test Organization",
     "role": "admin"
   }
   ```
5. Click **Execute**
6. Check response (should be 201 Created):
   ```json
   {
     "message": "Admin account created successfully",
     "data": {
       "access_token": "eyJ...",
       "refresh_token": "eyJ...",
       "token_type": "bearer",
       "expires_in": 1800,
       "user": {
         "id": "...",
         "email": "admin@test.com",
         "role": "admin",
         ...
       }
     }
   }
   ```

7. Verify in Supabase:
   - Go to **Table Editor** → **organizations**
   - You should see "Test Organization"
   - Go to **users** table
   - You should see "admin@test.com" with role "admin"

## ✅ Step 7: Test Login

1. In Swagger UI, find **POST /api/auth/login**
2. Click **Try it out**
3. Enter credentials:
   ```json
   {
     "email": "admin@test.com",
     "password": "Admin123!"
   }
   ```
4. Click **Execute**
5. Check response (should be 200 OK) with access_token and refresh_token

## ✅ Step 8: Create Invite Code (Manual for now)

To test user signup, you need an invite code. For now, create one manually:

1. Go to Supabase **Table Editor** → **invite_codes**
2. Click **Insert row**
3. Fill in:
   - **code**: `TEST1234` (8 characters, uppercase)
   - **organization_id**: (copy from organizations table - the UUID)
   - **role**: `user`
   - **is_used**: `false`
   - **expires_at**: (2 hours from now, format: `2024-01-15 14:30:00+00`)
4. Click **Save**

OR use SQL:
```sql
INSERT INTO invite_codes (code, organization_id, role, is_used, expires_at)
VALUES (
  'TEST1234',
  'YOUR-ORG-UUID-HERE',
  'user',
  false,
  NOW() + INTERVAL '2 hours'
);
```

## ✅ Step 9: Test User Signup

1. In Swagger UI, find **POST /api/auth/signup/user**
2. Click **Try it out**
3. Enter test data:
   ```json
   {
     "full_name": "Test User",
     "email": "user@test.com",
     "password": "User123!",
     "job_title": "Manager",
     "invite_code": "TEST1234",
     "role": "user"
   }
   ```
4. Click **Execute**
5. Check response (should be 201 Created)
6. Verify in Supabase:
   - **users** table should have "user@test.com" with role "user"
   - **invite_codes** table should show `is_used = true` and `used_by` = user's UUID

## ✅ Step 10: Test Token Refresh

1. Copy the **refresh_token** from previous login/signup response
2. In Swagger UI, find **POST /api/auth/refresh**
3. Click **Try it out**
4. Enter:
   ```json
   {
     "refresh_token": "PASTE-YOUR-REFRESH-TOKEN-HERE"
   }
   ```
5. Click **Execute**
6. Check response (should be 200 OK) with new access_token

## ✅ Step 11: Check Audit Logs

1. Go to Supabase **Table Editor** → **audit_logs**
2. You should see entries for:
   - Admin signup
   - User signup
   - Logins
3. Each entry should have user_id, organization_id, action, resource, details

## 🎉 Success Checklist

- [ ] SQL migrations executed without errors
- [ ] All 5 tables visible in Supabase Table Editor
- [ ] Backend .env configured with correct credentials
- [ ] Backend starts without errors (`uvicorn app.main:app --reload`)
- [ ] Health check returns 200 OK
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Admin signup creates org + user successfully
- [ ] Login returns JWT tokens
- [ ] User signup works with invite code
- [ ] Invite code marked as used after user signup
- [ ] Token refresh generates new access token
- [ ] Audit logs record all auth events

## 🚨 Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'pydantic_settings'`
```bash
pip install pydantic-settings
```

**Error**: `Import "supabase" could not be resolved`
```bash
pip install -r requirements.txt
```

### Supabase connection fails

**Error**: `Connection refused` or `Unauthorized`
- Check SUPABASE_URL is correct (should be https://YOUR-PROJECT.supabase.co)
- Check SUPABASE_KEY is the **service_role** key (not anon key)
- Verify no extra spaces in .env file

### CORS error from frontend

**Error**: `Access-Control-Allow-Origin` error
- Ensure FRONTEND_URL in backend .env matches frontend URL exactly
- If testing from localhost:5173, use: `FRONTEND_URL=http://localhost:5173`
- No trailing slash!

### Password validation fails

**Error**: `Password must contain...`
- Minimum 8 characters
- At least 1 uppercase (A-Z)
- At least 1 lowercase (a-z)
- At least 1 digit (0-9)
- At least 1 special char (!@#$%^&*(),.?":{}|<>)

Example valid password: `Admin123!`

### Invite code expired

**Error**: `Invite code has expired`
- Invite codes expire after 2 hours
- Create a new code with future `expires_at` timestamp
- Use SQL: `NOW() + INTERVAL '2 hours'`

### User already exists

**Error**: `User with this email already exists`
- Email must be unique across all users
- Use a different email or delete test user from Supabase

## 📚 Next Steps

Once all tests pass:
1. **Update frontend** to use real API (see `AUTHENTICATION_COMPLETE.md`)
2. **Deploy backend** to Render
3. **Deploy frontend** to Render
4. **Test production** deployment

## 📖 Documentation

- Full auth docs: `backend/AUTH_README.md`
- Implementation summary: `AUTHENTICATION_COMPLETE.md`
- SQL schema: `supabase/migrations/002_auth_schema.sql`
- Environment template: `backend/.env.example`

---

**Questions?** Check `backend/AUTH_README.md` for detailed documentation on:
- API endpoints with request/response examples
- Security features
- Signup flows
- Frontend integration guide
- Production deployment
