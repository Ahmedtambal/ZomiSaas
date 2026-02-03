-- Consolidate multiple permissive INSERT policies on forms table
-- Fix: Merge duplicate policies into single efficient policy
-- Current issue: "Allow insert for own organization" AND "Allow organization users to create forms" 
--                are both permissive, causing unnecessary overhead

-- Drop the duplicate policies
DROP POLICY IF EXISTS "Allow insert for own organization" ON public.forms;
DROP POLICY IF EXISTS "Allow organization users to create forms" ON public.forms;

-- Create single consolidated INSERT policy
-- This combines both checks into one policy for better performance
CREATE POLICY "Allow organization members to create forms" ON public.forms
    FOR INSERT
    WITH CHECK (
        -- User must be authenticated and belong to the organization
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = (SELECT auth.uid())
        )
    );

-- Verify no duplicate INSERT policies remain
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'forms' 
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Expected result: Only 1 INSERT policy per role
