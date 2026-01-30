-- Fix: Add is_duplicate column to employees table or fix the function
-- Error: 'record "new" has no field "is_duplicate"' during employee INSERT

-- Option 1: Add the is_duplicate column to employees table (RECOMMENDED)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE;

-- Option 2: If the column already exists, check the function definition
-- Run this to see what the function does:
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'increment_duplicate_count';

-- After running Option 1, verify the column was added:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'employees' 
AND column_name = 'is_duplicate';
