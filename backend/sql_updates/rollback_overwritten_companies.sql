-- ROLLBACK: Remove the companies that were accidentally overwritten
-- Run this to delete the 3 companies that had their data replaced

-- Step 1: Check what's currently in those IDs
SELECT 
    id,
    name,
    scheme_ref,
    category_name,
    has_group_life,
    has_gci,
    has_gip,
    has_bupa,
    created_at
FROM public.companies
WHERE id IN (
    '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb',
    '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d',
    '9ad13e78-e9b8-454d-b1cc-97aa5c78340e'
);

-- Step 2: DELETE the overwritten companies (UNCOMMENT to execute)
-- DELETE FROM public.companies
-- WHERE id IN (
--     '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb',
--     '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d',
--     '9ad13e78-e9b8-454d-b1cc-97aa5c78340e'
-- );

-- Step 3: Verify deletion
-- SELECT COUNT(*) as deleted_count
-- FROM public.companies
-- WHERE id IN (
--     '013eaa84-95e5-4365-9ed0-e75cb2e6f6fb',
--     '4a8d2ef3-942d-4a5a-babf-85ad7ecd751d',
--     '9ad13e78-e9b8-454d-b1cc-97aa5c78340e'
-- );
-- Should return 0 if successfully deleted
