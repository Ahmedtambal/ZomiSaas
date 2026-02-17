-- RESTORE: Fix the 3 companies that were accidentally overwritten
-- This will restore: Blackfish Engineering Design Ltd, Vetted Limited, and Andros UK Limited (London)

UPDATE public.companies
SET
    name = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN 'Blackfish Engineering Design Ltd'
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN 'Vetted Limited'
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN 'Andros UK Limited (London) (Hammersmith)'
    END,
    is_pension_active = true,
    is_smart_pension = true,
    send_pension_pack = true,
    postponement_period = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN 'Day 1'
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN 'Day 1'
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN '3 months'
    END,
    pension_provider_info = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN 'Pension Opt Enrol - we process and upload the pension contributions'
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN 'Pension - Scottish Widows - We upload new members. We upload the pension contribution.'
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN 'Pension - Scottish Widows - We upload new members. Client uploads the pension contribution.'
    END,
    scheme_ref = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN 'IOB68952741'
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN 'IOB68952655'
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN 'IOB68952622'
    END,
    category_name = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN '5.00%EE 5.00%ER.SMART'
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN '5.00%EE 4.00%ER.SMART'
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN '3.40%EE 6.00%ER'
    END,
    advice_type = 'Migrated Plans',
    selling_adviser_id = '132972',
    has_group_life = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN true
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN false
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN true
    END,
    has_gci = false,
    has_gip = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN false
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN false
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN true
    END,
    has_bupa = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN false
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN false
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN true
    END,
    operational_notes = CASE id
        WHEN '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb' THEN NULL
        WHEN '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d' THEN NULL
        WHEN '9ad13e78-e9b8-454d-b1cc-97aa5c78340e' THEN 'Salex including an employer NI saving. Confirmation that Bupa and the Group Income Protection have been added to IO and processed.'
    END
WHERE id IN (
    '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb',
    '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d',
    '9ad13e78-e9b8-454d-b1cc-97aa5c78340e'
);

-- Verify the restoration
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
WHERE id IN (
    '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb',
    '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d',
    '9ad13e78-e9b8-454d-b1cc-97aa5c78340e'
)
ORDER BY name;

-- Expected results:
-- 1. Andros UK Limited (London) (Hammersmith) - IOB68952622, 3.40%EE 6.00%ER, Group Life + GIP + BUPA
-- 2. Blackfish Engineering Design Ltd - IOB68952741, 5.00%EE 5.00%ER.SMART, Group Life only
-- 3. Vetted Limited - IOB68952655, 5.00%EE 4.00%ER.SMART, No benefits
