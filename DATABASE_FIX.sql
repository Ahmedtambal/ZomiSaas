-- ============================================================================
-- DATABASE FIX: Remove ALL references to deleted columns in trigger function
-- ============================================================================

-- This fixes the error:
-- "Could not find the 'split_template_group_name' column of 'employees' in the schema cache"
-- And any other deleted column references

-- Step 1: Check current trigger function (optional - view what needs fixing)
-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'populate_employee_auto_fields';

-- Step 2: Drop old trigger function (CASCADE removes dependent triggers)
DROP FUNCTION IF EXISTS populate_employee_auto_fields() CASCADE;

-- Step 3: Create minimal trigger function without any column references
-- This function simply returns NEW without modifying any fields
-- Remove any references to deleted columns like:
-- - split_template_group_name
-- - Any other columns you deleted from the employees table
CREATE OR REPLACE FUNCTION populate_employee_auto_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Minimal trigger function for employee insert
    -- All auto-population removed to avoid schema cache errors
    -- The moddatetime trigger handles updated_at
    -- Default values in table definition handle other fields
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_employee_insert_auto_populate
    BEFORE INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION populate_employee_auto_fields();

COMMENT ON FUNCTION populate_employee_auto_fields() IS 
'Minimal employee insert trigger. Removed all column references to fix schema cache errors after column deletions.';

-- ============================================================================
-- ENCRYPTION MIGRATION: Check if existing data needs encryption
-- ============================================================================

-- Step 4: Check if ni_number contains encrypted data (base64) or plaintext
SELECT 
    id,
    first_name,
    surname,
    ni_number,
    date_of_birth,
    pensionable_salary,
    CASE 
        WHEN ni_number ~ '^[A-Za-z0-9+/]+=*$' AND LENGTH(ni_number) > 20 THEN 'Likely Encrypted'
        WHEN ni_number IS NOT NULL THEN 'Plaintext (needs encryption)'
        ELSE 'NULL'
    END as ni_status,
    CASE 
        WHEN date_of_birth::text ~ '^[A-Za-z0-9+/]+=*$' AND LENGTH(date_of_birth::text) > 20 THEN 'Likely Encrypted'
        WHEN date_of_birth IS NOT NULL THEN 'Plaintext (needs encryption)'
        ELSE 'NULL'
    END as dob_status
FROM employees
LIMIT 10;

-- ============================================================================
-- OPTIONAL: If you need to clear test data and start fresh
-- ============================================================================

-- WARNING: This will DELETE ALL employee data! Only use in development!
-- TRUNCATE TABLE employees CASCADE;

-- ============================================================================
-- ALTERNATIVE: If you need to completely remove the trigger
-- ============================================================================

-- If you don't need any auto-population logic at all, you can drop everything:
-- DROP TRIGGER IF EXISTS on_employee_insert_auto_populate ON employees;
-- DROP FUNCTION IF EXISTS populate_employee_auto_fields() CASCADE;

-- ============================================================================
-- SUPABASE SCHEMA CACHE REFRESH (REQUIRED!)
-- ============================================================================

-- Step 5: Refresh Supabase's PostgREST schema cache
-- This is CRITICAL after changing functions/triggers

-- Method 1: Run this SQL command
NOTIFY pgrst, 'reload schema';

-- Method 2: Or manually in Supabase Dashboard:
-- 1. Go to Settings → API
-- 2. Click "Reload Schema Cache" button
-- 3. Wait for confirmation

-- Method 3: Or restart your backend service on Render (forces reconnect)
