// Simple, Robust Employees API Client - Rebuilt from scratch
export class EmployeesApiClient {
  private baseUrl = '/api/employees';

  // ✅ Get all employees
  async getEmployees() {
    try {
      console.log('📡 Fetching all employees...');
      
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch employees');
      }

      console.log('✅ Employees loaded:', result.data?.length || 0);
      return result.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching employees:', error);
      throw new Error(`Failed to load employees: ${error.message}`);
    }
  }

  // ✅ Get employee by user ID
  async getEmployeeByUserId(userId: string) {
    try {
      console.log('�� Fetching employee by user ID:', userId);
      
      const url = `${this.baseUrl}?user_id=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Employee not found');
      }

      console.log('✅ Employee loaded:', result.data?.name);
      return result.data;
    } catch (error: any) {
      console.error('❌ Error fetching employee by user ID:', error);
      throw new Error(`Failed to load employee: ${error.message}`);
    }
  }

  // ✅ Get employees for dropdown
  async getEmployeesForDropdown(options: { include_inactive?: boolean } = {}) {
    try {
      console.log('📡 Fetching employees for dropdown...');
      
      const params = new URLSearchParams({
        for_dropdown: 'true',
        ...(options.include_inactive && { include_inactive: 'true' })
      });

      const url = `${this.baseUrl}?${params}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dropdown employees');
      }

      return result.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching dropdown employees:', error);
      throw new Error(`Failed to load dropdown employees: ${error.message}`);
    }
  }

  // ✅ Create employee
  async createEmployee(employeeData: any) {
    try {
      console.log('📡 Creating employee:', employeeData.email);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create employee');
      }

      console.log('✅ Employee created successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error creating employee:', error);
      throw new Error(`Failed to create employee: ${error.message}`);
    }
  }

  // ✅ Update employee
  async updateEmployee(employeeId: string, updateData: any) {
    try {
      console.log('📡 Updating employee:', employeeId);
      
      const url = `${this.baseUrl}?id=${encodeURIComponent(employeeId)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update employee');
      }

      console.log('✅ Employee updated successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error updating employee:', error);
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  }

  // ✅ Activate employee
  async activateEmployee(employeeId: string) {
    try {
      const url = `${this.baseUrl}?id=${encodeURIComponent(employeeId)}&action=activate`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate employee');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error activating employee:', error);
      throw new Error(`Failed to activate employee: ${error.message}`);
    }
  }

  // ✅ Deactivate employee
  async deactivateEmployee(employeeId: string) {
    try {
      const url = `${this.baseUrl}?id=${encodeURIComponent(employeeId)}&action=deactivate`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          is_active: false,
          leave_date: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate employee');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error deactivating employee:', error);
      throw new Error(`Failed to deactivate employee: ${error.message}`);
    }
  }

  // ✅ Toggle test eligibility
  async toggleTestEligibility(employeeId: string, eligible: boolean) {
    try {
      const url = `${this.baseUrl}?id=${encodeURIComponent(employeeId)}&action=toggle_test_eligibility`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test_eligible: eligible }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle test eligibility');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error toggling test eligibility:', error);
      throw new Error(`Failed to toggle test eligibility: ${error.message}`);
    }
  }

  // ✅ Get department stats
  async getDepartmentStats() {
    try {
      console.log('📡 Fetching department stats...');
      
      const response = await fetch('/api/employees/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch department stats');
      }

      return result.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching department stats:', error);
      throw new Error(`Failed to load department stats: ${error.message}`);
    }
  }

  // ✅ Get departments
  async getDepartments() {
    try {
      console.log('�� Fetching departments...');
      
      const response = await fetch('/api/employees/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch departments');
      }

      return result.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching departments:', error);
      throw new Error(`Failed to load departments: ${error.message}`);
    }
  }

  // ✅ Test connection
  async testConnection() {
    try {
      const response = await fetch('/api/health-check');
      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const employeesApiClient = new EmployeesApiClient();