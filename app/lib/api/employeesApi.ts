// Employees API Client - MISSING FILE that broke Employee Management
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

class EmployeesApiClient {
  private supabase = createClient(supabaseUrl, supabaseAnonKey);

  // ✅ Load all employees
  async getEmployees() {
    try {
      console.log('🚀 API Client: Loading all employees');
      
      const response = await fetch('/api/employees', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ All employees loaded:', result.data.length);
      return result.data;
    } catch (error: any) {
      console.error('❌ Error loading employees:', error);
      throw error;
    }
  }

  // ✅ Load employees for dropdown with inactive option
  async getEmployeesForDropdown(options?: { include_inactive?: boolean }) {
    try {
      console.log('🚀 API Client: Loading employees for dropdown', options);
      
      const params = new URLSearchParams({ for_dropdown: 'true' });
      if (options?.include_inactive) {
        params.append('include_inactive', 'true');
      }

      const response = await fetch(`/api/employees?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error loading employees for dropdown:', error);
      throw error;
    }
  }

  // ✅ Get employee by user ID
  async getEmployeeByUserId(userId: string) {
    try {
      console.log('🚀 API Client: Loading employee by user ID:', userId);
      
      const response = await fetch(`/api/employees?user_id=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error loading employee by user ID:', error);
      throw error;
    }
  }

  // ✅ Get department statistics
  async getDepartmentStats() {
    try {
      console.log('🚀 API Client: Loading department stats');
      
      const response = await fetch('/api/employees/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error loading department stats:', error);
      throw error;
    }
  }

  // ✅ Get unique departments
  async getDepartments() {
    try {
      console.log('🚀 API Client: Loading departments');
      
      const response = await fetch('/api/employees/departments', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error loading departments:', error);
      throw error;
    }
  }

  // ✅ Create employee
  async createEmployee(employeeData: any) {
    try {
      console.log('🚀 API Client: Creating employee:', employeeData.email);
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Employee created successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error creating employee:', error);
      throw error;
    }
  }

  // ✅ Update employee
  async updateEmployee(employeeId: string, updateData: any) {
    try {
      console.log('🚀 API Client: Updating employee:', employeeId);
      
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Employee updated successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error updating employee:', error);
      throw error;
    }
  }

  // ✅ Activate employee
  async activateEmployee(employeeId: string) {
      try {
        console.log('🚀 API Client: Activating employee:', employeeId);
        const response = await fetch(`/api/employees?id=${employeeId}&action=activate`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true })
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error: any) {
        console.error('❌ Error activating employee:', error);
        throw error;
      }
  }

 // ✅ Deactivate employee
  async deactivateEmployee(employeeId: string) {
    try {
      console.log('🚀 API Client: Deactivating employee:', employeeId);
      
      const response = await fetch(`/api/employees?id=${employeeId}&action=deactivate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_active: false,
          leave_date: new Date().toISOString().split('T')[0]
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error deactivating employee:', error);
      throw error;
    }
  }

   // ✅ Toggle test eligibility
  async toggleTestEligibility(employeeId: string, eligible: boolean) {
    try {
      console.log('🚀 API Client: Toggling test eligibility:', { employeeId, eligible });
      
      const response = await fetch(`/api/employees?id=${employeeId}&action=toggle_test_eligibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_eligible: eligible })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error toggling test eligibility:', error);
      throw error;
    }
  }

  // ✅ Test connection
  async testConnection() {
    try {
      console.log('🚀 API Client: Testing connection');
      
      const response = await fetch('/api/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

export const employeesApi = new EmployeesApiClient();