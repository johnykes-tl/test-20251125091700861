/*
  # Add Manual Test Assignment Configuration

  1. Purpose: Enhance the tests table to allow for manual assignment overrides.
  2. Schema Changes:
    - Add `assignment_type` enum ('automatic', 'manual_employees', 'manual_departments').
    - Add `assignment_type` column to `tests` table.
    - Add `assigned_employees` (uuid[]) and `assigned_departments` (text[]) columns to `tests` table.
  3. Logic Update:
    - Rework `assign_daily_tests` function to handle the new assignment types.
*/

-- Step 1: Create the new enum type for assignment strategy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_strategy') THEN
        CREATE TYPE assignment_strategy AS ENUM ('automatic', 'manual_employees', 'manual_departments');
    END IF;
END$$;


-- Step 2: Add new columns to the tests table
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS assignment_type assignment_strategy NOT NULL DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS assigned_employees uuid[],
ADD COLUMN IF NOT EXISTS assigned_departments text[];

-- Add comments for clarity
COMMENT ON COLUMN public.tests.assignment_type IS 'Determines how tests are assigned: automatically to all eligible, or manually to specific employees/departments.';
COMMENT ON COLUMN public.tests.assigned_employees IS 'Array of employee UUIDs for manual assignment.';
COMMENT ON COLUMN public.tests.assigned_departments IS 'Array of department names for manual assignment.';

-- Step 3: Rework the assign_daily_tests function to incorporate the new logic
DROP FUNCTION IF EXISTS assign_daily_tests(date);

CREATE OR REPLACE FUNCTION assign_daily_tests(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  test_record RECORD;
  eligible_employees_for_test uuid[];
  selected_employees uuid[];
  employee_count integer;
  assignments_created integer := 0;
  total_tests_processed integer := 0;
  result json;
  debug_info text := '';
  inserted_count integer;
BEGIN
  -- Log start
  debug_info := format('Starting assignment for date: %s', target_date);

  -- Iterate through each active test that doesn't have an assignment for today
  FOR test_record IN
    SELECT 
      t.id, 
      t.title,
      t.assignment_type,
      t.assigned_employees,
      t.assigned_departments
    FROM public.tests t
    WHERE t.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM public.test_assignments ta
        WHERE ta.test_id = t.id AND ta.assigned_date = target_date
    )
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
    'total_tests_processed', total_tests_processed,
    'total_assignments_created', assignments_created,
    'message', format('Successfully created %s test assignments for %s tests.', assignments_created, total_tests_processed),
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

COMMENT ON FUNCTION assign_daily_tests(date) IS 'Assigns daily tests based on the assignment strategy defined for each test (automatic, manual_employees, manual_departments).';