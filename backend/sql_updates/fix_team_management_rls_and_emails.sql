-- Fix RLS policies for invite_codes and add email retrieval function
-- This migration fixes the team management issues

-- 1. Fix invite_codes RLS policies to allow admins/owners to insert
DROP POLICY IF EXISTS "Only admins can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can view organization invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can view invite codes" ON invite_codes;

-- Allow admins and owners to insert invite codes
CREATE POLICY "Admins and owners can create invite codes"
    ON invite_codes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.organization_id = invite_codes.organization_id
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- Allow admins and owners to view their organization's invite codes
CREATE POLICY "Admins and owners can view invite codes"
    ON invite_codes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.organization_id = invite_codes.organization_id
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- 2. Create a function to get user email safely (works around Admin API limitations)
CREATE OR REPLACE FUNCTION get_user_emails_for_organization(org_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    job_title TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        au.email,
        up.full_name,
        up.job_title,
        up.role,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    INNER JOIN auth.users au ON au.id = up.id
    WHERE up.organization_id = org_id
    ORDER BY up.created_at ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails_for_organization(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_emails_for_organization(UUID) IS 
    'Safely retrieves user profiles with emails for an organization without needing Admin API access';
