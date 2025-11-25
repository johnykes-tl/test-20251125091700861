// Leave request types based on database schema
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'vacation' | 'medical' | 'personal' | 'maternity' | 'paternity' | 'unpaid';

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
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
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
  status?: LeaveStatus;
  approved_by?: string;
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee_name: string;
  employee_department: string;
  employee_email: string;
}

export interface LeaveStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_days_requested: number;
  total_days_approved: number;
}

export interface EmployeeLeaveBalance {
  employee_id: string;
  employee_name: string;
  total_days_allocated: number;
  days_used: number;
  days_pending: number;
  days_remaining: number;
}

// API Response Types
export interface LeaveRequestResponse {
  data: LeaveRequest | null;
  error: string | null;
}

export interface LeaveRequestsResponse {
  data: LeaveRequest[];
  error: string | null;
  count?: number;
}

export interface LeaveStatsResponse {
  data: LeaveStats | null;
  error: string | null;
}