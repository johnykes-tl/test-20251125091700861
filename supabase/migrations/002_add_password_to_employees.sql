/*
  # Add Password Storage to Employees Table
  
  1. Purpose: Add secure password storage to employees table for admin reference
  2. Schema: Add password_hash column with proper constraints
  3. Security: Store only hashed passwords, never plain text
*/

-- Add password_hash column to employees table
ALTER TABLE public.employees 
ADD COLUMN password_hash text;

-- Add comment to clarify this is for hashed passwords only
COMMENT ON COLUMN public.employees.password_hash IS 'Hashed password for admin reference - never store plain text';

-- Create index for password_hash column (optional, for future password change operations)
CREATE INDEX idx_employees_password_hash ON public.employees(password_hash);

-- Update the updated_at trigger to include the new column
-- (The existing trigger will automatically handle this, but documenting for clarity)