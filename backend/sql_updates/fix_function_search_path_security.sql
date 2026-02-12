-- Fix Function Search Path Security Issues
-- Adds SET search_path = '' to all functions to prevent SQL injection via search path manipulation

-- 1. Fix create_form_version_on_update function
CREATE OR REPLACE FUNCTION public.create_form_version_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if form_data has changed (NOT form_structure - that's the old field name)
    IF OLD.form_data IS DISTINCT FROM NEW.form_data THEN
        -- Insert new version into form_versions table
        INSERT INTO public.form_versions (
            form_id,
            version_number,
            form_data_snapshot,
            created_by_user_id,
            change_notes
        )
        VALUES (
            NEW.id,
            NEW.version,
            OLD.form_data,  -- Store OLD version before update
            NEW.created_by_user_id,
            'Auto-saved version ' || NEW.version
        );
        
        -- Increment version number
        NEW.version := NEW.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Fix populate_employee_auto_fields function
CREATE OR REPLACE FUNCTION public.populate_employee_auto_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Auto-populate fields before insert
    IF NEW.submission_token IS NULL THEN
        NEW.submission_token := gen_random_uuid()::text;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Fix increment_duplicate_count function
CREATE OR REPLACE FUNCTION public.increment_duplicate_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Increment duplicate count when a duplicate employee is detected
    IF NEW.is_duplicate = TRUE THEN
        UPDATE public.employees
        SET duplicate_count = COALESCE(duplicate_count, 0) + 1
        WHERE id = NEW.original_employee_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Fix get_user_email_by_id function
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    RETURN user_email;
END;
$$;

-- Verify all functions now have search_path set
-- Run this query to check:
-- SELECT routine_name, routine_schema
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_type = 'FUNCTION'
-- AND routine_name IN ('create_form_version_on_update', 'populate_employee_auto_fields', 'increment_duplicate_count', 'get_user_email_by_id');
