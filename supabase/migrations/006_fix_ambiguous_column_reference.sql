/*
  # Fix Ambiguous Column Reference in Tests System
  
  1. Purpose: Fix ambiguous column reference error in is_employee_on_leave function
  2. Issue: employee_id parameter conflicts with leave_requests.employee_id column
  3. Solution: Use explicit table qualification for column references
*/

-- Drop the existing function with ambiguous column reference
DROP FUNCTION IF EXISTS is_employee_on_leave(uuid, date);

-- Recreate the function with explicit column qualification
CREATE OR REPLACE FUNCTION is_employee_on_leave(employee_id uuid, check_date date)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.leave_requests lr
    WHERE lr.employee_id = is_employee_on_leave.employee_id
    AND lr.status = 'approved'
    AND lr.start_date <= check_date
    AND lr.end_date >= check_date
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to ensure it works properly
GRANT EXECUTE ON FUNCTION is_employee_on_leave(uuid, date) TO authenticated;

-- Add comment for clarity
COMMENT ON FUNCTION is_employee_on_leave(uuid, date) IS 'Checks if an employee is on approved leave for a specific date. Uses table aliases to avoid column name ambiguity.';