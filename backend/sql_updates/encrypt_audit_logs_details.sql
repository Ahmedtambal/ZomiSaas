-- =====================================================
-- Update audit_logs table to store encrypted details
-- =====================================================

-- Change details column from JSONB to TEXT to store encrypted data
ALTER TABLE public.audit_logs
ALTER COLUMN details TYPE TEXT;

-- Add comment to document the encryption
COMMENT ON COLUMN public.audit_logs.details IS 'Encrypted JSON data containing old_data, new_data, metadata, and record_id';

-- Note: Existing unencrypted JSONB data will be converted to text automatically
-- The encryption service will handle encrypting new entries going forward
