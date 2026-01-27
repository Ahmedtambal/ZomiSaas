-- Add tracking columns to forms table (same as employees table)
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS submitted_via TEXT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS ip_address INET NULL,
ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_submitted_via 
ON public.forms USING btree (submitted_via) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_forms_ip_address 
ON public.forms USING btree (ip_address) 
TABLESPACE pg_default;

-- Add comments to document the columns
COMMENT ON COLUMN public.forms.submitted_via IS 'Method of form submission (manual, form_link, api, import, etc.)';
COMMENT ON COLUMN public.forms.ip_address IS 'IP address of the submitter';
COMMENT ON COLUMN public.forms.user_agent IS 'User agent string of the submitter browser/client';
