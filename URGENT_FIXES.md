# 🔧 URGENT FIXES REQUIRED

## Issue 1: "[ENCRYPTED]" Showing on Frontend

**Problem**: NI Number and Date of Birth showing "[ENCRYPTED]" instead of actual data

**Root Cause**: One of these:
1. ❌ `ENCRYPTION_KEY` not set in Render environment variables
2. ❌ Existing database data is plaintext (not encrypted yet)
3. ❌ Wrong encryption key being used

### Fix Steps:

#### Step 1: Set ENCRYPTION_KEY in Render (CRITICAL!)

1. Generate encryption key locally:
   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

2. **Copy the output** (looks like: `8fHg9xK2mP4vQ7sN1zW3bYcD6eR0tUoI5lKjHgFdSaQ=`)

3. **On Render.com**:
   - Go to your **backend service**
   - Click **Environment** tab
   - Add new variable:
     - Key: `ENCRYPTION_KEY`
     - Value: `paste-your-generated-key-here`
   - Click **Save Changes** (will trigger redeploy)

#### Step 2: Check Existing Data Status

Run this in **Supabase SQL Editor**:

```sql
-- Check if data is encrypted or plaintext
SELECT 
    id,
    first_name,
    surname,
    ni_number,
    CASE 
        WHEN ni_number ~ '^[A-Za-z0-9+/]+=*$' AND LENGTH(ni_number) > 20 THEN 'Encrypted ✅'
        WHEN ni_number IS NOT NULL THEN 'Plaintext ⚠️ (needs migration)'
        ELSE 'NULL'
    END as ni_status
FROM employees
LIMIT 10;
```

**If data is plaintext** (not encrypted yet):

You have two options:

**Option A: Clear test data and start fresh** (RECOMMENDED for development):
```sql
TRUNCATE TABLE employees CASCADE;
```
Then create new employees through the app - they'll be encrypted automatically.

**Option B: Migrate existing data** (if you need to keep existing employees):
This requires a manual migration script. Let me know if you need this.

---

## Issue 2: Database Error - "split_template_group_name column not found"

**Problem**: Submission fails with schema cache error

**Root Cause**: Database trigger `populate_employee_auto_fields()` references deleted column

### Fix Steps:

#### Run this in Supabase SQL Editor:

```sql
-- Drop old trigger function
DROP FUNCTION IF EXISTS populate_employee_auto_fields() CASCADE;

-- Create new trigger function WITHOUT deleted column reference
CREATE OR REPLACE FUNCTION populate_employee_auto_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate fields on employee insert
    -- Fixed: Removed reference to deleted 'split_template_group_name' column
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_employee_insert_auto_populate ON employees;

CREATE TRIGGER on_employee_insert_auto_populate
    BEFORE INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION populate_employee_auto_fields();
```

#### Refresh Supabase Schema Cache:

**Method 1** (Recommended):
1. Go to Supabase Dashboard
2. Navigate to **API Settings**
3. Click **Reload Schema Cache**

**Method 2** (Alternative):
Run in SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

**Method 3** (Nuclear option):
- Restart your backend service on Render

---

## 🧪 Testing After Fixes

### Test 1: Verify Encryption Key is Set

Check Render logs for:
```
Encryption service initialized successfully ✅
```

If you see:
```
ENCRYPTION_KEY not found in environment variables! ❌
```
→ Go back to Step 1 and set the key in Render.

### Test 2: Create New Employee

1. Create a new employee with NI Number (e.g., `AB123456C`)
2. **Check Database** (Supabase SQL Editor):
   ```sql
   SELECT ni_number, date_of_birth 
   FROM employees 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   
   **Expected**: You should see base64-encoded gibberish like:
   ```
   gAAAABl7K3mP4vQ7sN1zW3bYcD6eR0tUoI5lKjHgFdSaQ==...
   ```
   
   **NOT**: Plain text like `AB123456C`

3. **Check Frontend**: Employee table should show:
   - ✅ NI Number: `AB123456C` (decrypted)
   - ✅ Date of Birth: `1990-01-15` (decrypted)
   - ❌ NOT: `[ENCRYPTED]`

### Test 3: Verify Form Submission Works

1. Try submitting a form
2. Should NOT get `split_template_group_name` error
3. Submission should succeed

---

## 📋 Quick Checklist

- [ ] Generated ENCRYPTION_KEY locally
- [ ] Added ENCRYPTION_KEY to Render environment variables
- [ ] Waited for Render redeploy (check logs for "Encryption service initialized successfully")
- [ ] Ran SQL fix for `populate_employee_auto_fields()` trigger
- [ ] Refreshed Supabase schema cache (API Settings → Reload Schema Cache)
- [ ] Cleared test data OR migrated existing data
- [ ] Created test employee and verified encryption in database
- [ ] Verified decryption works on frontend (no "[ENCRYPTED]" text)
- [ ] Tested form submission (no schema error)

---

## 🆘 If Issues Persist

### Issue: Still seeing "[ENCRYPTED]" on frontend

**Check Render Logs**:
```bash
# Look for these errors:
- "ENCRYPTION_KEY not found"
- "Failed to decrypt"
- "Invalid token"
```

**Solution**:
1. Verify ENCRYPTION_KEY is exactly 44 characters (Fernet key format)
2. No spaces or quotes around the key
3. Restart backend service on Render

### Issue: Form submission still fails

**Check if trigger was actually updated**:
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'populate_employee_auto_fields';
```

**Should NOT contain**: `split_template_group_name`

**If it does**: Run the SQL fix again and restart backend.

---

## 🎯 Expected Final State

**Database (Supabase)**:
- `ni_number`: `gAAAABl7K3...` (encrypted base64)
- `date_of_birth`: `gAAAABl9sF...` (encrypted base64)
- `pensionable_salary`: `gAAAABl2xW...` (encrypted base64)

**Frontend**:
- NI Number: `AB123456C` (decrypted, readable)
- Date of Birth: `1990-01-15` (decrypted, readable)
- Pensionable Salary: `50000` (decrypted, readable)

**Logs**:
- Backend: "Encryption service initialized successfully"
- Backend: "Encrypted PII for employee create"
- Backend: "Decrypted PII for employee retrieval"

---

**Next Step**: Complete checklist above, then test creating a new employee!
