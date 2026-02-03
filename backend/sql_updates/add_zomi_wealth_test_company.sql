-- Add Zomi Wealth Test company to companies table
-- This is a test company for development and testing purposes
-- Data from Corporate Information CSV (Row 25)

-- Note: You need to replace 'YOUR_ORGANIZATION_ID' with your actual organization UUID
-- To find your organization_id, run: SELECT id FROM organizations WHERE name = 'Your Organization Name';

-- Company Details from CSV:
-- Company: Zomi Wealth Test
-- Pension: Y
-- SMART: Y
-- Pension Postponement: 3 months
-- Pension Pack: Y
-- Pension Provider: Scottish Widows - We upload new members. Client uploads the pension contributions
-- Category Name: 4.00%EE 10.00%ER
-- Group Life: Y
-- Group Critical Illness: N
-- Group Income Protection: N
-- Bupa Group PMI Cover: N
-- Additional Info: Salex including an employer NI saving

-- Insert Zomi Wealth Test company
INSERT INTO public.companies (
  organization_id,
  name,
  created_at,
  updated_at
)
VALUES (
  'YOUR_ORGANIZATION_ID', -- Replace with your organization UUID
  'Zomi Wealth Test',
  NOW(),
  NOW()
)
ON CONFLICT (organization_id, name) DO NOTHING; -- Prevent duplicate if already exists

-- Verify the insert
SELECT id, organization_id, name, created_at, updated_at
FROM public.companies
WHERE name = 'Zomi Wealth Test';

-- ============================================
-- INSTRUCTIONS FOR USE:
-- ============================================
-- 1. Find your organization_id by running:
--    SELECT id, name FROM public.organizations;
--
-- 2. Replace 'YOUR_ORGANIZATION_ID' above with your actual UUID
--
-- 3. Run this script in Supabase SQL Editor
--
-- 4. The company will now appear in:
--    - New Employee Form company dropdown
--    - Change of Information company dropdown
--    - Members Data table company filter
-- ============================================

