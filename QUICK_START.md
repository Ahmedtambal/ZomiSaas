# Quick Start Guide - SW New Employee Form System

## Prerequisites
- Python 3.13 installed
- Node.js 18+ installed
- Supabase account with project created
- Database migration scripts run (from previous conversation)

## Step 1: Database Setup

Run these SQL scripts in Supabase SQL Editor:

```sql
-- 1.1 Update forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('custom', 'sw_new_employee', 'io_upload'));
ALTER TABLE forms ADD COLUMN IF NOT EXISTS linked_company_id UUID REFERENCES companies(id);

-- 1.2 Create form_tokens table
CREATE TABLE IF NOT EXISTS form_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  max_submissions INT,
  submission_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count INT DEFAULT 0,
  metadata JSONB
);

ALTER TABLE form_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tokens for their organization"
ON form_tokens
FOR ALL
USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- 1.3 Update employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS submission_token TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS submitted_via TEXT CHECK (submitted_via IN ('manual', 'form_link', 'import'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_agent TEXT;
```

## Step 2: Backend Setup

```bash
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
SUPABASE_URL=https://dxxteafpanesuicrjqto.supabase.co
SUPABASE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173  # For local dev
ENVIRONMENT=development

# Start backend
python -m uvicorn app.main:app --reload --port 8000

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
VITE_API_URL=http://localhost:8000  # For local dev
VITE_SUPABASE_URL=https://dxxteafpanesuicrjqto.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Start frontend
npm run dev

# Frontend will be available at http://localhost:5173
```

## Step 4: Test the System

### 4.1 Login to Dashboard
1. Open http://localhost:5173
2. Login with your credentials

### 4.2 Create SW New Employee Form
1. Navigate to "Forms" in sidebar
2. Click "Create SW Form" button
3. Complete the 4-step wizard:
   - Step 1: Personal Details (7 fields)
   - Step 2: Contact Details (5 fields)
   - Step 3: Employment Details (5 fields)
   - Step 4: Pension Details (2 fields) + Select Company
4. Click "Create Form"
5. Form will be saved and you'll be redirected to Forms List

### 4.3 Generate Public Link
1. In Forms List, find your SW form
2. Click "Manage Links"
3. Click "Generate Link"
4. Fill in modal:
   - Select Company (required)
   - Expiry Days (default: 30)
   - Max Submissions (optional, leave empty for unlimited)
5. Click "Generate"
6. Click "Copy" to copy the link
7. Link format: `http://localhost:5173/public/form/{32-character-token}`

### 4.4 Test Public Form Submission
1. Open the copied link in an **incognito/private window** (no login required)
2. Form will load with company branding
3. Fill out all required fields (marked with *)
4. Click "Submit Form"
5. Success page will show with submission ID

### 4.5 Verify Database Records
1. Check forms table:
   ```sql
   SELECT * FROM forms WHERE template_type = 'sw_new_employee' ORDER BY created_at DESC LIMIT 1;
   ```

2. Check form_tokens table:
   ```sql
   SELECT * FROM form_tokens ORDER BY created_at DESC LIMIT 1;
   ```

3. Check employees table for new employee:
   ```sql
   SELECT * FROM employees WHERE submitted_via = 'form_link' ORDER BY created_at DESC LIMIT 1;
   ```

4. Verify enriched fields:
   - `submission_token` should match token from form_tokens
   - `submitted_via` should be 'form_link'
   - `ip_address` should be captured
   - `user_agent` should be captured
   - `client_category` should be auto-filled from company Master Rulebook

### 4.6 Check Token Statistics
1. Return to dashboard (login window)
2. Go to Forms → Your SW Form → Manage Links
3. Verify:
   - `submission_count` incremented to 1
   - `access_count` shows number of times link was opened
   - `last_accessed_at` shows recent timestamp
   - Progress bar shows 1/X (if max_submissions set)

## API Endpoints Reference

### Authenticated Endpoints (require JWT token)
```
POST   /api/forms                      - Create form
GET    /api/forms                      - List forms
GET    /api/forms/{form_id}            - Get form
PUT    /api/forms/{form_id}            - Update form
DELETE /api/forms/{form_id}            - Delete form
POST   /api/forms/{form_id}/tokens    - Generate token
GET    /api/forms/{form_id}/tokens    - List tokens
PUT    /api/forms/tokens/{token_id}   - Update token
GET    /api/forms/{form_id}/submissions - Get submissions
GET    /api/companies                  - List companies
GET    /api/companies/{company_id}     - Get company
```

### Public Endpoints (no authentication)
```
GET    /api/public/forms/{token}       - Get form by token
POST   /api/public/forms/{token}/submit - Submit form
```

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.13+)
- Verify virtual environment is activated
- Check .env file exists with all required variables
- Run: `pip install -r requirements.txt` again

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete node_modules and package-lock.json, run `npm install` again
- Check .env file exists with VITE_API_URL

### "Form not found" error
- Verify form exists in database
- Check RLS policies allow your user to access it
- Ensure organization_id matches

### "Invalid token" error
- Check token exists: `SELECT * FROM form_tokens WHERE token = 'your_token';`
- Verify `is_active = true`
- Check `expires_at` is in the future or NULL
- Verify `submission_count < max_submissions` (if max_submissions set)

### Form submission fails
- Check browser console for errors
- Verify all required fields are filled
- Check backend logs for detailed error
- Ensure employees table accepts all fields
- Verify company exists in companies table

### CORS errors
- Ensure FRONTEND_URL in backend .env matches frontend URL exactly
- Check no trailing slash in URLs
- Verify CORS middleware in main.py includes frontend origin

## Production Deployment

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect to GitHub repo
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - SUPABASE_URL
   - SUPABASE_KEY
   - JWT_SECRET
   - FRONTEND_URL (production URL)
   - ENVIRONMENT=production
7. Deploy

### Frontend (Render)
1. Create new Static Site on Render
2. Connect to GitHub repo (frontend directory)
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add environment variables:
   - VITE_API_URL (backend production URL)
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
6. Deploy

### Post-Deployment
1. Update Supabase Auth site URL to production frontend URL
2. Test public form link from production
3. Verify submissions create employee records
4. Monitor error logs

## File Structure
```
ZomiDashboard-main/
├── backend/
│   ├── app/
│   │   ├── main.py (updated)
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── forms.py (NEW)
│   │   │   ├── public_forms.py (NEW)
│   │   │   └── companies.py (NEW)
│   │   ├── services/
│   │   └── config.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx (updated)
│   │   ├── services/
│   │   │   └── formService.ts (NEW)
│   │   ├── components/
│   │   │   └── forms/
│   │   │       ├── SWNewEmployeeForm.tsx (NEW)
│   │   │       ├── PublicFormView.tsx (NEW)
│   │   │       ├── FormTokenManager.tsx (NEW)
│   │   │       └── FormsListPage.tsx (NEW)
│   │   └── types/
│   │       └── forms.ts (updated)
│   └── package.json
└── IMPLEMENTATION_COMPLETE.md
```

## Support

For issues or questions:
1. Check IMPLEMENTATION_COMPLETE.md for detailed documentation
2. Review API documentation at http://localhost:8000/docs
3. Check Supabase logs for database errors
4. Inspect browser console for frontend errors
5. Review backend terminal for API errors

## Next Steps
Once basic system is working:
1. Add UK validation presets (postcode, NI number format)
2. Implement analytics dashboard
3. Add email notifications
4. Create PDF generation for submissions
5. Build admin approval workflow
