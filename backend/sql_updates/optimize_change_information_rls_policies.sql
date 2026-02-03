-- Optimize RLS policies for change_information table
-- Fix: Wrap auth.uid() in (SELECT auth.uid()) to prevent re-evaluation per row
-- This significantly improves query performance at scale

-- Policy 1: Optimize SELECT policy
DROP POLICY IF EXISTS "Users can view their organization's change requests" ON public.change_information;
CREATE POLICY "Users can view their organization's change requests"
  ON public.change_information
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = (SELECT auth.uid())
    )
  );

-- Policy 2: Optimize INSERT policy
DROP POLICY IF EXISTS "Users can insert change requests for their organization" ON public.change_information;
CREATE POLICY "Users can insert change requests for their organization"
  ON public.change_information
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = (SELECT auth.uid())
    )
  );

-- Policy 3: Optimize UPDATE policy
DROP POLICY IF EXISTS "Users can update their organization's change requests" ON public.change_information;
CREATE POLICY "Users can update their organization's change requests"
  ON public.change_information
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = (SELECT auth.uid())
    )
  );

-- Policy 4: Optimize DELETE policy
DROP POLICY IF EXISTS "Users can delete their organization's change requests" ON public.change_information;
CREATE POLICY "Users can delete their organization's change requests"
  ON public.change_information
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = (SELECT auth.uid())
    )
  );

-- Verify policies were updated
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
WHERE tablename = 'change_information'
ORDER BY cmd;
