/*
  # Make Leave Request Reason Optional
  
  1. Purpose: Modify the leave_requests table to make the 'reason' column nullable.
  2. Change: ALTER TABLE public.leave_requests ALTER COLUMN reason DROP NOT NULL;
  3. Impact: The 'reason' field for leave requests is now optional for both employees and admins.
*/

ALTER TABLE public.leave_requests
ALTER COLUMN reason DROP NOT NULL;

COMMENT ON COLUMN public.leave_requests.reason IS 'Reason for the leave request (now optional)';