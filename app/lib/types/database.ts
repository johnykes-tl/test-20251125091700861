// Database type definitions for the Employee Timesheet Platform
// This file contains all database-related TypeScript interfaces and types

// =============================================
// AUTH & USER TYPES
// =============================================

export interface UserProfile {
  id: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
}

// =============================================
// EMPLOYEE TYPES
// =============================================

export interface Employee {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
  phone: string;
  is_active: boolean;
  test_eligible: boolean;
  leave_date?: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
  phone: string;
  create_user_account?: boolean;
  password?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  join_date?: string;
  phone?: string;
  is_active?: boolean;
  test_eligible?: boolean;
  leave_date?: string;
}

// =============================================
// TIMESHEET TYPES
// =============================================

export interface TimesheetOption {
  id: number;
  title: string;
  key: string;
  employee_text: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimesheetEntry {
  id: string;
  employee_id: string;
  entry_date: string;
  timesheet_data: Record<string, boolean>;
  notes?: string;
  status: 'complete' | 'incomplete' | 'absent';
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TimesheetStats {
  total: number;
  complete: number;
  incomplete: number;
  absent: number;
}

export interface EmployeeTimesheetData {
  employee_id: string;
  employee_name: string;
  department: string;
  timesheet_data: Record<string, boolean>;
  status: 'complete' | 'incomplete' | 'absent';
  submitted_at?: string;
  notes?: string;
}

// =============================================
// LEAVE REQUEST TYPES
// =============================================

export type LeaveType = 'vacation' | 'medical' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days: number;
  leave_type: LeaveType;
  reason: string;
  status: LeaveStatus;
  submitted_date: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee_name: string;
  department: string;
  employee_email: string;
}

export interface CreateLeaveRequestData {
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
}

export interface UpdateLeaveRequestData {
  start_date?: string;
  end_date?: string;
  leave_type?: LeaveType;
  reason?: string;
}

export interface EmployeeLeaveBalance {
  employee_id: string;
  total_days_per_year: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  year: number;
}

// =============================================
// TEST SYSTEM TYPES
// =============================================

export type TestStatus = 'active' | 'inactive' | 'archived';
export type AssignmentStatus = 'pending' | 'completed' | 'skipped';

export interface Test {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  status: TestStatus;
  created_by?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TestAssignment {
  id: string;
  test_id: string;
  employee_id: string;
  assigned_date: string;
  due_date: string;
  status: AssignmentStatus;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TestAssignmentWithDetails extends TestAssignment {
  test_title: string;
  test_description: string;
  test_instructions?: string;
  employee_name: string;
  employee_department: string;
  employee_email: string;
}

export interface TestStats {
  totalTests: number;
  activeTests: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  eligibleEmployees: number;
}

export interface EligibleEmployee {
  id: string;
  name: string;
  department: string;
  email: string;
  is_active: boolean;
  test_eligible: boolean;
}

// =============================================
// SYSTEM SETTINGS TYPES
// =============================================

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  setting_type: 'string' | 'boolean' | 'integer' | 'time';
  description?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// STATISTICS & REPORTS TYPES
// =============================================

export interface AttendanceReportData {
  employee: string;
  department: string;
  workDays: number;
  presentDays: number;
  absences: number;
  rate: number;
}

export interface LeaveReportData {
  employee: string;
  department: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}

export interface DepartmentSummaryData {
  name: string;
  employees: number;
  attendance: number;
  leaves: number;
}

export interface TimesheetReportData {
  angajat: string;
  departament: string;
  prezenta: string;
  update_pr: string;
  lucru_acasa: string;
  status: string;
  ora_trimitere: string;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================
// ACTIVITY & HISTORY TYPES
// =============================================

export interface RecentActivity {
  id: string;
  employee_id: string;
  employeeName: string;
  department?: string;
  action: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
}

export interface TestAssignmentHistory {
  id: string;
  assignment_date: string;
  test_id: string;
  assigned_employees: string[];
  total_eligible_employees: number;
  assignment_method: string;
  created_at: string;
}

// =============================================
// FORM & VALIDATION TYPES
// =============================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormErrors {
  [key: string]: string;
}

// =============================================
// DATABASE QUERY TYPES
// =============================================

export interface QueryFilters {
  search?: string;
  department?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// =============================================
// EXPORT TYPE GROUPINGS FOR CONVENIENCE
// =============================================

// Export commonly used type unions
export type UserRole = 'admin' | 'employee';
export type TimesheetStatus = 'complete' | 'incomplete' | 'absent';

// Export type guards (these are actual runtime functions, not types)
export const isValidUserRole = (role: string): role is UserRole => {
  return ['admin', 'employee'].includes(role);
};

export const isValidLeaveType = (type: string): type is LeaveType => {
  return ['vacation', 'medical', 'personal', 'maternity', 'paternity', 'unpaid'].includes(type);
};

export const isValidTimesheetStatus = (status: string): status is TimesheetStatus => {
  return ['complete', 'incomplete', 'absent'].includes(status);
};

// =============================================
// TYPE UTILITY HELPERS
// =============================================

// Utility type for making all properties optional
export type PartialUpdate<T> = Partial<T> & {
  updated_at?: string;
};

// Utility type for creating data without timestamps
export type CreateData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

// Utility type for database responses
export type DatabaseRecord<T> = T & {
  id: string;
  created_at: string;
  updated_at: string;
};