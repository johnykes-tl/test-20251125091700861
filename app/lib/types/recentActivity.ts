// Recent Activity types
export interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  employeeName: string;
  department?: string;
  status: 'success' | 'warning' | 'error';
}

export interface TimesheetEntryWithEmployee {
  id: string;
  employee_id: string;
  entry_date: string;
  status: 'complete' | 'incomplete' | 'absent';
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
  employees: {
    id: string;
    name: string;
    department: string;
    is_active: boolean;
  } | null;
}

export interface LeaveRequestWithEmployee {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_date: string;
  approved_at: string | null;
  employees: {
    id: string;
    name: string;
    department: string;
    is_active: boolean;
  } | null;
}