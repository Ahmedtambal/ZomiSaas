-- Add job_title column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS job_title TEXT NULL;

-- Add index for job_title for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_job_title 
ON public.employees USING btree (job_title) 
TABLESPACE pg_default;

-- Add comment to document the column
COMMENT ON COLUMN public.employees.job_title IS 'Job title or position of the employee';
