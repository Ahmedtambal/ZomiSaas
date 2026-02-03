-- Add 'owner' role to user_profiles table check constraint
-- This migration updates the role check constraint to include 'owner', 'admin', and 'user'

-- Drop the existing check constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new check constraint with 'owner' role included
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('owner', 'admin', 'user'));

-- Update any existing 'Admin' or 'Member' roles to lowercase equivalents (if any exist)
-- This is safe because we're mapping to the new valid values
UPDATE user_profiles 
SET role = LOWER(role) 
WHERE role IN ('Admin', 'Member', 'Owner', 'ADMIN', 'USER', 'OWNER');

-- Additional cleanup: map 'Member' to 'user' and 'Admin' to 'admin'
UPDATE user_profiles 
SET role = 'user' 
WHERE role = 'member';

UPDATE user_profiles 
SET role = 'admin' 
WHERE role = 'Admin' OR role = 'ADMIN';

UPDATE user_profiles 
SET role = 'owner' 
WHERE role = 'Owner' OR role = 'OWNER';

COMMENT ON CONSTRAINT user_profiles_role_check ON user_profiles IS 
    'Ensures role is one of: owner (organization owner), admin (can manage users), user (regular member)';
