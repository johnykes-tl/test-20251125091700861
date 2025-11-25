/*
  # Overwrite Daily Test Assignments

  1. Purpose: Modify the `assign_daily_tests` function to first delete existing assignments for the target date before re-creating them.
  2. Change:
    - Added a `DELETE` statement at the beginning of the function to clear out old assignments for the day.
    - Removed the `NOT EXISTS` clause from the test selection loop to ensure all active tests are re-processed.
    - Updated the result JSON to include the count of deleted assignments.
  3. Impact: Running the "Rulează Acum" (Run Now) trigger will now act as a full refresh, ensuring the latest test configurations are applied daily.
*/

-- Drop the old function to be replaced
DROP FUNCTION IF EXISTS assign_daily_tests(date);

-- Recreate the function with the new overwrite logic
CREATE OR REPLACE FUNCTION assign_daily_tests(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  test_record RECORD;
  eligible_employees_for_test uuid[];
  selected_employees uuid[];
  employee_count integer;
  assignments_created integer := 0;
  total_tests_processed integer := 0;
  deleted_count integer := 0;
  result json;
  debug_info text := '';
  inserted_count integer;
BEGIN
  -- Log start
  debug_info := format('Starting assignment for date: %s', target_date);

  -- Step 1: Delete existing assignments for the target date
  WITH deleted AS (
    DELETE FROM public.test_assignments
    WHERE assigned_date = target_date
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  debug_info := debug_info || format(' | Deleted %s existing assignments.', deleted_count);

  -- Step 2: Iterate through ALL active tests
  FOR test_record IN
    SELECT 
      t.id, 
      t.title,
      t.assignment_type,
      t.assigned_employees,
      t.assigned_departments
    FROM public.tests t
    WHERE t.status = 'active'
    ORDER BY t.display_order
  LOOP
    total_tests_processed := total_tests_processed + 1;
    debug_info := debug_info || format(' | Processing test "%s" (type: %s)', test_record.title, test_record.assignment_type);

    -- Determine the pool of eligible employees based on assignment type
    IF test_record.assignment_type = 'manual_employees' AND test_record.assigned_employees IS NOT NULL THEN
      -- Manual assignment to specific employees
      SELECT array_agg(ge.employee_id) INTO eligible_employees_for_test
      FROM get_test_eligible_employees(target_date) ge
      WHERE ge.employee_id = ANY(test_record.assigned_employees);
      debug_info := debug_info || format(' | Manual employees mode. Found %s eligible from list.', COALESCE(array_length(eligible_employees_for_test, 1), 0));

    ELSIF test_record.assignment_type = 'manual_departments' AND test_record.assigned_departments IS NOT NULL THEN
      -- Manual assignment to specific departments
      SELECT array_agg(ge.employee_id) INTO eligible_employees_for_test
      FROM get_test_eligible_employees(target_date) ge
      WHERE ge.department = ANY(test_record.assigned_departments);
      debug_info := debug_info || format(' | Manual departments mode. Found %s eligible from depts.', COALESCE(array_length(eligible_employees_for_test, 1), 0));

    ELSE -- 'automatic' or manual with no one selected
      -- Automatic assignment to all eligible employees
      SELECT array_agg(ge.employee_id) INTO eligible_employees_for_test
      FROM get_test_eligible_employees(target_date) ge;
      debug_info := debug_info || format(' | Automatic mode. Found %s total eligible.', COALESCE(array_length(eligible_employees_for_test, 1), 0));
    END IF;

    employee_count := COALESCE(array_length(eligible_employees_for_test, 1), 0);

    -- If there are eligible employees for this test, proceed with assignment
    IF employee_count > 0 THEN
      -- Randomly select up to 2 employees from the determined pool
      SELECT array_agg(emp_id) INTO selected_employees
      FROM (
        SELECT unnest(eligible_employees_for_test) as emp_id
        ORDER BY random()
        LIMIT 2
      ) random_employees;

      -- Create assignments for the selected employees
      INSERT INTO public.test_assignments (test_id, employee_id, assigned_date, due_date)
      SELECT test_record.id, unnest(selected_employees), target_date, target_date + interval '1 day'
      ON CONFLICT (test_id, employee_id, assigned_date) DO NOTHING;

      -- Get the actual number of rows inserted and update the counter
      GET DIAGNOSTICS inserted_count = ROW_COUNT;
      assignments_created := assignments_created + inserted_count;
      debug_info := debug_info || format(' | Assigned to %s employees.', inserted_count);
    ELSE
      debug_info := debug_info || ' | No eligible employees found for this test. Skipping.';
    END IF;

  END LOOP;

  -- Build final result
  SELECT json_build_object(
    'success', true,
    'assignment_date', target_date,
    'deleted_assignments', deleted_count,
    'total_tests_processed', total_tests_processed,
    'total_assignments_created', assignments_created,
    'message', format('Successfully deleted %s and created %s new test assignments for %s tests.', deleted_count, assignments_created, total_tests_processed),
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

-- Grant permissions again for the new function
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;

COMMENT ON FUNCTION assign_daily_tests(date) IS 'Deletes existing assignments for the target date and re-assigns all active tests based on their defined strategy (automatic, manual_employees, manual_departments).';