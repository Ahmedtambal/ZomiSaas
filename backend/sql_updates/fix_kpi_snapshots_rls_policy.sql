-- Fix RLS policy for kpi_snapshots table
-- The policy should use organization_id from user_profiles, not auth.uid()

-- Drop existing incorrect policy
DROP POLICY IF EXISTS kpi_snapshots_org_isolation ON public.kpi_snapshots;

-- Create correct RLS policy that matches organization_id from user_profiles
CREATE POLICY kpi_snapshots_org_isolation ON public.kpi_snapshots
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Verify the policy was created
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'kpi_snapshots';
