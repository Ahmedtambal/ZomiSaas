-- Optimize RLS policy for kpi_snapshots table
-- Fix: Wrap auth.uid() in (SELECT auth.uid()) to prevent re-evaluation per row
-- This significantly improves query performance at scale

-- Drop existing policy
DROP POLICY IF EXISTS kpi_snapshots_org_isolation ON public.kpi_snapshots;

-- Create optimized RLS policy with SELECT wrapper
CREATE POLICY kpi_snapshots_org_isolation ON public.kpi_snapshots
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = (SELECT auth.uid())
        )
    );

-- Verify the policy was optimized
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual LIKE '%SELECT auth.uid()%' THEN '✅ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' THEN '⚠️ NEEDS FIX'
    ELSE '✓ OK'
  END as optimization_status
FROM pg_policies 
WHERE tablename = 'kpi_snapshots';
