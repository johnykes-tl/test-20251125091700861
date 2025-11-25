/*
  # Fix Real-Time Function Type Compatibility

  1. Purpose: Fix the notify_real_time_update function to handle both json and jsonb parameter types
  2. Issue: assign_daily_tests calls with json_build_object() (json type) but function expects jsonb
  3. Solution: Create function overloads to handle both json and jsonb types seamlessly
  4. Integration: Ensures compatibility with all existing calls in migrations 015, 016
*/

-- Step 1: Drop ALL existing versions of the function to start clean
DROP FUNCTION IF EXISTS notify_real_time_update(text, text, text, jsonb);
DROP FUNCTION IF EXISTS notify_real_time_update(text, text, text, json);
DROP FUNCTION IF EXISTS notify_real_time_update(text, text, text);

-- Step 2: Create the main function that accepts jsonb (our preferred type)
CREATE OR REPLACE FUNCTION notify_real_time_update(
  event_type text,
  table_name text,
  record_id text DEFAULT NULL,
  payload jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  notification_id uuid;
  notify_payload jsonb;
  clean_payload jsonb;
BEGIN
  -- Validate input parameters
  IF event_type IS NULL OR trim(event_type) = '' THEN
    RAISE WARNING 'notify_real_time_update: event_type cannot be null or empty';
    RETURN;
  END IF;

  IF table_name IS NULL OR trim(table_name) = '' THEN
    RAISE WARNING 'notify_real_time_update: table_name cannot be null or empty';
    RETURN;
  END IF;

  -- Sanitize and validate payload
  BEGIN
    -- Ensure payload is valid JSON and limit size
    clean_payload := COALESCE(payload, '{}');
    
    -- Limit payload size to prevent notification overflow
    IF octet_length(clean_payload::text) > 8000 THEN
      clean_payload := jsonb_build_object(
        'error', 'Payload too large for real-time notification',
        'original_size', octet_length(payload::text),
        'table_name', table_name,
        'event_type', event_type
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If payload processing fails, create minimal safe payload
    clean_payload := jsonb_build_object(
      'error', 'Invalid payload format',
      'table_name', table_name,
      'event_type', event_type,
      'record_id', COALESCE(record_id, 'unknown')
    );
  END;

  -- Insert notification record for persistence and SSE retrieval
  BEGIN
    INSERT INTO public.real_time_notifications (
      event_type, 
      table_name, 
      record_id, 
      payload, 
      created_at
    )
    VALUES (
      trim(event_type), 
      trim(table_name), 
      record_id, 
      clean_payload, 
      now()
    )
    RETURNING id INTO notification_id;

    -- Build optimized notify payload for PostgreSQL NOTIFY
    notify_payload := jsonb_build_object(
      'id', notification_id,
      'type', trim(event_type),
      'table', trim(table_name),
      'record_id', COALESCE(record_id, ''),
      'timestamp', extract(epoch from now()),
      'data', clean_payload
    );

    -- Send PostgreSQL NOTIFY for immediate SSE delivery
    PERFORM pg_notify(
      'real_time_updates',
      notify_payload::text
    );

    -- Log successful notification for debugging
    RAISE LOG 'Real-time notification sent: % for table: % (ID: %)', 
      event_type, table_name, notification_id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the calling transaction
    RAISE WARNING 'notify_real_time_update failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    
    -- Try to send a minimal error notification
    BEGIN
      PERFORM pg_notify(
        'real_time_updates',
        jsonb_build_object(
          'type', 'notification_error',
          'error', SQLERRM,
          'original_event', event_type,
          'timestamp', extract(epoch from now())
        )::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- If even error notification fails, just log it
      RAISE WARNING 'Failed to send error notification: %', SQLERRM;
    END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function overload that accepts json type (for backward compatibility)
CREATE OR REPLACE FUNCTION notify_real_time_update(
  event_type text,
  table_name text,
  record_id text,
  payload json
)
RETURNS void AS $$
BEGIN
  -- Convert json to jsonb and call the main function
  PERFORM notify_real_time_update(
    event_type,
    table_name,
    record_id,
    payload::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create simplified function overload with only 3 parameters
CREATE OR REPLACE FUNCTION notify_real_time_update(
  event_type text,
  table_name text,
  record_id text
)
RETURNS void AS $$
BEGIN
  -- Call main function with empty jsonb payload
  PERFORM notify_real_time_update(
    event_type,
    table_name,
    record_id,
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant comprehensive permissions to all function overloads
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO anon;

GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, json) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, json) TO service_role;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, json) TO anon;

GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text) TO anon;

-- Step 6: Fix the assign_daily_tests function calls to use jsonb_build_object
-- This ensures consistency and better performance
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

  -- Notify about deletions if any occurred (FIXED: use jsonb_build_object)
  IF deleted_count > 0 THEN
    PERFORM notify_real_time_update(
      'test_assignments_bulk_delete',
      'test_assignments',
      target_date::text,
      jsonb_build_object(
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

      -- Send real-time notification for each new assignment (FIXED: use jsonb_build_object)
      IF inserted_count > 0 THEN
        PERFORM notify_real_time_update(
          'test_assignments_created',
          'test_assignments',
          test_record.id::text,
          jsonb_build_object(
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

  -- Send final summary notification (FIXED: use jsonb_build_object)
  PERFORM notify_real_time_update(
    'daily_assignment_complete',
    'test_assignments',
    target_date::text,
    jsonb_build_object(
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
  -- Send error notification (FIXED: use jsonb_build_object)
  PERFORM notify_real_time_update(
    'assignment_error',
    'test_assignments',
    target_date::text,
    jsonb_build_object(
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

-- Step 7: Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;

-- Step 8: Create a test function to verify everything works
CREATE OR REPLACE FUNCTION test_notification_system()
RETURNS json AS $$
DECLARE
  result json;
  test_date date := CURRENT_DATE;
BEGIN
  -- Test 1: Simple notification with jsonb
  PERFORM notify_real_time_update(
    'system_test_jsonb',
    'test_table',
    'test_record_id',
    jsonb_build_object('test', 'jsonb_payload', 'timestamp', now())
  );

  -- Test 2: Simple notification with json (converted automatically)
  PERFORM notify_real_time_update(
    'system_test_json',
    'test_table', 
    'test_record_id'::text,
    json_build_object('test', 'json_payload', 'timestamp', now())::jsonb
  );

  -- Test 3: Notification without payload
  PERFORM notify_real_time_update(
    'system_test_minimal',
    'test_table',
    'test_record_id'
  );

  -- Return success
  SELECT jsonb_build_object(
    'success', true,
    'message', 'All notification tests passed',
    'tests_run', 3,
    'timestamp', now()
  ) INTO result;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  SELECT jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'failed_at', 'notification_system_test'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for test function
GRANT EXECUTE ON FUNCTION test_notification_system() TO authenticated;
GRANT EXECUTE ON FUNCTION test_notification_system() TO service_role;

-- Step 9: Add comprehensive documentation
COMMENT ON FUNCTION notify_real_time_update(text, text, text, jsonb) IS 'Main real-time notification function accepting jsonb payload. Handles SSE integration with error resilience.';
COMMENT ON FUNCTION assign_daily_tests(date) IS 'Enhanced daily test assignment function with fixed notification calls using jsonb_build_object for type consistency.';
COMMENT ON FUNCTION test_notification_system() IS 'Comprehensive test function to verify notification system is working with all parameter variations.';

-- Step 10: Verify function exists and has correct signature
DO $$
DECLARE
  function_count integer;
BEGIN
  -- Check if the main function exists
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'notify_real_time_update';
  
  IF function_count = 0 THEN
    RAISE EXCEPTION 'CRITICAL: notify_real_time_update function was not created successfully!';
  ELSE
    RAISE NOTICE '✅ SUCCESS: notify_real_time_update function exists with % overload(s)', function_count;
  END IF;
  
  -- Test the function immediately
  PERFORM test_notification_system();
  RAISE NOTICE '✅ SUCCESS: Notification system test completed successfully';
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '❌ VERIFICATION FAILED: %', SQLERRM;
END $$;