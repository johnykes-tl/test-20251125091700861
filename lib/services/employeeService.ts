import { supabase } from '../supabase';
import type { Employee } from '../supabase';

export const employeeService = {
  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get employee by user ID
  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new employee
  async createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update employee
  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete employee (soft delete by setting is_active to false)
  async deactivateEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ 
        is_active: false,
        leave_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Reactivate employee
  async reactivateEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ 
        is_active: true,
        leave_date: null
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Get active employees
  async getActiveEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get employees by department
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('department', department)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },
};