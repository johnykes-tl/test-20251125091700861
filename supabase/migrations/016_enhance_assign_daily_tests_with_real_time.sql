/*
  # Enhance assign_daily_tests with Real-Time Notifications

  1. Purpose: Add notification triggers for real-time updates when tests are assigned
  2. Features:
    - Function remains the same but adds notification system
    - Trigger real-time updates through database changes
    - Support for overwrite functionality as requested
  3. Integration: Works with SSE endpoints for live dashboard updates
*/

-- Create a notification table for real-time updates (if not exists)
CREATE TABLE IF NOT EXISTS public.real_time_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.real_time_notifications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read notifications
CREATE POLICY "Authenticated users can read notifications"
  ON public.real_time_notifications FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow service role to insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.real_time_notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Function to send real-time notification
CREATE OR REPLACE FUNCTION notify_real_time_update(
  event_type text,
  table_name text,
  record_id text DEFAULT NULL,
  payload jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  -- Insert notification record
  INSERT INTO public.real_time_notifications (event_type, table_name, record_id, payload)
  VALUES (event_type, table_name, record_id, payload);
  
  -- PostgreSQL NOTIFY for immediate updates
  PERFORM pg_notify(
    'real_time_updates',
    json_build_object(
      'type', event_type,
      'table', table_name,
      'record_id', record_id,
      'payload', payload,
      'timestamp', now()
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the assign_daily_tests function to send notifications
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

  -- Notify about deletions if any occurred
  IF deleted_count > 0 THEN
    PERFORM notify_real_time_update(
      'test_assignments_bulk_delete',
      'test_assignments',
      target_date::text,
      json_build_object(
        'date', target_date,
        'deleted_count', deleted_count,
        'message', 'Existing assignments cleared for re-assignment'
      )
    );
  END IF;

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

      -- Send real-time notification for each new assignment
      IF inserted_count > 0 THEN
        PERFORM notify_real_time_update(
          'test_assignments_created',
          'test_assignments',
          test_record.id::text,
          json_build_object(
            'test_id', test_record.id,
            'test_title', test_record.title,
            'assigned_employees', selected_employees,
            'assignment_date', target_date,
            'assignment_count', inserted_count
          )
        );
      END IF;
    ELSE
      debug_info := debug_info || ' | No eligible employees found for this test. Skipping.';
    END IF;

  END LOOP;

  -- Send final summary notification
  PERFORM notify_real_time_update(
    'daily_assignment_complete',
    'test_assignments',
    target_date::text,
    json_build_object(
      'assignment_date', target_date,
      'deleted_assignments', deleted_count,
      'total_tests_processed', total_tests_processed,
      'total_assignments_created', assignments_created,
      'summary', format('Deleted %s and created %s new assignments for %s tests', deleted_count, assignments_created, total_tests_processed)
    )
  );

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
  -- Send error notification
  PERFORM notify_real_time_update(
    'assignment_error',
    'test_assignments',
    target_date::text,
    json_build_object(
      'error', SQLERRM,
      'assignment_date', target_date
    )
  );

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

-- Grant permissions for the notification function
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO service_role;

-- Enhanced function remains with same permissions
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_real_time_notifications_created_at ON public.real_time_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_real_time_notifications_event_type ON public.real_time_notifications(event_type);

COMMENT ON FUNCTION assign_daily_tests(date) IS 'Enhanced function that deletes existing assignments and re-assigns all active tests with real-time notifications';
COMMENT ON FUNCTION notify_real_time_update(text, text, text, jsonb) IS 'Sends real-time notifications for UI updates via PostgreSQL NOTIFY';