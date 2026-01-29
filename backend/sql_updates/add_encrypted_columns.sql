-- =====================================================
-- SOLUTION: Add Encrypted Columns for PII Fields
-- =====================================================
-- This migration adds new TEXT columns to store encrypted values
-- Original columns remain unchanged for backward compatibility

-- Add encrypted TEXT columns for fields that cannot store encrypted values
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS ni_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth_encrypted TEXT,
ADD COLUMN IF NOT EXISTS pensionable_salary_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS mobile_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS home_number_encrypted TEXT;

-- Add indexes for encrypted columns (for performance)
CREATE INDEX IF NOT EXISTS idx_employees_ni_encrypted 
    ON public.employees(ni_number_encrypted);

CREATE INDEX IF NOT EXISTS idx_employees_email_encrypted 
    ON public.employees(email_address_encrypted);

-- Add comment explaining the encryption strategy
COMMENT ON COLUMN public.employees.ni_number_encrypted IS 
'Encrypted NI Number using Fernet AES-256. Original ni_number kept for compatibility.';

COMMENT ON COLUMN public.employees.date_of_birth_encrypted IS 
'Encrypted Date of Birth using Fernet AES-256. Original date_of_birth kept as DATE type.';

COMMENT ON COLUMN public.employees.pensionable_salary_encrypted IS 
'Encrypted Pensionable Salary using Fernet AES-256. Original pensionable_salary kept as NUMERIC.';

COMMENT ON COLUMN public.employees.email_address_encrypted IS 
'Encrypted Email Address using Fernet AES-256. Original email_address kept for search.';

COMMENT ON COLUMN public.employees.mobile_number_encrypted IS 
'Encrypted Mobile Number using Fernet AES-256. Original mobile_number kept for display.';

COMMENT ON COLUMN public.employees.home_number_encrypted IS 
'Encrypted Home Number using Fernet AES-256. Original home_number kept for display.';

-- =====================================================
-- MIGRATION STRATEGY
-- =====================================================
/*
Phase 1: Run this migration
- Adds _encrypted columns
- Original columns remain untouched

Phase 2: Update application code
- Write to BOTH original and _encrypted columns
- Read from _encrypted columns (decrypt), fallback to original if null

Phase 3: Data migration (optional, run later)
- Encrypt existing plaintext data into _encrypted columns
- Can run in batches to avoid timeouts

Phase 4: Cleanup (future, optional)
- Once all data is migrated, can drop original columns
- Or keep both for dual-mode support

BENEFITS:
✅ No breaking changes
✅ Gradual migration possible
✅ Rollback friendly
✅ Works with existing data
✅ Full encryption of all PII fields
*/

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
    AND column_name LIKE '%encrypted%'
ORDER BY 
    ordinal_position;
