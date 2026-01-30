-- Auto-set is_pension_active based on pension_start_date
-- is_pension_active should be TRUE only when pension_start_date is today or in the past

-- Step 1: Create the function to auto-calculate is_pension_active
CREATE OR REPLACE FUNCTION public.auto_set_pension_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- If pension_start_date exists and is today or in the past, set is_pension_active = true
    -- If pension_start_date is in the future or NULL, set is_pension_active = false
    IF NEW.pension_start_date IS NOT NULL AND NEW.pension_start_date <= CURRENT_DATE THEN
        NEW.is_pension_active := TRUE;
    ELSE
        NEW.is_pension_active := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_set_pension_active ON public.employees;

-- Step 3: Create the trigger on employees table
CREATE TRIGGER trigger_auto_set_pension_active
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_pension_active();

-- Step 4: Update all existing records to reflect correct pension status
UPDATE public.employees
SET is_pension_active = CASE
    WHEN pension_start_date IS NOT NULL AND pension_start_date <= CURRENT_DATE THEN TRUE
    ELSE FALSE
END;

-- Step 5: Verify the results
SELECT 
    id,
    first_name,
    surname,
    pension_start_date,
    is_pension_active,
    CASE 
        WHEN pension_start_date IS NOT NULL AND pension_start_date <= CURRENT_DATE THEN 'Should be TRUE'
        ELSE 'Should be FALSE'
    END as expected_status
FROM public.employees
WHERE pension_start_date IS NOT NULL
ORDER BY pension_start_date DESC
LIMIT 20;
