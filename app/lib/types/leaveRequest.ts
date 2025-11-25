// Leave Request Types
export type LeaveType = 'vacation' | 'medical' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

// Base Leave Request interface
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

// Leave Request with Employee information (for admin views)
export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee_name: string;
  department: string;
  employee_email: string;
}

// For creating new leave requests
export interface CreateLeaveRequestData {
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
}

// For updating existing leave requests
export interface UpdateLeaveRequestData {
  start_date?: string;
  end_date?: string;
  leave_type?: LeaveType;
  reason?: string;
}

// ✅ FIXED: Employee Leave Balance with year property
export interface EmployeeLeaveBalance {
  employee_id: string;
  year: number;  // ✅ Added missing year property
  total_days_per_year: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

// Leave Request Statistics
export interface LeaveStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

// Leave Request Filters
export interface LeaveRequestFilters {
  employee_id?: string;
  status?: LeaveStatus;
  leave_type?: LeaveType;
  year?: number;
  month?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// API Response types
export interface LeaveRequestResponse {
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface LeaveRequestWithEmployeeResponse {
  data: LeaveRequestWithEmployee[];
  total: number;
  page: number;
  limit: number;
}

// Calendar Event type for leave calendar display
export interface LeaveCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  employee_name: string;
  leave_type: LeaveType;
  status: LeaveStatus;
  color?: string;
}

// Leave Request Form Data
export interface LeaveRequestFormData {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  employee_id?: string; // Optional for admin forms
}

// Leave Request Validation
export interface LeaveRequestValidation {
  isValid: boolean;
  errors: {
    start_date?: string;
    end_date?: string;
    leave_type?: string;
    reason?: string;
    date_range?: string;
    work_days?: string;
  };
}

// Department Leave Summary
export interface DepartmentLeaveSummary {
  department: string;
  total_employees: number;
  total_leave_days: number;
  pending_requests: number;
  average_days_per_employee: number;
}

// Monthly Leave Report
export interface MonthlyLeaveReport {
  month: string;
  year: number;
  total_requests: number;
  approved_requests: number;
  rejected_requests: number;
  pending_requests: number;
  total_days_taken: number;
  departments: DepartmentLeaveSummary[];
}

// Leave Policy Settings
export interface LeavePolicySettings {
  max_days_per_year: number;
  max_consecutive_days: number;
  min_notice_days: number;
  allow_negative_balance: boolean;
  require_approval: boolean;
  auto_approve_limit: number;
  blackout_periods: {
    start_date: string;
    end_date: string;
    reason: string;
  }[];
}

// Export utility types
export type LeaveRequestStatus = LeaveStatus;
export type LeaveRequestType = LeaveType;