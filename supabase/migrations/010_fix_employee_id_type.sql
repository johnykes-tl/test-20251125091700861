/*
  # Fix Employee ID Type Mismatch
  
  1. Purpose: Correct the data type of `employees.id` and all related foreign keys from `bigint` to `uuid`.
  2. Strategy:
    - Add new `uuid` columns to all affected tables.
    - Populate the new `uuid` columns.
    - Update foreign key relationships to use the new `uuid` columns.
    - Drop the old `bigint` columns.
    - Rename the new `uuid` columns to their original names.
  3. Safety: This migration is designed to be run on a database with existing data. It preserves all relationships.
*/

-- Step 1: Disable all triggers on the tables to prevent unintended side effects during the migration.
ALTER TABLE public.employees DISABLE TRIGGER ALL;
ALTER TABLE public.timesheet_entries DISABLE TRIGGER ALL;
ALTER TABLE public.leave_requests DISABLE TRIGGER ALL;
ALTER TABLE public.test_assignments DISABLE TRIGGER ALL;

-- Step 2: Add new UUID columns to the employees table and all referencing tables.
-- We add them as nullable for now to allow population.
ALTER TABLE public.employees ADD COLUMN employee_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE public.timesheet_entries ADD COLUMN employee_uuid uuid;
ALTER TABLE public.leave_requests ADD COLUMN employee_uuid uuid;
ALTER TABLE public.test_assignments ADD COLUMN employee_uuid uuid;

-- Step 3: Populate the new UUID columns.
-- First, ensure the new UUID in the employees table is not null.
UPDATE public.employees SET employee_uuid = gen_random_uuid() WHERE employee_uuid IS NULL;
ALTER TABLE public.employees ALTER COLUMN employee_uuid SET NOT NULL;

-- Now, update the referencing tables by joining on the old bigint IDs.
-- This assumes 'employees.id' is the old bigint PK and 'timesheet_entries.employee_id' is the old bigint FK.
UPDATE public.timesheet_entries te
SET employee_uuid = e.employee_uuid
FROM public.employees e
WHERE te.employee_id::bigint = e.id::bigint;

UPDATE public.leave_requests lr
SET employee_uuid = e.employee_uuid
FROM public.employees e
WHERE lr.employee_id::bigint = e.id::bigint;

UPDATE public.test_assignments ta
SET employee_uuid = e.employee_uuid
FROM public.employees e
WHERE ta.employee_id::bigint = e.id::bigint;

-- Step 4: Drop the old foreign key constraints that are based on the bigint columns.
ALTER TABLE public.timesheet_entries DROP CONSTRAINT IF EXISTS timesheet_entries_employee_id_fkey;
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;
ALTER TABLE public.test_assignments DROP CONSTRAINT IF EXISTS test_assignments_employee_id_fkey;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;


-- Step 5: Drop the old primary key and create a new one on the UUID column.
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE public.employees ADD PRIMARY KEY (employee_uuid);

-- Step 6: Drop the old bigint columns.
ALTER TABLE public.employees DROP COLUMN id;
ALTER TABLE public.timesheet_entries DROP COLUMN employee_id;
ALTER TABLE public.leave_requests DROP COLUMN employee_id;
ALTER TABLE public.test_assignments DROP COLUMN employee_id;

-- Step 7: Rename the new UUID columns to their original names.
ALTER TABLE public.employees RENAME COLUMN employee_uuid TO id;
ALTER TABLE public.timesheet_entries RENAME COLUMN employee_uuid TO employee_id;
ALTER TABLE public.leave_requests RENAME COLUMN employee_uuid TO employee_id;
ALTER TABLE public.test_assignments RENAME COLUMN employee_uuid TO employee_id;

-- Step 8: Re-create the foreign key constraints using the new UUID columns.
-- Also, make the new FK columns NOT NULL.
ALTER TABLE public.timesheet_entries ALTER COLUMN employee_id SET NOT NULL;
ALTER TABLE public.timesheet_entries ADD CONSTRAINT timesheet_entries_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.leave_requests ALTER COLUMN employee_id SET NOT NULL;
ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.test_assignments ALTER COLUMN employee_id SET NOT NULL;
ALTER TABLE public.test_assignments ADD CONSTRAINT test_assignments_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- Re-add the FK from employees to auth.users
ALTER TABLE public.employees ADD CONSTRAINT employees_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 9: Re-enable triggers.
ALTER TABLE public.employees ENABLE TRIGGER ALL;
ALTER TABLE public.timesheet_entries ENABLE TRIGGER ALL;
ALTER TABLE public.leave_requests ENABLE TRIGGER ALL;
ALTER TABLE public.test_assignments ENABLE TRIGGER ALL;

-- Step 10: Re-create indexes on the new columns
DROP INDEX IF EXISTS idx_employees_user_id;
DROP INDEX IF EXISTS idx_timesheet_entries_employee_date;
DROP INDEX IF EXISTS idx_leave_requests_employee;
DROP INDEX IF EXISTS idx_test_assignments_employee;

CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_timesheet_entries_employee_date ON public.timesheet_entries(employee_id, entry_date);
CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_test_assignments_employee ON public.test_assignments(employee_id);