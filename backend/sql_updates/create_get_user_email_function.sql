-- Function to get user email from auth.users table
-- This is needed because the public schema cannot directly access auth.users
-- The function runs with SECURITY DEFINER privileges to access auth schema

CREATE OR REPLACE FUNCTION get_user_email_by_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION get_user_email_by_id(UUID) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_user_email_by_id IS 'Returns the email address for a given user ID from auth.users table';
