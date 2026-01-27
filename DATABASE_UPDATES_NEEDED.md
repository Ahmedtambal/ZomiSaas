# Database Updates Required

## Summary
Run these SQL scripts in your Supabase database to complete the New Employee Upload form implementation.

---

## Script 1: Add job_title Column to Employees Table

**File:** `backend/sql_updates/add_job_title_to_employees.sql`

```sql
-- Add job_title column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS job_title TEXT NULL;

-- Add index for job_title for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_job_title 
ON public.employees USING btree (job_title) 
TABLESPACE pg_default;

-- Add comment to document the column
COMMENT ON COLUMN public.employees.job_title IS 'Job title or position of the employee';
```

**Purpose:** Adds the Job Title field that's now part of the form.

---

## Script 2: Add Tracking Columns to Forms Table

**File:** `backend/sql_updates/add_tracking_columns_to_forms.sql`

```sql
-- Add tracking columns to forms table (same as employees table)
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS submitted_via TEXT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS ip_address INET NULL,
ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_submitted_via 
ON public.forms USING btree (submitted_via) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_forms_ip_address 
ON public.forms USING btree (ip_address) 
TABLESPACE pg_default;

-- Add comments to document the columns
COMMENT ON COLUMN public.forms.submitted_via IS 'Method of form submission (manual, form_link, api, import, etc.)';
COMMENT ON COLUMN public.forms.ip_address IS 'IP address of the submitter';
COMMENT ON COLUMN public.forms.user_agent IS 'User agent string of the submitter browser/client';
```

**Purpose:** Adds tracking columns to forms table to match employees table and enable audit trail.

---

## Verification Queries

After running the scripts, verify the changes:

```sql
-- Check employees table for job_title column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'job_title';

-- Check forms table for new tracking columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name IN ('submitted_via', 'ip_address', 'user_agent');

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('employees', 'forms') 
AND indexname LIKE '%job_title%' OR indexname LIKE '%submitted_via%' OR indexname LIKE '%ip_address%';
```

---

## What Changed

### Form Template (23 Fields Total)
1. **Title** - Select dropdown (14 options)
2. **Forename** - Text input
3. **Surname** - Text input
4. **NI Number** - Text input
5. **Email Address** ✨ NEW - Email input
6. **Contact Number** ✨ NEW - Tel input
7. **Date of Birth** - Date input
8. **Sex** - Select dropdown (Male/Female)
9. **Marital Status** - Select dropdown (5 options)
10. **Address 1** - Text input
11. **Address 2** - Text input (optional)
12. **Address 3** - Text input (optional)
13. **Address 4** - Text input (optional)
14. **Postcode** - Text input
15. **UK Resident** - Select dropdown (Yes/No)
16. **Nationality** - Searchable dropdown (100 options)
17. **Job Title** ✨ NEW - Text input
18. **Basic Annual Salary** - Number input (renamed from "Salary")
19. **Employment Start Date** - Date input
20. **Selected Retirement Age** - Number input
21. **Section Number** - Text input (optional)
22. **Pension Investment Approach** - Searchable dropdown (18 options)

### Database Mappings
- `emailAddress` → `employees.email_address` ✅ (existing column)
- `contactNumber` → `employees.mobile_number` ✅ (existing column)
- `jobTitle` → `employees.job_title` ✨ (new column - run SQL script)
- `salary` → `employees.pensionable_salary` ✅ (existing column)

### Forms Table Enhancement
The `forms.form_data` JSONB column now stores:
```json
{
  "fields": [...],           // Field definitions
  "submission_data": {...},  // Actual submitted values ✨ NEW
  "submitted_at": "..."      // Submission timestamp ✨ NEW
}
```

Plus tracking columns:
- `submitted_via` - Method of submission (form_link, manual, api)
- `ip_address` - IP address of submitter
- `user_agent` - Browser/client information

---

## Instructions

1. **Login to Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste Script 1** → Click "Run"
4. **Copy and paste Script 2** → Click "Run"
5. **Run verification queries** to confirm success
6. **Test the form** at your deployment URL

The backend will automatically start using these new columns once they exist!
