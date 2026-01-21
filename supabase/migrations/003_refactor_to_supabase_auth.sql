-- Migration: Refactor to use Supabase Auth
-- This migration refactors the authentication system to properly use Supabase's built-in auth

-- Drop old users table and related objects
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;

-- Create user_profiles table (linked to auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    job_title TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on organization_id for faster queries
CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);

-- Create index on role for faster role-based queries
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Update trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update invite_codes table to reference auth.users
ALTER TABLE invite_codes 
    DROP COLUMN IF EXISTS used_by CASCADE;

ALTER TABLE invite_codes 
    ADD COLUMN used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update audit_logs table to reference auth.users
ALTER TABLE audit_logs 
    DROP COLUMN IF EXISTS user_id CASCADE;

ALTER TABLE audit_logs 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Function to automatically create user profile after Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract metadata from auth.users
    INSERT INTO public.user_profiles (id, organization_id, full_name, job_title, role)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'organization_id')::UUID,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'job_title',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.invite_codes TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

COMMENT ON TABLE user_profiles IS 'User profile data linked to Supabase Auth users';
COMMENT ON COLUMN user_profiles.id IS 'References auth.users.id from Supabase Auth';
