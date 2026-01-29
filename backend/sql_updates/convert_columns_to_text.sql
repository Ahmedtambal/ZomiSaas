-- =====================================================
-- REVERT ENCRYPTED COLUMNS & CHANGE COLUMN TYPES
-- =====================================================
-- This script:
-- 1. Drops the *_encrypted columns (if they exist)
-- 2. Changes date_of_birth and pensionable_salary to TEXT type
-- 3. Allows encrypted base64 strings to be stored in any column

-- =====================================================
-- Step 1: Drop encrypted columns (clean up)
-- =====================================================

ALTER TABLE public.employees
DROP COLUMN IF EXISTS ni_number_encrypted,
DROP COLUMN IF EXISTS date_of_birth_encrypted,
DROP COLUMN IF EXISTS pensionable_salary_encrypted,
DROP COLUMN IF EXISTS email_address_encrypted,
DROP COLUMN IF EXISTS mobile_number_encrypted,
DROP COLUMN IF EXISTS home_number_encrypted;

-- =====================================================
-- Step 2: Convert columns to TEXT type
-- =====================================================

-- Convert date_of_birth from DATE to TEXT
-- This allows encrypted base64 strings to be stored
ALTER TABLE public.employees
ALTER COLUMN date_of_birth TYPE TEXT;

-- Convert pensionable_salary from NUMERIC to TEXT
-- This allows encrypted base64 strings to be stored
ALTER TABLE public.employees
ALTER COLUMN pensionable_salary TYPE TEXT;

-- Add comments explaining the change
COMMENT ON COLUMN public.employees.date_of_birth IS 
'Date of Birth (TEXT). Stores encrypted base64 or plaintext date. Encrypted using Fernet AES-256.';

COMMENT ON COLUMN public.employees.pensionable_salary IS 
'Pensionable Salary (TEXT). Stores encrypted base64 or plaintext number. Encrypted using Fernet AES-256.';

-- =====================================================
-- Verify the changes
-- =====================================================
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'employees'
    AND column_name IN (
        'ni_number',
        'date_of_birth',
        'pensionable_salary',
        'email_address',
        'mobile_number',
        'home_number'
    )
ORDER BY 
    ordinal_position;

-- Expected result: ALL columns should now be 'text' type
