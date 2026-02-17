-- Quick check to see what columns exist in employees table
-- Run this first to see the current state

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN (
    'gender', 'legal_gender', 
    'sex',
    'selected_retirement_age', 'other'
)
ORDER BY column_name;
