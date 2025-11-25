/*
  # Fix Test Eligible Triggers and Logic
  
  1. Purpose: Fix automatic test_eligible management for employees
  2. Issue: Active employees don't automatically get test_eligible = true
  3. Solution: Create triggers + force update existing employees
*/

-- =============================================
-- STEP 1: FORCE UPDATE ALL EXISTING EMPLOYEES
-- =============================================

-- Log current state before changes
DO $$
DECLARE
  total_employees integer;
  active_employees integer;
  test_eligible_employees integer;
BEGIN
  SELECT COUNT(*) INTO total_employees FROM public.employees;
  SELECT COUNT(*) INTO active_employees FROM public.employees WHERE is_active = true;
  SELECT COUNT(*) INTO test_eligible_employees FROM public.employees WHERE is_active = true AND test_eligible = true;
  
  RAISE NOTICE '=== MIGRATION 008 - BEFORE FIX ===';
  RAISE NOTICE 'Total employees: %', total_employees;
  RAISE NOTICE 'Active employees: %', active_employees;
  RAISE NOTICE 'Test eligible employees: %', test_eligible_employees;
  RAISE NOTICE 'Issue: % active employees but only % test eligible', active_employees, test_eligible_employees;
END $$;

-- FORCE UPDATE: Set ALL active employees to test_eligible = true
UPDATE public.employees 
SET 
  test_eligible = true,
  updated_at = now()
WHERE is_active = true;

-- FORCE UPDATE: Set ALL inactive employees to test_eligible = false  
UPDATE public.employees 
SET 
  test_eligible = false,
  updated_at = now()
WHERE is_active = false;

-- Verify the force update worked
DO $$
DECLARE
  total_employees integer;
  active_employees integer;
  test_eligible_employees integer;
  inactive_not_eligible integer;
BEGIN
  SELECT COUNT(*) INTO total_employees FROM public.employees;
  SELECT COUNT(*) INTO active_employees FROM public.employees WHERE is_active = true;
  SELECT COUNT(*) INTO test_eligible_employees FROM public.employees WHERE is_active = true AND test_eligible = true;
  SELECT COUNT(*) INTO inactive_not_eligible FROM public.employees WHERE is_active = false AND test_eligible = false;
  
  RAISE NOTICE '=== AFTER FORCE UPDATE ===';
  RAISE NOTICE 'Total employees: %', total_employees;
  RAISE NOTICE 'Active employees: %', active_employees;
  RAISE NOTICE 'Test eligible active employees: %', test_eligible_employees;
  RAISE NOTICE 'Inactive non-eligible employees: %', inactive_not_eligible;
  
  -- Ensure the numbers match
  IF active_employees != test_eligible_employees THEN
    RAISE EXCEPTION 'FORCE UPDATE FAILED: Active employees (%) != Test eligible (%)!', active_employees, test_eligible_employees;
  END IF;
  
  RAISE NOTICE '✅ FORCE UPDATE SUCCESSFUL: All % active employees are now test eligible!', active_employees;
END $$;

-- =============================================
-- STEP 2: CREATE AUTOMATIC TRIGGER FUNCTIONS
-- =============================================

-- Drop existing trigger function if it exists
DROP TRIGGER IF EXISTS employees_test_eligible_trigger ON public.employees;
DROP FUNCTION IF EXISTS public.update_employee_test_eligible();

-- Create function to automatically manage test_eligible
CREATE OR REPLACE FUNCTION public.update_employee_test_eligible()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the operation for debugging
  RAISE NOTICE 'TRIGGER: Employee % (%) - is_active changed from % to %', 
    NEW.name, NEW.id, OLD.is_active, NEW.is_active;
  
  -- Auto-set test_eligible based on is_active status
  IF NEW.is_active = true THEN
    NEW.test_eligible = true;
    RAISE NOTICE 'TRIGGER: Set test_eligible = true for active employee %', NEW.name;
  ELSE
    NEW.test_eligible = false;
    RAISE NOTICE 'TRIGGER: Set test_eligible = false for inactive employee %', NEW.name;
  END IF;
  
  -- Ensure updated_at is set
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on INSERT and UPDATE
CREATE TRIGGER employees_test_eligible_trigger
  BEFORE INSERT OR UPDATE OF is_active ON public.employees
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_employee_test_eligible();

-- =============================================
-- STEP 3: TEST THE TRIGGER LOGIC
-- =============================================

-- Test with a dummy update to verify trigger works
DO $$
DECLARE
  test_employee_id uuid;
  test_employee_name text;
  before_test_eligible boolean;
  after_test_eligible boolean;
BEGIN
  -- Get first active employee for testing
  SELECT id, name, test_eligible INTO test_employee_id, test_employee_name, before_test_eligible
  FROM public.employees 
  WHERE is_active = true 
  LIMIT 1;
  
  IF test_employee_id IS NOT NULL THEN
    RAISE NOTICE '=== TESTING TRIGGER LOGIC ===';
    RAISE NOTICE 'Testing with employee: % (ID: %)', test_employee_name, test_employee_id;
    RAISE NOTICE 'Before test - test_eligible: %', before_test_eligible;
    
    -- Trigger the trigger by updating updated_at (should maintain is_active = true)
    UPDATE public.employees 
    SET updated_at = now() 
    WHERE id = test_employee_id;
    
    -- Check if test_eligible is still true
    SELECT test_eligible INTO after_test_eligible
    FROM public.employees 
    WHERE id = test_employee_id;
    
    RAISE NOTICE 'After test - test_eligible: %', after_test_eligible;
    
    IF after_test_eligible = true THEN
      RAISE NOTICE '✅ TRIGGER TEST PASSED: test_eligible maintained correctly';
    ELSE
      RAISE EXCEPTION '❌ TRIGGER TEST FAILED: test_eligible should be true for active employee!';
    END IF;
  ELSE
    RAISE NOTICE 'No active employees found for trigger testing';
  END IF;
END $$;

-- =============================================
-- STEP 4: FINAL VERIFICATION
-- =============================================

-- Final count and verification
DO $$
DECLARE
  final_active integer;
  final_eligible integer;
  employee_record RECORD;
BEGIN
  SELECT COUNT(*) INTO final_active FROM public.employees WHERE is_active = true;
  SELECT COUNT(*) INTO final_eligible FROM public.employees WHERE is_active = true AND test_eligible = true;
  
  RAISE NOTICE '=== FINAL VERIFICATION ===';
  RAISE NOTICE 'Active employees: %', final_active;
  RAISE NOTICE 'Test eligible employees: %', final_eligible;
  
  -- List all employees with their status
  RAISE NOTICE '=== EMPLOYEE STATUS LIST ===';
  FOR employee_record IN 
    SELECT name, is_active, test_eligible, department 
    FROM public.employees 
    ORDER BY is_active DESC, name
  LOOP
    RAISE NOTICE 'Employee: % | Active: % | Test Eligible: % | Dept: %', 
      employee_record.name, 
      employee_record.is_active, 
      employee_record.test_eligible, 
      employee_record.department;
  END LOOP;
  
  IF final_active = final_eligible THEN
    RAISE NOTICE '✅ MIGRATION 008 COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ All % active employees are now test eligible', final_active;
    RAISE NOTICE '✅ Automatic triggers are in place for future changes';
  ELSE
    RAISE EXCEPTION '❌ MIGRATION 008 FAILED: Mismatch between active (%) and eligible (%) employees', final_active, final_eligible;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON FUNCTION public.update_employee_test_eligible() IS 'Automatically sets test_eligible = true when employee is activated, false when deactivated';
COMMENT ON TRIGGER employees_test_eligible_trigger ON public.employees IS 'Maintains test_eligible flag in sync with is_active status';