/*
  # Create Missing RPC Functions
  
  1. Purpose: Add missing database functions required by the application services
  2. Functions:
    - get_department_stats
    - get_employee_leave_balance
    - get_leave_stats
    - get_pending_leave_requests_count
    - get_unique_departments
    - check_table_rls
  3. Security: Grant execute permissions to authenticated role
*/

-- =============================================
-- FUNCTION: get_department_stats
-- =============================================
CREATE OR REPLACE FUNCTION public.get_department_stats()
RETURNS TABLE(department text, count bigint, active_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.department,
    COUNT(e.id) as count,
    COUNT(CASE WHEN e.is_active = true THEN 1 END) as active_count
  FROM
    public.employees e
  GROUP BY
    e.department
  ORDER BY
    e.department;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_employee_leave_balance
-- =============================================
CREATE OR REPLACE FUNCTION public.get_employee_leave_balance(
  p_employee_id uuid,
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
)
RETURNS TABLE(
  total_days_per_year integer,
  used_days integer,
  pending_days integer,
  remaining_days integer
) AS $$
DECLARE
  max_leave_days integer;
BEGIN
  -- Get max leave days from settings, default to 25
  SELECT value::integer INTO max_leave_days 
  FROM public.system_settings 
  WHERE key = 'max_leave_days_per_year'
  LIMIT 1;
  
  IF NOT FOUND THEN
    max_leave_days := 25;
  END IF;

  RETURN QUERY
  SELECT
    max_leave_days AS total_days_per_year,
    COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN lr.days ELSE 0 END), 0)::integer AS used_days,
    COALESCE(SUM(CASE WHEN lr.status = 'pending' THEN lr.days ELSE 0 END), 0)::integer AS pending_days,
    (max_leave_days - COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN lr.days ELSE 0 END), 0))::integer AS remaining_days
  FROM public.leave_requests lr
  WHERE lr.employee_id = p_employee_id
    AND EXTRACT(YEAR FROM lr.start_date) = p_year;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_leave_stats
-- =============================================
CREATE OR REPLACE FUNCTION public.get_leave_stats(p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS TABLE(approved bigint, pending bigint, rejected bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
  FROM public.leave_requests
  WHERE EXTRACT(YEAR FROM start_date) = p_year;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_pending_leave_requests_count
-- =============================================
CREATE OR REPLACE FUNCTION public.get_pending_leave_requests_count()
RETURNS integer AS $$
DECLARE
  pending_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO pending_count
  FROM public.leave_requests
  WHERE status = 'pending';
  
  RETURN pending_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_unique_departments
-- =============================================
CREATE OR REPLACE FUNCTION public.get_unique_departments()
RETURNS TABLE(department text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT e.department
  FROM public.employees e
  WHERE e.department IS NOT NULL AND e.department <> ''
  ORDER BY e.department;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: check_table_rls
-- =============================================
CREATE OR REPLACE FUNCTION public.check_table_rls(table_name text)
RETURNS boolean AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = table_name
  LIMIT 1;
  
  RETURN rls_enabled;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION public.get_department_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_leave_balance(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leave_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_leave_requests_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unique_departments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_rls(text) TO authenticated;

COMMENT ON FUNCTION public.get_department_stats() IS 'Returns employee counts grouped by department.';
COMMENT ON FUNCTION public.get_employee_leave_balance(uuid, integer) IS 'Calculates leave balance for a specific employee and year.';
COMMENT ON FUNCTION public.get_leave_stats(integer) IS 'Returns system-wide leave request statistics for a given year.';
COMMENT ON FUNCTION public.get_pending_leave_requests_count() IS 'Returns the total count of pending leave requests.';
COMMENT ON FUNCTION public.get_unique_departments() IS 'Returns a distinct list of department names.';
COMMENT ON FUNCTION public.check_table_rls(text) IS 'Checks if Row Level Security is enabled for a given table.';