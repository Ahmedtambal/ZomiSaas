-- =====================================================
-- Add New Fields to Change Information Table
-- Supports conditional fields: New Name, New Address, New Salary, Update Employee Contribution
-- All new fields are encrypted (except boolean flag)
-- =====================================================

-- Add new columns for conditional change details
ALTER TABLE public.change_information
ADD COLUMN IF NOT EXISTS new_name TEXT NULL,
ADD COLUMN IF NOT EXISTS new_address TEXT NULL,
ADD COLUMN IF NOT EXISTS new_salary TEXT NULL,
ADD COLUMN IF NOT EXISTS update_employee_contribution BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS new_employee_contribution TEXT NULL;

-- Update the change_type CHECK constraint to include the new option
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
    'Other'::text
  ]
);

-- Add indexes for performance (encrypted fields may be queried less often, but good to have)
CREATE INDEX IF NOT EXISTS idx_change_information_update_employee_contribution 
  ON public.change_information(update_employee_contribution) 
  WHERE update_employee_contribution = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.change_information.new_name IS 'Encrypted field - New name when Change of Name is selected';
COMMENT ON COLUMN public.change_information.new_address IS 'Encrypted field - New postal address when Change of Address is selected';
COMMENT ON COLUMN public.change_information.new_salary IS 'Encrypted field - New salary when Change of Salary is selected';
COMMENT ON COLUMN public.change_information.update_employee_contribution IS 'Boolean flag - Whether employee contribution update is requested';
COMMENT ON COLUMN public.change_information.new_employee_contribution IS 'Encrypted field - New employee contribution percentage/amount';

-- Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'change_information'
AND column_name IN ('new_name', 'new_address', 'new_salary', 'update_employee_contribution', 'new_employee_contribution')
ORDER BY ordinal_position;
