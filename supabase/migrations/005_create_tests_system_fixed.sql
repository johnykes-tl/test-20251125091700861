/*
  # Create Tests Assignment System - PostgreSQL Compatible
  
  1. Purpose: Create system for managing daily tests and automatic assignment
  2. Schema: Tests, Test Assignments, Employee test eligibility
  3. Security: RLS enabled with proper admin/employee policies
  4. Fix: Use PostgreSQL compatible syntax (no LIMIT in UPDATE)
*/

-- Create custom types
CREATE TYPE test_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE assignment_status AS ENUM ('pending', 'completed', 'skipped');

-- =============================================
-- TESTS TABLE
-- =============================================

CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  status test_status NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id),
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample tests
INSERT INTO public.tests (title, description, instructions, display_order) VALUES
('Test trimitere prompt nou', 'Testarea funcționalității de trimitere a unui prompt nou în sistem', 'Accesează interfața de prompt, creează un prompt nou și trimite-l. Verifică dacă se salvează corect.', 1),
('Test import chat', 'Testarea funcționalității de import pentru conversații chat', 'Folosește funcția de import pentru a încărca o conversație chat existentă. Verifică dacă datele se importă corect.', 2),
('Test import zip', 'Testarea funcționalității de import pentru fișiere ZIP', 'Încarcă un fișier ZIP prin interfața de import. Verifică dacă conținutul se extrage și procesează corect.', 3),
('Test export date', 'Testarea funcționalității de export a datelor', 'Exportă date din sistem în diferite formate (CSV, Excel, PDF). Verifică corectitudinea datelor exportate.', 4),
('Test notificări', 'Testarea sistemului de notificări', 'Declanșează diferite tipuri de notificări și verifică dacă ajung corect la destinatari.', 5);

-- =============================================
-- TEST ASSIGNMENTS TABLE
-- =============================================

CREATE TABLE public.test_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + interval '1 day'),
  status assignment_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(test_id, employee_id, assigned_date)
);

-- =============================================
-- ADD TEST ELIGIBILITY TO EMPLOYEES
-- =============================================

-- Add test eligibility flag to employees table
ALTER TABLE public.employees 
ADD COLUMN test_eligible boolean DEFAULT false;

-- Add comment to clarify usage
COMMENT ON COLUMN public.employees.test_eligible IS 'Flag indicating if employee is eligible to receive daily tests';

-- Update some employees to be test eligible (PostgreSQL compatible - using subquery instead of LIMIT)
UPDATE public.employees 
SET test_eligible = true 
WHERE id IN (
  SELECT id FROM public.employees 
  WHERE is_active = true 
  ORDER BY created_at 
  LIMIT 5
);

-- =============================================
-- ASSIGNMENT HISTORY TABLE
-- =============================================

CREATE TABLE public.test_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_date date NOT NULL,
  test_id uuid NOT NULL REFERENCES public.tests(id),
  assigned_employees uuid[] NOT NULL,
  total_eligible_employees integer NOT NULL,
  assignment_method text DEFAULT 'automatic',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_assignments_updated_at BEFORE UPDATE ON public.test_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if employee is on leave
CREATE OR REPLACE FUNCTION is_employee_on_leave(employee_id uuid, check_date date)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.leave_requests
    WHERE employee_id = is_employee_on_leave.employee_id
    AND status = 'approved'
    AND start_date <= check_date
    AND end_date >= check_date
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get eligible employees for tests
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
    e.id,
    e.name,
    e.department,
    e.email
  FROM public.employees e
  WHERE e.is_active = true
    AND e.test_eligible = true
    AND NOT is_employee_on_leave(e.id, target_date);
END;
$$ LANGUAGE plpgsql;

-- Function to assign daily tests
CREATE OR REPLACE FUNCTION assign_daily_tests(target_date date DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
  test_record RECORD;
  eligible_employees uuid[];
  selected_employees uuid[];
  assignment_count integer := 0;
  total_tests integer := 0;
  result json;
BEGIN
  -- Get all active tests
  FOR test_record IN 
    SELECT id, title FROM public.tests 
    WHERE status = 'active' 
    ORDER BY display_order
  LOOP
    total_tests := total_tests + 1;
    
    -- Get eligible employees who haven't been assigned this test today
    SELECT array_agg(ge.employee_id) INTO eligible_employees
    FROM get_test_eligible_employees(target_date) ge
    WHERE NOT EXISTS (
      SELECT 1 FROM public.test_assignments ta
      WHERE ta.test_id = test_record.id
      AND ta.employee_id = ge.employee_id
      AND ta.assigned_date = target_date
    );
    
    -- Select up to 2 random employees
    IF array_length(eligible_employees, 1) >= 2 THEN
      -- Randomly select 2 employees
      SELECT array_agg(emp_id) INTO selected_employees
      FROM (
        SELECT unnest(eligible_employees) as emp_id
        ORDER BY random()
        LIMIT 2
      ) random_employees;
      
      -- Create assignments
      INSERT INTO public.test_assignments (test_id, employee_id, assigned_date)
      SELECT test_record.id, unnest(selected_employees), target_date;
      
      assignment_count := assignment_count + array_length(selected_employees, 1);
      
      -- Log assignment history
      INSERT INTO public.test_assignment_history (
        assignment_date, test_id, assigned_employees, total_eligible_employees
      ) VALUES (
        target_date, test_record.id, selected_employees, array_length(eligible_employees, 1)
      );
      
    END IF;
  END LOOP;
  
  SELECT json_build_object(
    'success', true,
    'assignment_date', target_date,
    'total_tests', total_tests,
    'total_assignments', assignment_count,
    'message', format('Successfully assigned %s tests to employees', assignment_count)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assignment_history ENABLE ROW LEVEL SECURITY;

-- Tests Policies
CREATE POLICY "Admins can manage all tests"
  ON public.tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view active tests"
  ON public.tests FOR SELECT
  USING (status = 'active');

-- Test Assignments Policies
CREATE POLICY "Employees can view their own assignments"
  ON public.test_assignments FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own assignments"
  ON public.test_assignments FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all test assignments"
  ON public.test_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assignment History Policies
CREATE POLICY "Admins can view assignment history"
  ON public.test_assignment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_test_eligible_employees(date) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_tests(date) TO service_role;
GRANT EXECUTE ON FUNCTION is_employee_on_leave(uuid, date) TO authenticated;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for efficient queries
CREATE INDEX idx_tests_status ON public.tests(status);
CREATE INDEX idx_tests_display_order ON public.tests(display_order);
CREATE INDEX idx_test_assignments_date ON public.test_assignments(assigned_date);
CREATE INDEX idx_test_assignments_employee ON public.test_assignments(employee_id);
CREATE INDEX idx_test_assignments_test ON public.test_assignments(test_id);
CREATE INDEX idx_test_assignments_status ON public.test_assignments(status);
CREATE INDEX idx_employees_test_eligible ON public.employees(test_eligible) WHERE test_eligible = true;
CREATE INDEX idx_assignment_history_date ON public.test_assignment_history(assignment_date);

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- View for test assignments with employee details
CREATE VIEW test_assignments_with_details AS
SELECT 
  ta.id,
  ta.test_id,
  ta.employee_id,
  ta.assigned_date,
  ta.due_date,
  ta.status,
  ta.completed_at,
  ta.notes,
  t.title as test_title,
  t.description as test_description,
  t.instructions as test_instructions,
  e.name as employee_name,
  e.department as employee_department,
  e.email as employee_email
FROM public.test_assignments ta
JOIN public.tests t ON ta.test_id = t.id
JOIN public.employees e ON ta.employee_id = e.id;

-- View for today's assignments
CREATE VIEW todays_test_assignments AS
SELECT * FROM test_assignments_with_details
WHERE assigned_date = CURRENT_DATE;