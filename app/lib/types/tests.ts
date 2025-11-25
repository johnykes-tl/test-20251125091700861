export interface Test {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  status: 'active' | 'inactive' | 'archived';
  assignment_type: 'automatic' | 'manual_employees' | 'manual_departments';
  assigned_employees?: string[];
  assigned_departments?: string[];
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TestAssignment {
  id: string;
  test_id: string;
  employee_id: string;
  assigned_date: string;
  due_date: string;
  status: 'pending' | 'completed' | 'skipped';
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
}

export interface CreateTestData {
  title: string;
  description: string;
  instructions?: string;
  status?: 'active' | 'inactive' | 'archived';
  assignment_type?: 'automatic' | 'manual_employees' | 'manual_departments';
  assigned_employees?: string[];
  assigned_departments?: string[];
}

export interface UpdateTestData {
  title?: string;
  description?: string;
  instructions?: string;
  status?: 'active' | 'inactive' | 'archived';
  assignment_type?: 'automatic' | 'manual_employees' | 'manual_departments';
  assigned_employees?: string[];
  assigned_departments?: string[];
}

export interface CreateTestAssignmentData {
  test_id: string;
  employee_id: string;
  assigned_date: string;
  due_date?: string;
}

export interface UpdateTestAssignmentData {
  status?: 'pending' | 'completed' | 'skipped';
  employee_id?: string;
  notes?: string;
  completed_at?: string | null;
}

export interface TestStats {
  totalTests: number;
  activeTests: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  eligibleEmployees: number;
}

// Employee test assignment types
export interface EmployeeTestAssignment {
  id: string;
  test_id: string;
  test_title: string;
  test_description: string;
  test_instructions?: string;
  assigned_date: string;
  due_date: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  notes?: string;
}

export interface EmployeeTestStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}