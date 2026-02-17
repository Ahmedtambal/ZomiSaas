-- Insert NEW test companies for development/testing
-- Run this in Supabase SQL Editor to add sample company data
-- This will create NEW companies with auto-generated UUIDs

INSERT INTO public.companies (
    organization_id,
    name,
    is_pension_active,
    is_smart_pension,
    send_pension_pack,
    postponement_period,
    pension_provider_info,
    scheme_ref,
    category_name,
    advice_type,
    selling_adviser_id,
    has_group_life,
    has_gci,
    has_gip,
    has_bupa,
    operational_notes
) VALUES
-- Company 1: Zomi Test 2 (Group Life only)
(
    'cf7d62a7-eeec-4a95-bd11-1479d0cbd260',
    'Zomi Test Company Alpha',
    true,
    true,
    true,
    'Day 1',
    'Pension Opt Enrol - we process and upload the pension contributions',
    'TEST001',
    '5.00%EE 5.00%ER.SMART',
    'Test Plan',
    '132972',
    true,
    false,
    false,
    false,
    'Test company with Group Life only'
),
-- Company 2: Zomi Test 3 (No benefits)
(
    'cf7d62a7-eeec-4a95-bd11-1479d0cbd260',
    'Zomi Test Company Beta',
    true,
    true,
    true,
    'Day 1',
    'Pension - Scottish Widows - We upload new members. We upload the pension contribution.',
    'TEST002',
    '5.00%EE 4.00%ER.SMART',
    'Test Plan',
    '132972',
    false,
    false,
    false,
    false,
    'Test company with no benefits'
),
-- Company 3: Zomi Test 4 (Full benefits package: Group Life, GIP, BUPA)
(
    'cf7d62a7-eeec-4a95-bd11-1479d0cbd260',
    'Zomi Test Company Gamma',
    true,
    true,
    true,
    '3 months',
    'Pension - Scottish Widows - We upload new members. Client uploads the pension contribution.',
    'TEST003',
    '3.40%EE 6.00%ER',
    'Test Plan',
    '132972',
    true,
    false,
    true,
    true,
    'Test company with full benefits: Group Life, GIP, BUPA'
);

-- Verify the inserts
SELECT 
    name,
    scheme_ref,
    category_name,
    postponement_period,
    has_group_life,
    has_gci,
    has_gip,
    has_bupa,
    operational_notes
FROM public.companies
WHERE name LIKE 'Zomi Test%'
ORDER BY name;
