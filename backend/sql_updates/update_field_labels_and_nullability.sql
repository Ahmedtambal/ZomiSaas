-- Rename Database Columns to Match Form Labels
-- This migration renames columns to align with updated form field labels
-- 
-- Changes:
-- 1. 'gender' → 'legal_gender' (form label: "Legal Gender")
-- 2. 'selected_retirement_age' → 'other' (form label: "Other")
-- 3. 'nationality' remains the same (form label: "Nationality")
-- 
-- Author: System
-- Date: 2026-02-17

-- ====================
-- EMPLOYEES TABLE
-- ====================

-- Check if columns already have the new names
DO $$ 
BEGIN
    -- Only rename gender to legal_gender if gender exists and legal_gender doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'gender'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'legal_gender'
    ) THEN
        -- Step 1: Drop foreign key constraint on gender (will be recreated)
        ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_gender_fkey;
        
        -- Step 2: Rename gender column to legal_gender
        ALTER TABLE public.employees RENAME COLUMN gender TO legal_gender;
        
        -- Step 3: Recreate foreign key constraint with new column name
        ALTER TABLE public.employees 
        ADD CONSTRAINT employees_legal_gender_fkey 
        FOREIGN KEY (legal_gender) REFERENCES lookup_genders (value);
        
        RAISE NOTICE 'Renamed gender to legal_gender';
    ELSE
        RAISE NOTICE 'Column gender already renamed or legal_gender already exists';
    END IF;

    -- Only rename selected_retirement_age to other if it exists and other doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'selected_retirement_age'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'other'
    ) THEN
        -- Step 4: Rename selected_retirement_age to other
        ALTER TABLE public.employees RENAME COLUMN selected_retirement_age TO other;
        
        RAISE NOTICE 'Renamed selected_retirement_age to other';
    ELSE
        RAISE NOTICE 'Column selected_retirement_age already renamed or other already exists';
    END IF;

    -- Change other column type to TEXT if it exists and is not already TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'other' 
        AND data_type != 'text'
    ) THEN
        -- Step 4b: Change other column type from INTEGER to TEXT for free-form input
        ALTER TABLE public.employees ALTER COLUMN other TYPE TEXT USING other::TEXT;
        
        RAISE NOTICE 'Changed other column type to TEXT';
    ELSE
        RAISE NOTICE 'Column other is already TEXT type or does not exist';
    END IF;
END $$;

-- Step 5: Add column comments (safe to run multiple times)
COMMENT ON COLUMN public.employees.legal_gender IS 
'Legal Gender of the employee. Form label: "Legal Gender". Required field. Values: Male, Female, Other, Prefer not to say. References lookup_genders table.';

COMMENT ON COLUMN public.employees.nationality IS 
'Nationality of the employee. Form label: "Nationality". Optional field. References lookup_nationalities table.';

COMMENT ON COLUMN public.employees.other IS 
'Other information (previously retirement age). Form label: "Other". Optional field. Text value for free-form input.';

-- Step 6: Update any indexes that reference the old column names (safe to run multiple times)
DROP INDEX IF EXISTS idx_employees_gender;
CREATE INDEX IF NOT EXISTS idx_employees_legal_gender ON public.employees USING btree (legal_gender);

-- ====================
-- UPDATE RLS POLICIES (if any reference these columns)
-- ====================

-- Note: Review and update any Row Level Security policies that reference 'gender' or 'selected_retirement_age'
-- Example (uncomment and modify if needed):
-- DROP POLICY IF EXISTS some_policy_name ON employees;
-- CREATE POLICY some_policy_name ON employees ... WHERE legal_gender = ...;

-- ====================
-- VERIFICATION
-- ====================

-- Verify column renames were successful
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('legal_gender', 'nationality', 'other')
ORDER BY column_name;

-- Verify old columns no longer exist
SELECT 
    column_name
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('gender', 'selected_retirement_age');
-- This should return 0 rows

-- Show column comments
SELECT 
    c.column_name,
    pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
    pgd.objsubid = c.ordinal_position 
    AND c.table_schema = st.schemaname 
    AND c.table_name = st.relname
)
WHERE st.relname = 'employees'
AND c.column_name IN ('legal_gender', 'nationality', 'other');
