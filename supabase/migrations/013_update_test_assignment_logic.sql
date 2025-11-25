/*
  # Update Test Assignment Logic v2

  1. Purpose: Refine the test assignment function to allow a single test to be assigned to up to two employees, ensuring fair distribution.
  2. Change:
    - The `assign_daily_tests` function now iterates through tests and assigns each one to the next available employee in a shuffled list.
    - It will attempt to assign a *second* employee to the same test if there are enough eligible employees.
    - This ensures a test can have up to two assignees, and an employee can still receive multiple different tests.
  3. Impact: Test distribution is now more flexible and better utilizes the pool of eligible employees.
*/

-- Drop the old functions to be replaced
DROP FUNCTION IF EXISTS assign_daily_tests(date);
DROP FUNCTION IF EXISTS test_assignment_logic(date);

-- Recreate the assign_daily_tests function with the new, more flexible logic
CREATE OR REPLACE FUNCTION assign_daily_tests(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  active_tests RECORD;
  eligible_employees_shuffled uuid[];
  employee_count integer;
  test_count integer := 0;
  assignments_created integer := 0;
  employee_cursor integer := 1;
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
      'total_assignments_created', 0
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

    -- 3. Assign the first employee
    INSERT INTO public.test_assignments (test_id, employee_id, assigned_date, due_date)
    VALUES (
        active_tests.id,
        eligible_employees_shuffled[employee_cursor],
        target_date,
        target_date + interval '1 day'
    )
    ON CONFLICT (test_id, employee_id, assigned_date) DO NOTHING;
    
    IF FOUND THEN
        assignments_created := assignments_created + 1;
        debug_info := debug_info || format(' | Assigned test "%s" to employee %s (1st).', active_tests.title, eligible_employees_shuffled[employee_cursor]);
    END IF;

    -- Move to the next employee
    employee_cursor := employee_cursor + 1;
    IF employee_cursor > employee_count THEN
        employee_cursor := 1;
    END IF;

    -- 4. Assign the second employee, if there are at least 2 eligible employees
    IF employee_count > 1 THEN
        INSERT INTO public.test_assignments (test_id, employee_id, assigned_date, due_date)
        VALUES (
            active_tests.id,
            eligible_employees_shuffled[employee_cursor],
            target_date,
            target_date + interval '1 day'
        )
        ON CONFLICT (test_id, employee_id, assigned_date) DO NOTHING;

        IF FOUND THEN
            assignments_created := assignments_created + 1;
            debug_info := debug_info || format(' | Assigned test "%s" to employee %s (2nd).', active_tests.title, eligible_employees_shuffled[employee_cursor]);
        END IF;

        -- Move to the next employee again
        employee_cursor := employee_cursor + 1;
        IF employee_cursor > employee_count THEN
            employee_cursor := 1;
        END IF;
    END IF;
    
  END LOOP;

  -- Build result
  SELECT json_build_object(
    'success', true,
    'assignment_date', target_date,
    'total_tests_processed', test_count,
    'total_assignments_created', assignments_created,
    'message', format('Successfully created %s test assignments for %s tests.', assignments_created, test_count),
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

-- Grant necessary permissions for the new function
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;

COMMENT ON FUNCTION assign_daily_tests(date) IS 'Assigns each active test to up to two eligible employees, cycling through a shuffled list to ensure fair distribution.';