import { api } from './apiClient';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from '../../shared/types/Employee';

interface DepartmentStats {
  department: string;
  count: number;
  active_count: number;
}

class BackendEmployeeService {
  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/api/employees');
    return response.data || [];
  }

  // Get employees for dropdown (with inactive option)
  async getEmployeesForDropdown(options: { include_inactive?: boolean } = {}): Promise<Employee[]> {
    const params: Record<string, string> = {
      for_dropdown: 'true',
    };
    
    if (options.include_inactive) {
      params.include_inactive = 'true';
    }

    const response = await api.get<Employee[]>('/api/employees', params);
    return response.data || [];
  }

  // Get employee by user ID
  async getEmployeeByUserId(userId: string): Promise<Employee> {
    const response = await api.get<Employee[]>('/api/employees');
    const employees = response.data || [];
    
    const employee = employees.find(emp => emp.user_id === userId);
    if (!employee) {
      throw new Error('Employee profile not found');
    }
    
    return employee;
  }

  // Create new employee
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    const response = await api.post<Employee>('/api/employees', employeeData);
    return response.data!;
  }

  // Update employee
  async updateEmployee(employeeId: string, updateData: UpdateEmployeeData): Promise<Employee> {
    const response = await api.put<Employee>(`/api/employees?id=${employeeId}`, updateData);
    return response.data!;
  }

  // Deactivate employee
  async deactivateEmployee(employeeId: string): Promise<Employee> {
    return this.updateEmployee(employeeId, { 
      is_active: false, 
      leave_date: new Date().toISOString().split('T')[0] 
    });
  }

  // Reactivate employee
  async reactivateEmployee(employeeId: string): Promise<Employee> {
    return this.updateEmployee(employeeId, { 
      is_active: true, 
      leave_date: undefined 
    });
  }

  // Get departments
  async getDepartments(): Promise<string[]> {
    const response = await api.get<string[]>('/api/employees/departments');
    return response.data || [];
  }

  // Get department statistics
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    const response = await api.get<DepartmentStats[]>('/api/employees/stats');
    return response.data || [];
  }

  // Test database connection
  async testDatabaseConnection(): Promise<boolean> {
    try {
      const response = await api.get('/api/test-db-connection');
      return response.success;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export const backendEmployeeService = new BackendEmployeeService();