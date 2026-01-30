-- Fix: Remove incorrect trigger on forms table
-- The is_duplicate field is for employees table, not forms table
-- Error: 'record "new" has no field "is_duplicate"' on forms INSERT

-- Step 1: Drop the incorrect trigger from forms table
DROP TRIGGER IF EXISTS trigger_increment_duplicate_count ON public.forms;

-- Step 2: Ensure the trigger exists on employees table (where it belongs)
-- First, drop if exists to ensure clean state
DROP TRIGGER IF EXISTS trigger_increment_duplicate_count ON public.employees;

-- Step 3: Recreate the trigger on employees table ONLY
CREATE TRIGGER trigger_increment_duplicate_count
AFTER INSERT OR UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.increment_duplicate_count();

-- Verify the fix
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_increment_duplicate_count'
ORDER BY event_object_table;
