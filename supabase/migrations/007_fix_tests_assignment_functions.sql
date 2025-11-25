/*
  # Fix Tests Assignment Functions
  
  1. Purpose: Fix and improve the assign_daily_tests function with better logging
  2. Issues: Function may have logical problems or permission issues
  3. Solution: Recreate function with enhanced logic and error handling
*/

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS assign_daily_tests(date);
DROP FUNCTION IF EXISTS get_test_eligible_employees(date);

-- Recreate get_test_eligible_employees function with better logic
CREATE OR REPLACE FUNCTION get_test_eligible_employees(target_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  employee_id uuid,
  employee_name text,
  department text,
  email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.name as employee_name,
    e.department,
    e.email
  FROM public.employees e
  WHERE e.is_active = true
    AND e.test_eligible = true
    AND NOT EXISTS (
      SELECT 1 FROM public.leave_requests lr
      WHERE lr.employee_id = e.id
      AND lr.status = 'approved'
      AND lr.start_date <= target_date
      AND lr.end_date >= target_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced assign_daily_tests function with detailed logging
CREATE OR REPLACE FUNCTION assign_daily_tests(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  test_record RECORD;
  eligible_employees_array uuid[];
  selected_employees uuid[];
  assignment_count integer := 0;
  total_tests integer := 0;
  result json;
  debug_info text := '';
BEGIN
  -- Log start
  debug_info := format('Starting assignment for date: %s', target_date);
  
  -- Get all active tests
  FOR test_record IN 
    SELECT id, title FROM public.tests 
    WHERE status = 'active' 
    ORDER BY display_order
  LOOP
    total_tests := total_tests + 1;
    debug_info := debug_info || format(' | Processing test: %s', test_record.title);
    
    -- Get eligible employees who haven't been assigned this test today
    SELECT array_agg(ge.employee_id) INTO eligible_employees_array
    FROM get_test_eligible_employees(target_date) ge
    WHERE NOT EXISTS (
      SELECT 1 FROM public.test_assignments ta
      WHERE ta.test_id = test_record.id
      AND ta.employee_id = ge.employee_id
      AND ta.assigned_date = target_date
    );
    
    debug_info := debug_info || format(' | Eligible employees: %s', 
      COALESCE(array_length(eligible_employees_array, 1), 0));
    
    -- Select up to 2 random employees if we have enough
    IF array_length(eligible_employees_array, 1) >= 2 THEN
      -- Randomly select 2 employees
      SELECT array_agg(emp_id) INTO selected_employees
      FROM (
        SELECT unnest(eligible_employees_array) as emp_id
        ORDER BY random()
        LIMIT 2
      ) random_employees;
      
      debug_info := debug_info || format(' | Selected: %s employees', 
        COALESCE(array_length(selected_employees, 1), 0));
      
      -- Create assignments
      INSERT INTO public.test_assignments (test_id, employee_id, assigned_date, due_date)
      SELECT 
        test_record.id, 
        unnest(selected_employees), 
        target_date,
        target_date + interval '1 day'
      ON CONFLICT (test_id, employee_id, assigned_date) DO NOTHING;
      
      -- Count successful assignments
      assignment_count := assignment_count + array_length(selected_employees, 1);
      
      -- Log assignment history
      INSERT INTO public.test_assignment_history (
        assignment_date, test_id, assigned_employees, total_eligible_employees, assignment_method
      ) VALUES (
        target_date, 
        test_record.id, 
        selected_employees, 
        array_length(eligible_employees_array, 1),
        'automatic'
      );
      
    ELSE
      debug_info := debug_info || format(' | Skipped - not enough eligible employees');
    END IF;
  END LOOP;
  
  -- Build result
  SELECT json_build_object(
    'success', true,
    'assignment_date', target_date,
    'total_tests', total_tests,
    'total_assignments', assignment_count,
    'message', format('Successfully assigned %s tests to employees', assignment_count),
    'debug_info', debug_info
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  SELECT json_build_object(
    'success', false,
    'assignment_date', target_date,
    'total_tests', total_tests,
    'total_assignments', assignment_count,
    'message', 'Assignment failed with error',
    'error', SQLERRM,
    'debug_info', debug_info
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_test_eligible_employees(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_eligible_employees(date) TO service_role;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION get_test_eligible_employees(date) IS 'Returns employees eligible for test assignments on a given date (active, test_eligible, not on leave)';
COMMENT ON FUNCTION assign_daily_tests(date) IS 'Assigns daily tests to eligible employees with detailed logging and error handling';

-- Create a test function to verify the assignment logic
CREATE OR REPLACE FUNCTION test_assignment_logic(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  eligible_count integer;
  active_tests_count integer;
  existing_assignments_count integer;
  result json;
BEGIN
  -- Count eligible employees
  SELECT COUNT(*) INTO eligible_count
  FROM get_test_eligible_employees(target_date);
  
  -- Count active tests
  SELECT COUNT(*) INTO active_tests_count
  FROM public.tests
  WHERE status = 'active';
  
  -- Count existing assignments for today
  SELECT COUNT(*) INTO existing_assignments_count
  FROM public.test_assignments
  WHERE assigned_date = target_date;
  
  SELECT json_build_object(
    'date', target_date,
    'eligible_employees', eligible_count,
    'active_tests', active_tests_count,
    'existing_assignments', existing_assignments_count,
    'can_assign', (eligible_count >= 2 AND active_tests_count > 0)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_assignment_logic(date) TO authenticated;
GRANT EXECUTE ON FUNCTION test_assignment_logic(date) TO service_role;

COMMENT ON FUNCTION test_assignment_logic(date) IS 'Test function to verify assignment logic and eligibility counts';