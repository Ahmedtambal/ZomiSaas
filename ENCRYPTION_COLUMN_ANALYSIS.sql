-- =====================================================
-- ENCRYPTION COLUMN TYPE ANALYSIS
-- =====================================================
-- Run this in Supabase SQL Editor to check column types

-- Check all columns in employees table with their data types
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable
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

-- =====================================================
-- ANALYSIS RESULTS AND RECOMMENDATIONS
-- =====================================================
/*
Expected Results:
- ni_number: VARCHAR/TEXT → CAN be encrypted ✅
- date_of_birth: DATE → CANNOT be encrypted (need TEXT) ❌
- pensionable_salary: NUMERIC → CANNOT be encrypted (need TEXT) ❌
- email_address: VARCHAR/TEXT → CAN be encrypted ✅
- mobile_number: VARCHAR/TEXT → CAN be encrypted ✅
- home_number: VARCHAR/TEXT → CAN be encrypted ✅

SOLUTION OPTIONS:

Option 1: CHANGE COLUMN TYPES (RECOMMENDED FOR FULL ENCRYPTION)
- Change date_of_birth to TEXT
- Change pensionable_salary to TEXT
- Then encrypt all PII fields

Option 2: STORE ENCRYPTED IN SEPARATE COLUMNS (NO SCHEMA CHANGE)
- Keep existing columns as-is (for compatibility)
- Add new columns: date_of_birth_encrypted TEXT, pensionable_salary_encrypted TEXT
- App uses encrypted columns, fallback to original if null

Option 3: ENCRYPT ONLY TEXT COLUMNS (CURRENT IMPLEMENTATION)
- Encrypt: ni_number, email_address, mobile_number, home_number
- Don't encrypt: date_of_birth, pensionable_salary
- Least secure but no schema changes needed
*/
