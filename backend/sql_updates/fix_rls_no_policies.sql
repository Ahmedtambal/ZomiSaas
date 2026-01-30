-- Fix RLS Enabled but No Policies Issue
-- These tables have RLS enabled but no policies, making them inaccessible
-- Since the backend uses service role key and handles all authorization, we'll disable RLS

-- Disable RLS on form_sections (backend-only access via service role)
ALTER TABLE public.form_sections DISABLE ROW LEVEL SECURITY;

-- Disable RLS on form_submissions (backend-only access via service role)
ALTER TABLE public.form_submissions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on form_versions (backend-only access via service role)
ALTER TABLE public.form_versions DISABLE ROW LEVEL SECURITY;

-- Note: These tables are accessed exclusively through the FastAPI backend
-- which uses the service role key and implements its own authorization logic.
-- RLS is not needed as the backend ensures proper data isolation by organization_id.
