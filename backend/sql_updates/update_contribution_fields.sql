-- ========================================================================
-- Update Change Information Contribution Fields
-- Move "Update Employee Contribution" and "Update Employer Contribution" 
-- from standalone fields to changeType options
-- ========================================================================

-- Add new_employer_contribution column
ALTER TABLE public.change_information
ADD COLUMN IF NOT EXISTS new_employer_contribution TEXT NULL;

-- Drop the update_employee_contribution boolean column (deprecated - now part of changeType)
-- Keeping it for backward compatibility but will not be used going forward
-- ALTER TABLE public.change_information
-- DROP COLUMN IF EXISTS update_employee_contribution;

-- Update the change_type CHECK constraint to include both contribution options
ALTER TABLE public.change_information
DROP CONSTRAINT IF EXISTS change_information_change_type_check;

ALTER TABLE public.change_information
ADD CONSTRAINT change_information_change_type_check CHECK (
  (change_type)::text[] <@ ARRAY[
    'Leaver'::text,
    'Maternity Leave'::text,
    'Died'::text,
    'Change of Name'::text,
    'Change of Address'::text,
    'Change of Salary'::text,
    'Update Employee Contribution'::text,
    'Update Employer Contribution'::text,
    'Other'::text
  ]
);

-- Add comment for documentation
COMMENT ON COLUMN public.change_information.new_employer_contribution IS 'Encrypted field - New employer contribution percentage/amount when Update Employer Contribution is selected';

-- Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'change_information'
AND column_name IN ('new_employee_contribution', 'new_employer_contribution')
ORDER BY ordinal_position;
