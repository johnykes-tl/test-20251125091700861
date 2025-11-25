// Main entity for a timesheet option, matching the database schema
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

// Data required to create a new timesheet option
export interface CreateTimesheetOptionData {
  title: string;
  key: string;
  employee_text: string;
}

// Data for updating an existing timesheet option (all fields are optional)
export interface UpdateTimesheetOptionData {
  title?: string;
  key?: string;
  employee_text?: string;
  display_order?: number;
  active?: boolean;
}

// Main entity for a timesheet entry
export interface TimesheetEntry {
  id: string;
  employee_id: string;
  entry_date: string;
  timesheet_data: Record<string, boolean>;
  notes?: string | null;
  status: 'complete' | 'incomplete' | 'absent';
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Data for creating/updating a timesheet entry (used in employee page)
export interface EmployeeTimesheetData {
  employee_id: string;
  entry_date: string;
  timesheet_data: Record<string, boolean>;
  notes?: string;
}

// Data for creating a new timesheet entry
export type CreateTimesheetEntryData = EmployeeTimesheetData;

// Data for updating an existing timesheet entry (all fields are optional)
export interface UpdateTimesheetEntryData {
  timesheet_data?: Record<string, boolean>;
  notes?: string;
  status?: 'complete' | 'incomplete' | 'absent';
}

// Statistics for timesheet entries
export interface TimesheetStats {
  total: number;
  complete: number;
  incomplete: number;
  absent: number;
}