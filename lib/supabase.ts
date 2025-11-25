import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface UserProfile {
  id: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

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
  leave_date?: string;
  created_at: string;
  updated_at: string;
}

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

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days: number;
  leave_type: 'vacation' | 'medical' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_date: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  setting_type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}