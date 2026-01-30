-- Add IO Upload Status and Send Pension Pack columns to kpi_snapshots table

ALTER TABLE public.kpi_snapshots 
ADD COLUMN IF NOT EXISTS io_uploads_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pension_packs_sent INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.kpi_snapshots.io_uploads_completed IS 'Count of employees with io_upload_status = true';
COMMENT ON COLUMN public.kpi_snapshots.pension_packs_sent IS 'Count of employees with send_pension_pack = true';
