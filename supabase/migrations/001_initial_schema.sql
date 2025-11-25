/*
  # Complete Database Schema for Employee Timesheet Platform
  
  1. Purpose: Create all tables and relationships for dynamic timesheet system
  2. Schema: Users, Employees, Timesheet Options, Entries, Leave Requests, Settings
  3. Security: RLS enabled with proper policies for admin/employee access
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE timesheet_status AS ENUM ('complete', 'incomplete', 'absent');
CREATE TYPE leave_type AS ENUM ('vacation', 'medical', 'personal', 'maternity', 'paternity', 'unpaid');

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Extend auth.users with profile information
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- EMPLOYEES TABLE
-- =============================================

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  join_date date NOT NULL,
  phone text NOT NULL,
  is_active boolean DEFAULT true,
  leave_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TIMESHEET CONFIGURATION
-- =============================================

CREATE TABLE public.timesheet_options (
  id serial PRIMARY KEY,
  title text NOT NULL,
  key text UNIQUE NOT NULL,
  employee_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default timesheet options
INSERT INTO public.timesheet_options (title, key, employee_text, display_order, active) VALUES
('Prezență', 'present', 'Am fost prezent în această zi', 1, true),
('Update PR', 'update_pr', 'Am actualizat PR-ul astăzi', 2, true),
('Lucru de acasă', 'work_from_home', 'Am lucrat de acasă', 3, true);

-- =============================================
-- TIMESHEET ENTRIES
-- =============================================

CREATE TABLE public.timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  timesheet_data jsonb NOT NULL DEFAULT '{}',
  notes text,
  status timesheet_status NOT NULL DEFAULT 'incomplete',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, entry_date)
);

-- =============================================
-- LEAVE REQUESTS
-- =============================================

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  leave_type leave_type NOT NULL,
  reason text NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  submitted_date date NOT NULL DEFAULT CURRENT_DATE,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days > 0)
);

-- =============================================
-- SYSTEM SETTINGS
-- =============================================

CREATE TABLE public.system_settings (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  setting_type text NOT NULL DEFAULT 'string',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, setting_type, description) VALUES
('pontaj_cutoff_time', '22:00', 'time', 'Ora limită pentru completarea pontajului'),
('allow_weekend_pontaj', 'false', 'boolean', 'Permite pontaj în weekend'),
('require_daily_notes', 'false', 'boolean', 'Note zilnice obligatorii'),
('auto_approve_leave', 'false', 'boolean', 'Aprobare automată concedii'),
('max_leave_days_per_year', '25', 'integer', 'Zile concediu maxime pe an'),
('email_notifications', 'true', 'boolean', 'Notificări email'),
('sms_notifications', 'false', 'boolean', 'Notificări SMS'),
('password_min_length', '8', 'integer', 'Lungime minimă parolă'),
('require_password_change', 'false', 'boolean', 'Schimbare parolă obligatorie'),
('session_timeout', '480', 'integer', 'Timeout sesiune (minute)'),
('two_factor_auth', 'false', 'boolean', 'Autentificare cu doi factori'),
('allow_remote_access', 'true', 'boolean', 'Acces remote');

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheet_options_updated_at BEFORE UPDATE ON public.timesheet_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheet_entries_updated_at BEFORE UPDATE ON public.timesheet_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate timesheet status based on data
CREATE OR REPLACE FUNCTION calculate_timesheet_status(timesheet_data jsonb)
RETURNS timesheet_status AS $$
DECLARE
  checked_count integer;
BEGIN
  -- Count true values in timesheet_data
  SELECT COUNT(*)
  FROM jsonb_each_text(timesheet_data)
  WHERE value = 'true'
  INTO checked_count;
  
  IF checked_count = 0 THEN
    RETURN 'absent';
  ELSIF checked_count >= 2 THEN
    RETURN 'complete';
  ELSE
    RETURN 'incomplete';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate leave request days
CREATE OR REPLACE FUNCTION calculate_leave_days(start_date date, end_date date)
RETURNS integer AS $$
BEGIN
  RETURN (end_date - start_date) + 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate days and status for timesheet entries
CREATE OR REPLACE FUNCTION update_timesheet_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate status based on timesheet_data
  NEW.status = calculate_timesheet_status(NEW.timesheet_data);
  
  -- Set submitted_at if not already set and status is not absent
  IF NEW.submitted_at IS NULL AND NEW.status != 'absent' THEN
    NEW.submitted_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timesheet_entry_update BEFORE INSERT OR UPDATE ON public.timesheet_entries FOR EACH ROW EXECUTE FUNCTION update_timesheet_entry();

-- Trigger to auto-calculate days for leave requests
CREATE OR REPLACE FUNCTION update_leave_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate days
  NEW.days = calculate_leave_days(NEW.start_date, NEW.end_date);
  
  -- Set approved_at when status changes to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_request_update BEFORE INSERT OR UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION update_leave_request();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Employees Policies
CREATE POLICY "Employees can view their own data"
  ON public.employees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all employees"
  ON public.employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage employees"
  ON public.employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Timesheet Options Policies
CREATE POLICY "Everyone can view active timesheet options"
  ON public.timesheet_options FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage timesheet options"
  ON public.timesheet_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Timesheet Entries Policies
CREATE POLICY "Employees can view their own timesheet entries"
  ON public.timesheet_entries FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can manage their own timesheet entries"
  ON public.timesheet_entries FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all timesheet entries"
  ON public.timesheet_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all timesheet entries"
  ON public.timesheet_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Leave Requests Policies
CREATE POLICY "Employees can view their own leave requests"
  ON public.leave_requests FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their pending leave requests"
  ON public.leave_requests FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    ) AND status = 'pending'
  );

CREATE POLICY "Admins can view all leave requests"
  ON public.leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all leave requests"
  ON public.leave_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System Settings Policies
CREATE POLICY "Authenticated users can view system settings"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- View for employee timesheet summary
CREATE VIEW employee_timesheet_summary AS
SELECT 
  e.id,
  e.name,
  e.department,
  COUNT(te.id) as total_entries,
  COUNT(CASE WHEN te.status = 'complete' THEN 1 END) as complete_entries,
  COUNT(CASE WHEN te.status = 'incomplete' THEN 1 END) as incomplete_entries,
  COUNT(CASE WHEN te.status = 'absent' THEN 1 END) as absent_entries,
  ROUND(
    COUNT(CASE WHEN te.status = 'complete' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(te.id), 0), 2
  ) as completion_rate
FROM public.employees e
LEFT JOIN public.timesheet_entries te ON e.id = te.employee_id
WHERE e.is_active = true
GROUP BY e.id, e.name, e.department;

-- View for leave requests with employee details
CREATE VIEW leave_requests_with_employee AS
SELECT 
  lr.*,
  e.name as employee_name,
  e.department,
  e.email as employee_email
FROM public.leave_requests lr
JOIN public.employees e ON lr.employee_id = e.id;

-- View for pending leave requests count
CREATE VIEW pending_leave_count AS
SELECT COUNT(*) as pending_count
FROM public.leave_requests
WHERE status = 'pending';

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for common queries
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_is_active ON public.employees(is_active);
CREATE INDEX idx_employees_department ON public.employees(department);

CREATE INDEX idx_timesheet_entries_employee_date ON public.timesheet_entries(employee_id, entry_date);
CREATE INDEX idx_timesheet_entries_date ON public.timesheet_entries(entry_date);
CREATE INDEX idx_timesheet_entries_status ON public.timesheet_entries(status);

CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

CREATE INDEX idx_timesheet_options_active ON public.timesheet_options(active);
CREATE INDEX idx_timesheet_options_order ON public.timesheet_options(display_order);

CREATE INDEX idx_system_settings_key ON public.system_settings(key);