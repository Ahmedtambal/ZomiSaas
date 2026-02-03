-- Fix handle_new_user trigger function to handle email confirmation flow
-- The issue is that user_profiles are not being created when users sign up

-- Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    org_id UUID;
    user_role TEXT;
BEGIN
    -- Log the trigger execution for debugging
    RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
    
    -- Extract organization_id from metadata
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    
    -- Extract role, default to 'user' if not provided
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    
    -- Validate we have an organization_id
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'organization_id is required in user metadata';
    END IF;
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        id, 
        organization_id, 
        full_name, 
        job_title, 
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        org_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'job_title', ''),
        user_role,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
    
    RAISE LOG 'User profile created for: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth signup
        RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

COMMENT ON FUNCTION public.handle_new_user() IS 
    'Automatically creates user_profiles record after Supabase Auth user creation';
