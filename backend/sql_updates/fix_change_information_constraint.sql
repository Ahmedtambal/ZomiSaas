-- Fix the change_type check constraint to support arrays
ALTER TABLE change_information DROP CONSTRAINT IF EXISTS change_information_change_type_check;

-- Since change_type is an array, we need to validate each element
-- Using a function to check if all elements are valid
ALTER TABLE change_information ADD CONSTRAINT change_information_change_type_check 
  CHECK (
    change_type::text[] <@ ARRAY[
      'Leaver', 
      'Maternity Leave', 
      'Died', 
      'Change of Name', 
      'Change of Address', 
      'Change of Salary', 
      'Other'
    ]::text[]
  );
