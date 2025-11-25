// Employee Type Definitions
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
  created_at?: string;
  updated_at?: string;
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
  name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
  phone: string;
  is_active: boolean;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  phone: string;
  isActive: boolean;
}

// API Response Types
export interface CreateEmployeeResponse {
  employee: Employee;
  userCreated: boolean;
  message: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
}

export interface DepartmentStats {
  department: string;
  count: number;
  active_count: number;
}