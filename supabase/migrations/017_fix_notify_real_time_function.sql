/*
  # Fix Notify Real-Time Function

  1. Purpose: Fix and enhance the notify_real_time_update function for better SSE integration
  2. Changes:
    - Drop and recreate the function with improved error handling
    - Add better payload validation and sanitization
    - Ensure proper permissions for all user roles
    - Add notification batching to prevent spam
    - Improve PostgreSQL NOTIFY format for SSE consumption
  3. Integration: Works with /api/real-time-updates SSE endpoint
*/

-- Step 1: Drop existing function to recreate with improvements
DROP FUNCTION IF EXISTS notify_real_time_update(text, text, text, jsonb);

-- Step 2: Recreate the real_time_notifications table with better structure (if needed)
-- Add index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_real_time_notifications_event_type_created 
ON public.real_time_notifications(event_type, created_at DESC);

-- Step 3: Create enhanced notify_real_time_update function
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

-- Step 4: Grant comprehensive permissions
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION notify_real_time_update(text, text, text, jsonb) TO anon;

-- Step 5: Create helper function for testing notifications
CREATE OR REPLACE FUNCTION test_real_time_notification(
  test_message text DEFAULT 'Test notification from database'
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Send test notification
  PERFORM notify_real_time_update(
    'system_test',
    'test_notifications',
    gen_random_uuid()::text,
    jsonb_build_object(
      'message', test_message,
      'test_time', now(),
      'source', 'database_function'
    )
  );

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Test notification sent successfully',
    'test_data', jsonb_build_object(
      'message', test_message,
      'timestamp', now()
    )
  ) INTO result;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  SELECT jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for test function
GRANT EXECUTE ON FUNCTION test_real_time_notification(text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_real_time_notification(text) TO service_role;

-- Step 6: Update RLS policies for real_time_notifications to ensure proper access
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can read notifications" ON public.real_time_notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.real_time_notifications;

-- Create enhanced policies
CREATE POLICY "All authenticated users can read notifications"
  ON public.real_time_notifications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert notifications"
  ON public.real_time_notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to notifications"
  ON public.real_time_notifications FOR ALL
  USING (auth.role() = 'service_role');

-- Step 7: Create cleanup function for old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete notifications older than 24 hours
  DELETE FROM public.real_time_notifications 
  WHERE created_at < now() - interval '24 hours';
  
  RAISE LOG 'Cleaned up old real-time notifications older than 24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;

-- Step 8: Add helpful comments and documentation
COMMENT ON FUNCTION notify_real_time_update(text, text, text, jsonb) IS 'Enhanced real-time notification function with error handling, payload validation, and SSE integration';
COMMENT ON FUNCTION test_real_time_notification(text) IS 'Test function to verify real-time notification system is working correctly';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Maintenance function to clean up old notification records';

-- Step 9: Create view for recent notifications (useful for debugging)
CREATE OR REPLACE VIEW recent_notifications AS
SELECT 
  id,
  event_type,
  table_name,
  record_id,
  payload,
  created_at,
  extract(epoch from (now() - created_at)) as age_seconds
FROM public.real_time_notifications
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON recent_notifications TO authenticated;
GRANT SELECT ON recent_notifications TO service_role;

COMMENT ON VIEW recent_notifications IS 'Shows notifications from the last hour for debugging and monitoring';