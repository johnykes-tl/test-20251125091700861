export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
  phone: string;
  is_active: boolean;
  test_eligible: boolean; // ✅ Added missing property
  leave_date?: string;
  password_hash?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
  phone: string;
  is_active: boolean;
  test_eligible?: boolean; // ✅ Added to form data
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
  test_eligible?: boolean; // ✅ Added to update data
  leave_date?: string;
}