/*
  # Fix Test Assignment Logic for Fair Distribution

  1. Purpose: Rework the test assignment function to ensure tests are distributed fairly among all eligible employees, instead of potentially assigning all tests to the same few employees.
  2. Change:
    - The `assign_daily_tests` function now shuffles the list of eligible employees once at the beginning.
    - It then iterates through active tests and assigns each one to the next employee in the shuffled list, cycling through if necessary.
    - This prevents the same employee from being selected repeatedly by `random()` in a loop.
  3. Impact: Daily tests will be distributed much more evenly across all eligible employees.
*/

-- Drop the old functions to be replaced
DROP FUNCTION IF EXISTS assign_daily_tests(date);
DROP FUNCTION IF EXISTS test_assignment_logic(date);

-- Recreate the assign_daily_tests function with improved distribution logic
CREATE OR REPLACE FUNCTION assign_daily_tests(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  active_tests RECORD;
  eligible_employees_shuffled uuid[];
  employee_count integer;
  test_count integer := 0;
  assignment_count integer := 0;
  current_employee_index integer := 1;
  result json;
  debug_info text := '';
BEGIN
  -- Log start
  debug_info := format('Starting assignment for date: %s', target_date);

  -- 1. Get all eligible employees for the day and shuffle them
  SELECT array_agg(employee_id) INTO eligible_employees_shuffled
  FROM (
    SELECT ge.employee_id
    FROM get_test_eligible_employees(target_date) ge
    ORDER BY random()
  ) as shuffled_employees;

  employee_count := COALESCE(array_length(eligible_employees_shuffled, 1), 0);
  debug_info := debug_info || format(' | Found %s shuffled eligible employees.', employee_count);

  -- If no eligible employees, exit early
  IF employee_count = 0 THEN
    SELECT json_build_object(
      'success', true,
      'message', 'No eligible employees found for test assignment.',
      'assignment_date', target_date,
      'total_assignments', 0
    ) INTO result;
    RETURN result;
  END IF;

  -- 2. Get all active tests that don't already have an assignment for today
  FOR active_tests IN
    SELECT t.id, t.title
    FROM public.tests t
    WHERE t.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM public.test_assignments ta
        WHERE ta.test_id = t.id AND ta.assigned_date = target_date
    )
    ORDER BY t.display_order
  LOOP
    test_count := test_count + 1;

    -- 3. Assign the test to the next employee in the shuffled list
    INSERT INTO public.test_assignments (test_id, employee_id, assigned_date, due_date)
    VALUES (
        active_tests.id,
        eligible_employees_shuffled[current_employee_index],
        target_date,
        target_date + interval '1 day'
    )
    ON CONFLICT (test_id, employee_id, assigned_date) DO NOTHING;

    -- Log this specific assignment
    debug_info := debug_info || format(' | Assigned test "%s" to employee %s.', active_tests.title, eligible_employees_shuffled[current_employee_index]);

    assignment_count := assignment_count + 1;

    -- 4. Move to the next employee, looping back if necessary
    current_employee_index := current_employee_index + 1;
    IF current_employee_index > employee_count THEN
        current_employee_index := 1;
    END IF;
  END LOOP;

  -- Build result
  SELECT json_build_object(
    'success', true,
    'assignment_date', target_date,
    'total_tests_processed', test_count,
    'total_assignments_created', assignment_count,
    'message', format('Successfully created %s test assignments for %s tests.', assignment_count, test_count),
    'debug_info', debug_info
  ) INTO result;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error information
  SELECT json_build_object(
    'success', false,
    'message', 'Assignment failed with an error.',
    'error', SQLERRM,
    'debug_info', debug_info
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Recreate the test function with improved logic
CREATE OR REPLACE FUNCTION test_assignment_logic(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  eligible_count integer;
  unassigned_tests_count integer;
  result json;
BEGIN
  -- Count eligible employees
  SELECT COUNT(*) INTO eligible_count
  FROM get_test_eligible_employees(target_date);

  -- Count active tests that are not yet assigned for the target date
  SELECT COUNT(*) INTO unassigned_tests_count
  FROM public.tests t
  WHERE t.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.test_assignments ta
    WHERE ta.test_id = t.id AND ta.assigned_date = target_date
  );

  SELECT json_build_object(
    'date', target_date,
    'eligible_employees', eligible_count,
    'unassigned_active_tests', unassigned_tests_count,
    'can_assign', (eligible_count >= 1 AND unassigned_tests_count > 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant necessary permissions for the new functions
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;
GRANT EXECUTE ON FUNCTION test_assignment_logic(date) TO authenticated;
GRANT EXECUTE ON FUNCTION test_assignment_logic(date) TO service_role;

COMMENT ON FUNCTION assign_daily_tests(date) IS 'Assigns daily tests to eligible employees with fair distribution logic. Shuffles employees once and cycles through them for each test.';
COMMENT ON FUNCTION test_assignment_logic(date) IS 'Test function to verify assignment logic and eligibility counts based on unassigned tests.';